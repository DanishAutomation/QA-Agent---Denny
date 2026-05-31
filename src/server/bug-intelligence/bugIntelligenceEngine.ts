import type { ExecutionRunResult, HumanFriendlyBugReport, ScenarioExecutionResult } from "@/types";
import { generatePostRunBugReports } from "@/server/execution/postRunReportSync";
import { filterConsoleErrors, isSiteOwnedConsoleIssue } from "@/server/execution/executionNoiseFilter";

function deriveSeverity(scenario: ScenarioExecutionResult): HumanFriendlyBugReport["severity"] {
  const text = `${scenario.feature} ${scenario.scenario} ${scenario.errorReason ?? ""}`.toLowerCase();

  if (/checkout/.test(text)) return "Critical";
  if (/add to cart/.test(text)) return /blocked|fail|error/.test(text) ? "Critical" : "High";
  if (/login|sign in/.test(text)) return "High";
  if (/search/.test(text)) return "High";
  if (/accessibility/.test(text) && /high-severity/.test(text)) return "High";
  if (/responsive/.test(text) && /6\/6|multiple viewports/.test(text)) return "High";
  if (/broken link/.test(text) && /checkout|buy|pay|signup|login/.test(text)) return "High";
  if (/broken link/.test(text)) return "Medium";
  if (/intlTelInput|console error/.test(text)) return "Medium";
  if (/static/.test(text) && /visual|layout|style/.test(text)) return "Low";
  if (/static/.test(text)) return "Medium";
  return "Medium";
}

function severityToPriority(severity: HumanFriendlyBugReport["severity"]): HumanFriendlyBugReport["priority"] {
  if (severity === "Critical") return "P0";
  if (severity === "High") return "P1";
  if (severity === "Medium") return "P2";
  return "P3";
}

function siteHostnameFromUrl(pageUrl: string): string {
  try {
    return new URL(pageUrl).hostname;
  } catch {
    return "";
  }
}

function ownedConsoleErrors(scenario: ScenarioExecutionResult): string[] {
  const host = siteHostnameFromUrl(scenario.pageUrl);
  return filterConsoleErrors(scenario.consoleErrors, host).filter(isSiteOwnedConsoleIssue);
}

function primarySiteNetworkErrors(scenario: ScenarioExecutionResult): string[] {
  const host = siteHostnameFromUrl(scenario.pageUrl);
  return scenario.networkErrors.filter((line) => {
    const urlMatch = line.match(/https?:\/\/[^\s]+/i);
    if (!urlMatch) return false;
    try {
      const errorHost = new URL(urlMatch[0]).hostname;
      return errorHost === host || errorHost.endsWith(`.${host}`);
    } catch {
      return false;
    }
  });
}

function extractPrimaryFailure(scenario: ScenarioExecutionResult): string {
  if (scenario.errorReason?.trim()) {
    return scenario.errorReason.trim();
  }
  const ownedConsole = ownedConsoleErrors(scenario);
  if (ownedConsole.length > 0) {
    return `Console error: ${ownedConsole[0]}`;
  }
  const siteNetwork = primarySiteNetworkErrors(scenario);
  if (siteNetwork.length > 0) {
    return siteNetwork[0];
  }
  if (scenario.consoleErrors.length > 0) {
    return `Console error: ${scenario.consoleErrors[0]}`;
  }
  if (scenario.networkErrors.length > 0) {
    return scenario.networkErrors[0];
  }
  if (scenario.preconditionDiscovery.investigationFindings?.length) {
    return scenario.preconditionDiscovery.investigationFindings[0];
  }
  return "Automated checks did not confirm expected behavior on the target page.";
}

function deriveExpectedResult(scenario: ScenarioExecutionResult): string {
  const feature = scenario.feature.toLowerCase();
  if (feature.includes("contact") || feature.includes("form")) {
    return "Form should render without JavaScript errors and allow valid submission with clear success feedback.";
  }
  if (feature.includes("broken link")) {
    return "Sampled internal links should return healthy HTTP responses (2xx/3xx).";
  }
  if (feature.includes("responsive")) {
    return "Layout, CTAs, and navigation should remain usable across mobile, tablet, and desktop viewports.";
  }
  if (feature.includes("accessibility")) {
    return "Key templates should not expose high-severity accessibility risks (labels, focus, contrast).";
  }
  if (feature.includes("navigation")) {
    return "Primary navigation routes should load expected content without errors.";
  }
  return `Users should complete "${scenario.scenario}" on ${scenario.pageUrl} without defects.`;
}

