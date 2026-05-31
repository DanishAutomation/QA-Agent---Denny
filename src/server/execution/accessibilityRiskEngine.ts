import fs from "node:fs";
import type { Browser, Page } from "playwright-core";
import type {
  AccessibilityRiskItem,
  AccessibilityRiskReport,
  DiscoveryPage,
} from "@/types";
import type { ReportPaths } from "./reportWriter";
import { pickDiscoverySamplePages } from "./discoverySamplePages";

function pushFinding(
  findings: AccessibilityRiskItem[],
  item: Omit<AccessibilityRiskItem, "id">
) {
  findings.push({ id: `${item.category}-${findings.length + 1}`, ...item });
}

async function collectPageFindings(page: Page, pageUrl: string): Promise<AccessibilityRiskItem[]> {
  const findings: AccessibilityRiskItem[] = [];

  const checks = await page.evaluate(() => {
    const missingAlt = Array.from(document.querySelectorAll("img")).filter(
      (img) => !(img.getAttribute("alt") || "").trim()
    ).length;

    const unlabeledInputs = Array.from(
      document.querySelectorAll("input, textarea, select")
    ).filter((field) => {
      const el = field as HTMLElement;
      const id = el.getAttribute("id");
      const ariaLabel = el.getAttribute("aria-label");
      const ariaLabelledBy = el.getAttribute("aria-labelledby");
      const placeholder = el.getAttribute("placeholder");
      const hasLabel = id
        ? document.querySelector(`label[for="${CSS.escape(id)}"]`)
        : el.closest("label");
      return !hasLabel && !ariaLabel && !ariaLabelledBy && !placeholder;
    }).length;

    const hasCookieMarker = Boolean(
      document.querySelector("[id*='cookie' i], [class*='cookie' i]")
    );
    const hasCookieButton = Array.from(
      document.querySelectorAll("button, a, [role='button']")
    ).some((node) => /accept|allow|agree|consent/i.test((node.textContent || "").trim()));
    const hasCookieConsent = hasCookieMarker || hasCookieButton;

    const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((h) =>
      Number(h.tagName.substring(1))
    );
    let headingStructureIssue = false;
    for (let i = 1; i < headings.length; i += 1) {
      if (headings[i] - headings[i - 1] > 1) {
        headingStructureIssue = true;
        break;
      }
    }

    const focusable = Array.from(
      document.querySelectorAll(
        "a, button, input, select, textarea, [tabindex]:not([tabindex='-1'])"
      )
    ).slice(0, 30) as HTMLElement[];

    let focusVisibilityIssue = false;
    for (const el of focusable) {
      const style = window.getComputedStyle(el);
      if (style.outlineStyle === "none" || style.outlineWidth === "0px") {
        focusVisibilityIssue = true;
        break;
      }
    }

    const keyboardNavIssue = focusable.length < 3;

    const contrastWarning = Array.from(document.querySelectorAll("p, span, a"))
      .slice(0, 80)
      .some((node) => {
        const style = window.getComputedStyle(node as Element);
        const fg = style.color;
        const bg = style.backgroundColor;
        return fg === bg;
      });

    return {
      missingAlt,
      unlabeledInputs,
      hasCookieConsent,
      headingStructureIssue,
      focusVisibilityIssue,
      keyboardNavIssue,
      contrastWarning,
    };
  });

  if (!checks.hasCookieConsent) {
    pushFinding(findings, {
      category: "cookie-consent",
      severity: "low",
      message: "Cookie consent UI was not detected on inspected page.",
      pageUrl,
    });
  }
  if (checks.missingAlt > 0) {
    pushFinding(findings, {
      category: "missing-alt-text",
      severity: checks.missingAlt > 5 ? "high" : "medium",
      message: `${checks.missingAlt} image(s) appear to be missing alt text.`,
      pageUrl,
    });
  }
  if (checks.unlabeledInputs > 0) {
    pushFinding(findings, {
      category: "missing-form-labels",
      severity: checks.unlabeledInputs > 4 ? "high" : "medium",
      message: `${checks.unlabeledInputs} form control(s) appear unlabeled.`,
      pageUrl,
    });
  }
  if (checks.keyboardNavIssue) {
    pushFinding(findings, {
      category: "keyboard-navigation",
      severity: "medium",
      message: "Limited keyboard-focusable interactive controls detected.",
      pageUrl,
    });
  }
  if (checks.focusVisibilityIssue) {
    pushFinding(findings, {
      category: "focus-visibility",
      severity: "high",
      message: "Focus outline visibility may be insufficient on interactive elements.",
      pageUrl,
    });
  }
  if (checks.contrastWarning) {
    pushFinding(findings, {
      category: "contrast-warning",
      severity: "medium",
      message: "Potential low-contrast text combinations were detected.",
      pageUrl,
    });
  }
  if (checks.headingStructureIssue) {
    pushFinding(findings, {
      category: "heading-structure",
      severity: "low",
      message: "Heading hierarchy appears to skip levels in some sections.",
      pageUrl,
    });
  }

  return findings;
}

export async function runAccessibilityRiskChecks(params: {
  browser: Browser;
  baseUrl: string;
  reportPaths: ReportPaths;
  discoveryPages?: DiscoveryPage[];
}): Promise<AccessibilityRiskReport> {
  const { browser, baseUrl, reportPaths, discoveryPages = [] } = params;
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const findings: AccessibilityRiskItem[] = [];
  const samplePages = pickDiscoverySamplePages(discoveryPages, baseUrl, 5);

  try {
    for (const sampleUrl of samplePages) {
      await page.goto(sampleUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => undefined);
      const pageFindings = await collectPageFindings(page, page.url());
      findings.push(...pageFindings);
    }
  } finally {
    await context.close();
  }

  const report: AccessibilityRiskReport = {
    baseUrl,
    checkedAt: new Date().toISOString(),
    findings,
    summary: {
      totalFindings: findings.length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
    },
    disclaimer:
      "Accessibility Risk Findings are heuristic indicators only and are not a certification for ADA, HIPAA, or legal compliance.",
  };

  fs.writeFileSync(
    reportPaths.accessibilityRiskReportJsonPath,
    JSON.stringify({ ...report, pagesSampled: samplePages.length }, null, 2),
    "utf-8"
  );
  return report;
}
