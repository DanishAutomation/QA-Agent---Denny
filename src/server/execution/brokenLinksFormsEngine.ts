import fs from "node:fs";
import path from "node:path";
import type { Browser, Page } from "playwright-core";
import type {
  BrokenLinkCategory,
  BrokenLinkFailureType,
  BrokenLinkFinding,
  BrokenLinksReport,
  DetectedFormType,
  DiscoveryPage,
  FormsTestingReport,
  FormValidationResult,
  ParsedInstructionData,
} from "@/types";
import type { ReportPaths } from "./reportWriter";
import {
  buildCrawledUrlSet,
  pickDiscoverySamplePages,
} from "./discoverySamplePages";

interface LinkCandidate {
  fromUrl: string;
  targetUrl: string;
  category: BrokenLinkCategory;
}

function toAbsoluteUrl(baseUrl: string, href: string): string | null {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function normalizeUrlKey(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "") || "/";
    return `${parsed.origin}${path}${parsed.search}`;
  } catch {
    return url;
  }
}

function shouldSkipLinkTarget(targetUrl: string): boolean {
  if (!targetUrl || targetUrl.startsWith("mailto:") || targetUrl.startsWith("tel:")) {
    return true;
  }
  try {
    const parsed = new URL(targetUrl);
    if (parsed.hash && (parsed.pathname === "/" || parsed.pathname === "") && !parsed.search) {
      return true;
    }
    if (parsed.href.endsWith("#") || parsed.href.endsWith("/#")) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

function detectFailureType(
  statusCode: number | undefined,
  timedOut: boolean,
  redirectLoop: boolean
): BrokenLinkFailureType {
  if (redirectLoop) return "redirect-loop";
  if (timedOut) return "timeout";
  if (statusCode === 403) return "403";
  if (statusCode && statusCode >= 500) return "500";
  return "404";
}

function isConfirmedFailure(failureType: BrokenLinkFailureType): boolean {
  return failureType !== "403" && failureType !== "blocked";
}

async function verifyLinkWithBrowser(
  page: Page,
  targetUrl: string,
  crawledUrls: Set<string>
): Promise<{
  statusCode?: number;
  timedOut: boolean;
  redirectLoop: boolean;
  skippedAsHealthy: boolean;
}> {
  const key = normalizeUrlKey(targetUrl);
  if (crawledUrls.has(key) || crawledUrls.has(targetUrl.replace(/\/$/, ""))) {
    return { skippedAsHealthy: true, timedOut: false, redirectLoop: false, statusCode: 200 };
  }

  try {
    const response = await page.request.get(targetUrl, {
      timeout: 12000,
      maxRedirects: 6,
    });
    const status = response.status();
    return { statusCode: status, timedOut: false, redirectLoop: false, skippedAsHealthy: false };
  } catch {
    return { timedOut: true, redirectLoop: false, skippedAsHealthy: false };
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length || 1));
  const results = new Array<R>(items.length);
  let cursor = 0;

  const workers = Array.from({ length: safeConcurrency }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index]);
    }
  });

  await Promise.all(workers);
  return results;
}

async function extractLinksFromPage(page: Page, fromUrl: string): Promise<LinkCandidate[]> {
  return page.evaluate((currentUrl) => {
    const candidates: LinkCandidate[] = [];
    const anchors = Array.from(document.querySelectorAll("a[href]")).slice(0, 180);
    for (const anchor of anchors) {
      const href = (anchor as HTMLAnchorElement).getAttribute("href") ?? "";
      const text = ((anchor as HTMLElement).innerText || "").toLowerCase();
      const parentHeader = anchor.closest("header, nav");
      const parentFooter = anchor.closest("footer");
      const parentImage = anchor.querySelector("img");
      let category: BrokenLinkCategory = "internal";
      if (parentHeader) category = "header";
      else if (parentFooter) category = "footer";
      else if (parentImage) category = "image-link";
      else if (/buy|shop|start|signup|sign up|contact|learn more|get started/.test(text)) {
        category = "cta";
      }
      candidates.push({
        fromUrl: currentUrl,
        targetUrl: href,
        category,
      });
    }
    return candidates;
  }, fromUrl);
}

function detectFormType(descriptor: string): DetectedFormType {
  const text = descriptor.toLowerCase();
  if (/contact|message|support/.test(text)) return "contact";
  if (/newsletter|subscribe/.test(text)) return "newsletter";
  if (/quote|estimate/.test(text)) return "quote";
  if (/register|signup|sign up/.test(text)) return "registration";
  if (/search/.test(text)) return "search";
  return "other";
}

function isSensitiveForm(descriptor: string): boolean {
  const text = descriptor.toLowerCase();
  return /password|payment|card|checkout|delete account|cancel order|bank/.test(text);
}