function deriveSuggestedFix(scenario: ScenarioExecutionResult, primaryFailure: string): string {
  const combined = `${primaryFailure} ${scenario.feature}`.toLowerCase();

  if (/intlTelInput/.test(combined)) {
    return "Load the intlTelInput script before initializing phone inputs, or add a guard so the form still works when the library is missing.";
  }
  if (/broken link|404|500|timeout/.test(combined)) {
    return "Repair or redirect the failing URLs identified in the broken-links report (header, footer, CTA, and content links).";
  }
  if (/responsive|viewport|hidden cta|layout/.test(combined)) {
    return "Adjust responsive CSS/breakpoints so CTAs stay visible and layouts do not break on affected viewports.";
  }
  if (/accessibility|unlabeled|focus|alt text|contrast/.test(combined)) {
    return "Fix template markup: add labels/ARIA, restore visible focus outlines, and provide alt text where missing.";
  }
  if (/form submission|required field/.test(combined)) {
    return "Verify form handler, client validation, and success confirmation messaging on the affected page.";
  }
  if (scenario.preconditionDiscovery.missingPreconditions.length > 0) {
    return `Resolve missing preconditions: ${scenario.preconditionDiscovery.missingPreconditions.join(", ")}.`;
  }
  if (ownedConsoleErrors(scenario).length > 0) {
    return "Fix the JavaScript error on the page and retest the affected user flow.";
  }
  if (primarySiteNetworkErrors(scenario).length > 0) {
    return "Investigate failing same-origin network requests and stabilize the API or asset endpoints.";
  }
  return `Investigate the failure on ${scenario.pageUrl} and fix the underlying UI or backend dependency.`;
}

function deriveUserImpact(scenario: ScenarioExecutionResult, primaryFailure: string): string {
  const feature = scenario.feature.toLowerCase();
  if (/intlTelInput/.test(primaryFailure)) {
    return "Phone/country fields on contact forms may not initialize, blocking or confusing users who try to submit.";
  }
  if (feature.includes("contact") || feature.includes("form")) {
    return "Lead capture or support requests may fail silently when users submit the form.";
  }
  if (feature.includes("responsive")) {
    return "Mobile and tablet users may miss CTAs or see broken layouts on key pages.";
  }
  if (feature.includes("accessibility")) {
    return "Keyboard and screen-reader users may be unable to complete tasks on affected templates.";
  }
  if (feature.includes("broken link")) {
    return "Users clicking broken internal links hit dead ends instead of expected content.";
  }
  return `Users on ${scenario.pageUrl} may hit the defect while attempting: ${scenario.scenario}.`;
}

function deriveBusinessImpact(scenario: ScenarioExecutionResult, severity: HumanFriendlyBugReport["severity"]): string {
  const feature = scenario.feature.toLowerCase();
  if (feature.includes("contact") || feature.includes("form")) {
    return "Broken lead/contact flows can reduce inbound inquiries and support ticket quality.";
  }
  if (feature.includes("checkout") || feature.includes("cart")) {
    return "Checkout instability directly threatens conversion and revenue.";
  }
  if (severity === "Critical" || severity === "High") {
    return "A core user journey is impaired, which can reduce trust and completion rates.";
  }
  return "Quality issues on public pages can increase bounce rate and support load.";
}

function buildEvidenceLines(scenario: ScenarioExecutionResult): string[] {
  const lines: string[] = [];
  if (scenario.errorReason) {
    lines.push(scenario.errorReason);
  }
  for (const err of ownedConsoleErrors(scenario)) {
    if (!lines.includes(err)) lines.push(`Console: ${err}`);
  }
  for (const err of primarySiteNetworkErrors(scenario).slice(0, 2)) {
    lines.push(`Network: ${err}`);
  }
  if (scenario.preconditionDiscovery.investigationFindings?.length) {
    for (const finding of scenario.preconditionDiscovery.investigationFindings.slice(0, 2)) {
      lines.push(finding);
    }
  }
  return lines;
}

function createRootCauseAnalysis(scenario: ScenarioExecutionResult, primaryFailure: string): string {
  const evidence = buildEvidenceLines(scenario);
  if (evidence.length > 0) {
    return evidence.join(" ");
  }
  return primaryFailure;
}

