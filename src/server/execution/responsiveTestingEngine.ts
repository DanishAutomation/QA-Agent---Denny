import fs from "node:fs";
import path from "node:path";
import type { Browser, BrowserContext } from "playwright-core";
import type {
  ResponsiveTestReport,
  ResponsiveViewportConfig,
  ResponsiveViewportFinding,
} from "@/types";
import type { ReportPaths } from "./reportWriter";
import { pickDiscoverySamplePages } from "./discoverySamplePages";
import type { DiscoveryPage } from "@/types";

const RESPONSIVE_VIEWPORTS: ResponsiveViewportConfig[] = [
  {
    name: "Android viewport",
    width: 412,
    height: 915,
    userAgent: "Mozilla/5.0 (Linux; Android 13)",
  },
  {
    name: "iPhone viewport",
    width: 390,
    height: 844,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
  },
  {
    name: "iPad viewport",
    width: 820,
    height: 1180,
    userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
  },
  {
    name: "Tablet viewport",
    width: 1024,
    height: 1366,
    userAgent: "Mozilla/5.0 (Linux; Android 13; Tablet)",
  },
  {
    name: "Desktop viewport",
    width: 1440,
    height: 900,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  },
];

async function auditViewport(
  context: BrowserContext,
  pageUrl: string,
  viewport: ResponsiveViewportConfig,
  screenshotPath: string,
  timeoutMs: number
): Promise<ResponsiveViewportFinding> {
  const page = await context.newPage();
  const notes: string[] = [];
  let finding: ResponsiveViewportFinding = {
    viewport: viewport.name,
    layoutBreakage: false,
    hiddenCtas: false,
    horizontalScroll: false,
    menuUsabilityIssue: false,
    formVisibilityIssue: false,
    overlappingElements: false,
    cartOrSearchVisibilityIssue: false,
    screenshotPath,
    notes,
  };

  try {
    await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForLoadState("networkidle", { timeout: timeoutMs });

    const checks = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const horizontalScroll =
        document.documentElement.scrollWidth > viewportWidth ||
        document.body.scrollWidth > viewportWidth;

      const ctaSelectors = [
        "button",
        "a[role='button']",
        "[data-testid*='cta' i]",
        "button[class*='cart' i]",
      ];
      const ctas = Array.from(document.querySelectorAll(ctaSelectors.join(","))).slice(0, 40);
      const hiddenCtas = ctas.some((node) => {
        const el = node as HTMLElement;
        const style = window.getComputedStyle(el);
        return (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.opacity === "0" ||
          el.offsetWidth === 0 ||
          el.offsetHeight === 0
        );
      });

      const navCandidates = Array.from(
        document.querySelectorAll("nav, [role='navigation'], button[aria-label*='menu' i]")
      );
      const menuUsabilityIssue = navCandidates.length === 0;

      const forms = Array.from(document.querySelectorAll("form"));
      const formVisibilityIssue = forms.some((form) => {
        const el = form as HTMLElement;
        const style = window.getComputedStyle(el);
        return style.display === "none" || style.visibility === "hidden";
      });

      const overlapTargets = Array.from(
        document.querySelectorAll("button, input, select, textarea, a")
      ).slice(0, 60);
      const overlappingElements = overlapTargets.some((node) => {
        const el = node as HTMLElement;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;
        const topEl = document.elementFromPoint(x, y);
        return Boolean(topEl && topEl !== el && !el.contains(topEl));
      });

      const cartSearchCandidates = Array.from(
        document.querySelectorAll(
          "[aria-label*='cart' i], [aria-label*='search' i], .cart, .search, [data-testid*='cart' i], [data-testid*='search' i]"
        )
      );
      const cartOrSearchVisibilityIssue = cartSearchCandidates.some((node) => {
        const el = node as HTMLElement;
        const style = window.getComputedStyle(el);
        return style.display === "none" || style.visibility === "hidden" || el.offsetWidth === 0;
      });

      const layoutBreakage =
        horizontalScroll ||
        Array.from(document.querySelectorAll("*")).some((node) => {
          const el = node as HTMLElement;
          const rect = el.getBoundingClientRect();
          return rect.right > viewportWidth + 2;
        });

      return {
        layoutBreakage,
        hiddenCtas,
        horizontalScroll,
        menuUsabilityIssue,
        formVisibilityIssue,
        overlappingElements,
        cartOrSearchVisibilityIssue,
      };
    });

    finding = { ...finding, ...checks };

    if (checks.layoutBreakage) notes.push("Potential layout breakage detected.");
    if (checks.hiddenCtas) notes.push("One or more CTAs appear hidden.");
    if (checks.horizontalScroll) notes.push("Horizontal scroll detected.");
    if (checks.menuUsabilityIssue) notes.push("Menu/navigation usability risk detected.");
    if (checks.formVisibilityIssue) notes.push("Form visibility issue detected.");
    if (checks.overlappingElements) notes.push("Potential overlapping clickable elements detected.");
    if (checks.cartOrSearchVisibilityIssue) {
      notes.push("Cart/search element visibility issue detected.");
    }

    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (error) {
    notes.push(
      `Responsive audit failed for ${viewport.name}: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);
  } finally {
    await page.close();
  }

  return finding;
}

export async function runResponsiveTestingEngine(params: {
  browser: Browser;
  baseUrl: string;
  reportPaths: ReportPaths;
  timeoutMs?: number;
  discoveryPages?: DiscoveryPage[];
}): Promise<ResponsiveTestReport> {
  const { browser, baseUrl, reportPaths, timeoutMs = 30_000, discoveryPages = [] } = params;
  const findings: ResponsiveViewportFinding[] = [];
  const samplePages = pickDiscoverySamplePages(discoveryPages, baseUrl, 4);
  const innerPages = samplePages.slice(1, 3);

  for (const viewport of RESPONSIVE_VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      userAgent: viewport.userAgent,
      ignoreHTTPSErrors: true,
    });
    const screenshotName = `${viewport.name.replace(/\s+/g, "-").toLowerCase()}.png`;
    const screenshotPath = path.join(reportPaths.responsiveScreenshotsDir, screenshotName);
    const finding = await auditViewport(
      context,
      baseUrl,
      viewport,
      screenshotPath,
      timeoutMs
    );
    findings.push(finding);

    if (viewport.name === "Desktop viewport") {
      for (const innerUrl of innerPages) {
        const slug = innerUrl.replace(/[^a-z0-9]+/gi, "-").slice(0, 40);
        const innerScreenshot = path.join(
          reportPaths.responsiveScreenshotsDir,
          `desktop-${slug}.png`
        );
        findings.push(
          await auditViewport(context, innerUrl, viewport, innerScreenshot, timeoutMs)
        );
      }
    }

    await context.close();
  }

  const issueViewports = findings.filter((item) =>
    [
      item.layoutBreakage,
      item.hiddenCtas,
      item.horizontalScroll,
      item.menuUsabilityIssue,
      item.formVisibilityIssue,
      item.overlappingElements,
      item.cartOrSearchVisibilityIssue,
    ].some(Boolean)
  );

  const report: ResponsiveTestReport = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    findings,
    summary: {
      totalViewports: findings.length,
      issueCount: issueViewports.reduce(
        (sum, item) =>
          sum +
          [
            item.layoutBreakage,
            item.hiddenCtas,
            item.horizontalScroll,
            item.menuUsabilityIssue,
            item.formVisibilityIssue,
            item.overlappingElements,
            item.cartOrSearchVisibilityIssue,
          ].filter(Boolean).length,
        0
      ),
      issueViewports: issueViewports.length,
    },
  };

  fs.writeFileSync(reportPaths.responsiveReportJsonPath, JSON.stringify(report, null, 2), "utf-8");
  return report;
}