function safeFieldValue(name: string, parsed?: ParsedInstructionData): string {
  const key = name.toLowerCase();
  if (/email/.test(key)) return parsed?.signup.email ?? parsed?.login.email ?? "qa.user@example.test";
  if (/name/.test(key)) return parsed?.signup.name ?? parsed?.address.name ?? "Denny QA User";
  if (/phone|mobile/.test(key)) return parsed?.signup.phone ?? parsed?.address.phone ?? "+12025550199";
  if (/city/.test(key)) return parsed?.address.city ?? "London";
  if (/state|province/.test(key)) return parsed?.address.state ?? "Greater London";
  if (/zip|postal/.test(key)) return parsed?.address.zip ?? "NW16XE";
  if (/country/.test(key)) return parsed?.address.country ?? "UK";
  if (/search/.test(key)) return "test query";
  return "QA Test Value";
}

async function testFormsOnPage(params: {
  page: Page;
  reportPaths: ReportPaths;
  safeTestMode?: boolean;
  parsedInstructions?: ParsedInstructionData;
  formResults: FormValidationResult[];
  formIndexOffset: number;
}): Promise<number> {
  const { page, reportPaths, safeTestMode, parsedInstructions, formResults, formIndexOffset } =
    params;

  const formsMeta = await page.evaluate(() => {
    const forms = Array.from(document.querySelectorAll("form")).slice(0, 20);
    return forms.map((form, index) => {
      const text = (form.textContent || "").toLowerCase();
      const action = (form as HTMLFormElement).action || "";
      const descriptor = `${text} ${action}`.slice(0, 500);
      const requiredFields = Array.from(
        form.querySelectorAll("input[required], textarea[required], select[required]")
      ).map((field) => ({
        name:
          field.getAttribute("name") ||
          field.getAttribute("id") ||
          field.getAttribute("placeholder") ||
          `required-${index}`,
        tag: field.tagName.toLowerCase(),
        type: (field.getAttribute("type") || "").toLowerCase(),
      }));
      const emailField = form.querySelector("input[type='email']") as HTMLInputElement | null;
      const submitButton = form.querySelector(
        "button[type='submit'], input[type='submit'], button:not([type])"
      ) as HTMLElement | null;
      return {
        index,
        descriptor,
        requiredFields,
        hasEmailField: Boolean(emailField),
        hasSubmitButton: Boolean(submitButton),
      };
    });
  });

  let nextIndex = formIndexOffset;
  for (const formMeta of formsMeta) {
    const formType = detectFormType(formMeta.descriptor);
    const notes: string[] = [];
    let requiredFieldsOk = true;
    let invalidEmailValidationOk = true;
    let validationMessageDetected = false;
    let successfulSubmissionAttempted = false;
    let successfulSubmissionPassed = false;
    let skippedSubmissionReason: string | undefined;

    const formLocator = page.locator("form").nth(formMeta.index);
    if ((await formLocator.count()) === 0) {
      continue;
    }

    for (const field of formMeta.requiredFields) {
      const locator = formLocator.locator(
        `[name="${field.name}"], #${field.name}, [placeholder*="${field.name}" i]`
      );
      if ((await locator.count()) === 0) {
        requiredFieldsOk = false;
        notes.push(`Required field "${field.name}" not directly mappable.`);
        continue;
      }
      await locator.first().fill(safeFieldValue(field.name, parsedInstructions));
    }

    if (formMeta.hasEmailField) {
      const email = formLocator.locator("input[type='email']").first();
      await email.fill("invalid-email");
      const submitButton = formLocator
        .locator("button[type='submit'], input[type='submit'], button:not([type])")
        .first();
      if ((await submitButton.count()) > 0) {
        await submitButton.click().catch(() => undefined);
        invalidEmailValidationOk = Boolean(await page.locator(":invalid").count());
        validationMessageDetected =
          invalidEmailValidationOk ||
          (await page.locator("text=/invalid|required|please enter|email/i").count()) > 0;
      }
      await email.fill(parsedInstructions?.signup.email ?? "qa.user@example.test");
    }

    const sensitive = isSensitiveForm(formMeta.descriptor);
    if (sensitive) {
      skippedSubmissionReason = "Sensitive/destructive form detected; submission skipped.";
    } else if (!safeTestMode && formType !== "search") {
      skippedSubmissionReason = "Safe test mode disabled for non-search submission.";
    } else if (formMeta.hasSubmitButton) {
      successfulSubmissionAttempted = true;
      const submitButton = formLocator
        .locator("button[type='submit'], input[type='submit'], button:not([type])")
        .first();
      const beforeUrl = page.url();
      await submitButton.click().catch(() => undefined);
      await page.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => undefined);
      const afterUrl = page.url();
      const successMessage =
        (await page.locator("text=/thank you|submitted|success|received|done/i").count()) > 0;
      successfulSubmissionPassed = successMessage || beforeUrl !== afterUrl;
    } else {
      skippedSubmissionReason = "No submit control available.";
    }

    const screenshotPath = path.join(
      reportPaths.formsScreenshotsDir,
      `form-${nextIndex}-${formType}.png`
    );
    await formLocator.screenshot({ path: screenshotPath }).catch(async () => {
      await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => undefined);
    });
    notes.push(`Form screenshot: ${screenshotPath}`);

    formResults.push({
      pageUrl: page.url(),
      formType,
      requiredFieldsOk,
      invalidEmailValidationOk,
      validationMessageDetected,
      successfulSubmissionAttempted,
      successfulSubmissionPassed,
      skippedSubmissionReason,
      notes,
    });
    nextIndex += 1;
  }

  return nextIndex;
}