function toSteps(scenario: ScenarioExecutionResult): string[] {
  const steps = [`Open ${scenario.pageUrl}`];
  if (scenario.preconditionDiscovery.actionsTaken.length > 0) {
    steps.push(...scenario.preconditionDiscovery.actionsTaken.slice(0, 3));
  } else {
    steps.push(`Run check: ${scenario.feature} — ${scenario.scenario}`);
  }
  steps.push("Observe failure signal in console, network, layout, or form behavior.");
  return steps;
}

function toConcreteDescription(scenario: ScenarioExecutionResult, primaryFailure: string): string {
  const evidence = buildEvidenceLines(scenario);
  const detail =
    evidence.length > 1
      ? `${primaryFailure} Additional signals: ${evidence.slice(1).join("; ")}.`
      : primaryFailure;

  return `While testing "${scenario.scenario}" on ${scenario.pageUrl}, the run failed because ${detail}`;
}

function toBugSummary(scenario: ScenarioExecutionResult, primaryFailure: string): string {
  if (/pagination opens empty product listing page/i.test(primaryFailure)) {
    return "Pagination opens empty product listing page";
  }
  const shortFailure =
    primaryFailure.length > 72 ? `${primaryFailure.slice(0, 69)}...` : primaryFailure;
  return `${scenario.feature}: ${shortFailure}`;
}

function computeConfidenceScore(scenario: ScenarioExecutionResult): number {
  let score = 60;
  if (scenario.errorReason) score += 12;
  if (scenario.consoleErrors.length > 0) score += 8;
  if (scenario.networkErrors.length > 0) score += 8;
  if (scenario.screenshots.length > 0) score += 8;
  if (scenario.selfHealing.attempted && !scenario.selfHealing.recovered) score += 6;
  if (scenario.preconditionDiscovery.retryResult === "failed") score += 5;
  return Math.min(99, score);
}

export function generateBugReportFromScenario(
  scenario: ScenarioExecutionResult
): HumanFriendlyBugReport {
  const primaryFailure = extractPrimaryFailure(scenario);
  const severity = deriveSeverity(scenario);
  const priority = severityToPriority(severity);
  const confidenceScore = computeConfidenceScore(scenario);

  const recoveryAttempts = [
    ...scenario.preconditionDiscovery.actionsTaken,
    ...scenario.selfHealing.strategyLogs,
  ];

  return {
    summary: toBugSummary(scenario, primaryFailure),
    description: toConcreteDescription(scenario, primaryFailure),
    stepsToReproduce: toSteps(scenario),
    expectedResult: deriveExpectedResult(scenario),
    actualResult: primaryFailure,
    screenshot: scenario.screenshots[0] ?? null,
    suggestedFix: deriveSuggestedFix(scenario, primaryFailure),
    severity,
    priority,
    confidenceScore,
    businessImpact: deriveBusinessImpact(scenario, severity),
    userImpact: deriveUserImpact(scenario, primaryFailure),
    revenueImpact:
      severity === "Critical" || severity === "High"
        ? "Conversion or lead-generation paths may lose measurable traffic."
        : "Indirect impact possible depending on page traffic and funnel position.",
    recoveryAttempts:
      recoveryAttempts.length > 0
        ? recoveryAttempts
        : ["No automated recovery action was applicable in this run."],
    rootCauseAnalysis: createRootCauseAnalysis(scenario, primaryFailure),
    technicalDetails: {
      errorReason: scenario.errorReason ?? primaryFailure,
      consoleErrors: scenario.consoleErrors,
      networkErrors: scenario.networkErrors,
      pageUrl: scenario.pageUrl,
      timestamp: scenario.timestamp,
      selfHealing: scenario.selfHealing,
      preconditionDiscovery: scenario.preconditionDiscovery,
    },
  };
}

export function generateBugIntelligenceFromRun(
  run: Pick<
    ExecutionRunResult,
    | "scenarios"
    | "brokenLinksReport"
    | "formsReport"
    | "accessibilityRiskReport"
    | "responsiveReport"
  >
): HumanFriendlyBugReport[] {
  const failedScenarioBugs = run.scenarios
    .filter((scenario) => scenario.status === "failed")
    .map((scenario) => generateBugReportFromScenario(scenario));

  const postRunBugs = generatePostRunBugReports(run);

  const seen = new Set<string>();
  return [...failedScenarioBugs, ...postRunBugs].filter((bug) => {
    if (seen.has(bug.summary)) {
      return false;
    }
    seen.add(bug.summary);
    return true;
  });
}
