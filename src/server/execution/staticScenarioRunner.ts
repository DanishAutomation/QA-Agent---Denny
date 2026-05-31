import type { Page } from "playwright-core";
import type { PlaywrightExecutionConfig } from "@/types";
import {
  isBotChallengeTitle,
  pickNavigationSamplePages,
  pickStaticContentPages,
} from "./discoverySamplePages";

async function assertPageHealthy(page: Page, url: string, timeoutMs: number): Promise<void> {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: timeoutMs,
  });
  await page.waitForSelector("body", { state: "attached", timeout: timeoutMs });
  const title = (await page.title()).trim();
  if (!title) {
    throw new Error(`Page loaded without title: ${url}`);
  }
  if (isBotChallengeTitle(title)) {
    throw new Error(`Bot challenge page detected instead of content: ${url}`);
  }
  const status = response?.status();
  if (status && status >= 400) {
    throw new Error(`HTTP ${status} when loading ${url}`);
  }
  const bodyLength = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
  if (bodyLength < 80) {
    throw new Error(`Page content too thin at ${url}`);
  }
}

export async function runStaticScenarioValidation(params: {
  page: Page;
  config: PlaywrightExecutionConfig;
  feature: string;
}): Promise<string> {
  const { page, config, feature } = params;
  const pages = config.discoveryPages ?? [];
  const timeoutMs = config.timeoutMs ?? 30_000;
  const featureKey = feature.toLowerCase();

  if (pages.length === 0) {
    await assertPageHealthy(page, config.baseUrl, timeoutMs);
    return page.url();
  }

  if (featureKey.includes("navigation")) {
    const targets = pickNavigationSamplePages(pages, config.baseUrl);
    for (const url of targets) {
      await assertPageHealthy(page, url, timeoutMs);
    }
    return page.url();
  }

  if (featureKey.includes("static")) {
    const targets = pickStaticContentPages(pages, config.baseUrl);
    for (const url of targets) {
      await assertPageHealthy(page, url, timeoutMs);
    }
    return page.url();
  }

  if (featureKey.includes("contact") || featureKey.includes("form")) {
    const contactUrl =
      pages.find((item) => /contact/i.test(item.url))?.url ??
      pickStaticContentPages(pages, config.baseUrl)[0] ??
      config.baseUrl;
    await assertPageHealthy(page, contactUrl, timeoutMs);
    const formCount = await page.locator("form").count();
    if (formCount === 0) {
      throw new Error(`No form found on ${contactUrl} for form validation scenario.`);
    }
    return page.url();
  }

  if (
    featureKey.includes("broken") ||
    featureKey.includes("responsive") ||
    featureKey.includes("accessibility")
  ) {
    const sample = pickNavigationSamplePages(pages, config.baseUrl).slice(0, 3);
    for (const url of sample) {
      await assertPageHealthy(page, url, timeoutMs);
    }
    return page.url();
  }

  await assertPageHealthy(page, config.baseUrl, timeoutMs);
  return page.url();
}

export function isStaticSuiteScenario(config: PlaywrightExecutionConfig, feature: string): boolean {
  if (config.siteSuite === "static") {
    return true;
  }
  if (config.siteSuite === "ecommerce") {
    return false;
  }
  if (config.siteSuite === "mixed") {
    return /navigation|static|contact|form|broken|responsive|accessibility|newsletter|quote|blog/i.test(
      feature
    );
  }
  return /navigation|static|contact|form|broken|responsive|accessibility/i.test(feature);
}