const MAX_SAMPLE_PAGES = 4;
const MAX_LINKS_TO_VERIFY = 50;
const POST_RUN_LINK_CHECK_MS = 90_000;

export async function runBrokenLinksAndFormsTesting(params: {
  browser: Browser;
  baseUrl: string;
  reportPaths: ReportPaths;
  safeTestMode?: boolean;
  parsedInstructions?: ParsedInstructionData;
  discoveryPages?: DiscoveryPage[];
}): Promise<{ brokenLinksReport: BrokenLinksReport; formsReport: FormsTestingReport }> {
  return Promise.race([
    runBrokenLinksAndFormsTestingInternal(params),
    new Promise<{ brokenLinksReport: BrokenLinksReport; formsReport: FormsTestingReport }>(
      (_, reject) => {
        setTimeout(
          () => reject(new Error("Broken links and forms analysis timed out after 90s.")),
          POST_RUN_LINK_CHECK_MS
        );
      }
    ),
  ]);
}

async function runBrokenLinksAndFormsTestingInternal(params: {
  browser: Browser;
  baseUrl: string;
  reportPaths: ReportPaths;
  safeTestMode?: boolean;
  parsedInstructions?: ParsedInstructionData;
  discoveryPages?: DiscoveryPage[];
}): Promise<{ brokenLinksReport: BrokenLinksReport; formsReport: FormsTestingReport }> {
  const { browser, baseUrl, reportPaths, safeTestMode, parsedInstructions, discoveryPages = [] } =
    params;
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const brokenFindings: BrokenLinkFinding[] = [];
  const formResults: FormValidationResult[] = [];
  let checkedLinks = 0;
  let blockedCount = 0;
  let confirmedFailedCount = 0;

  const crawledUrls = buildCrawledUrlSet(discoveryPages, baseUrl);
  const samplePages = pickDiscoverySamplePages(discoveryPages, baseUrl, MAX_SAMPLE_PAGES);
  const origin = new URL(baseUrl).origin;

  try {
    const dedupedLinks = new Map<string, LinkCandidate>();

    for (const sampleUrl of samplePages) {
      await page.goto(sampleUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => undefined);

      const links = await extractLinksFromPage(page, page.url());
      for (const item of links) {
        const absolute = toAbsoluteUrl(page.url(), item.targetUrl);
        if (!absolute || !absolute.startsWith(origin) || shouldSkipLinkTarget(absolute)) {
          continue;
        }
        if (!dedupedLinks.has(absolute)) {
          dedupedLinks.set(absolute, { ...item, targetUrl: absolute, fromUrl: page.url() });
        }
      }

      await testFormsOnPage({
        page,
        reportPaths,
        safeTestMode,
        parsedInstructions,
        formResults,
        formIndexOffset: formResults.length,
      });
    }

    const linkCandidates = [...dedupedLinks.values()].slice(0, MAX_LINKS_TO_VERIFY);
    checkedLinks += linkCandidates.length;
    const linkOutcomes = await mapWithConcurrency(linkCandidates, 4, async (candidate) => {
      const check = await verifyLinkWithBrowser(page, candidate.targetUrl, crawledUrls);
      return { candidate, check };
    });

    for (const { candidate, check } of linkOutcomes) {
      if (check.skippedAsHealthy) {
        continue;
      }
      if (
        check.timedOut ||
        check.redirectLoop ||
        (check.statusCode !== undefined && check.statusCode >= 400)
      ) {
        const failureType = detectFailureType(
          check.statusCode,
          check.timedOut,
          check.redirectLoop
        );
        if (!isConfirmedFailure(failureType)) {
          blockedCount += 1;
        } else {
          confirmedFailedCount += 1;
        }
        brokenFindings.push({
          fromUrl: candidate.fromUrl,
          targetUrl: candidate.targetUrl,
          category: candidate.category,
          failureType,
          statusCode: check.statusCode,
        });
      }
    }
  } finally {
    await context.close();
  }

  const brokenLinksReport: BrokenLinksReport = {
    baseUrl,
    checkedAt: new Date().toISOString(),
    checkedCount: checkedLinks,
    failedCount: brokenFindings.length,
    confirmedFailedCount,
    blockedCount,
    pagesSampled: samplePages.length,
    findings: brokenFindings,
  };

  const formsReport: FormsTestingReport = {
    baseUrl,
    checkedAt: new Date().toISOString(),
    formsDetected: formResults.length,
    results: formResults,
  };

  fs.writeFileSync(
    reportPaths.brokenLinksReportJsonPath,
    JSON.stringify(brokenLinksReport, null, 2),
    "utf-8"
  );
  fs.writeFileSync(reportPaths.formsReportJsonPath, JSON.stringify(formsReport, null, 2), "utf-8");

  return { brokenLinksReport, formsReport };
}
