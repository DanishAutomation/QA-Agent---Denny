import type {
  AccessibilityRiskReport,
  BrokenLinksReport,
  ExecutionRunResult,
  FormsTestingReport,
  HumanFriendlyBugReport,
  ResponsiveTestReport,
  ScenarioExecutionResult,
} from "@/types";
import { filterConsoleErrors, isSiteOwnedConsoleIssue } from "./executionNoiseFilter";

function featureMatches(scenario: ScenarioExecutionResult, pattern: RegExp): boolean {
  return pattern.test(`${scenario.feature} ${scenario.scenario}`.toLowerCase());
}

function markScenarioFailed(
  scenario: ScenarioExecutionResult,
  reason: string
): ScenarioExecutionResult {
  return {
    ...scenario,
    status: "failed",
    errorReason: reason,
  };
}

export function applyPostRunReportOutcomes(params: {
  scenarios: ScenarioExecutionResult[];
  brokenLinksReport?: BrokenLinksReport;
  formsReport?: FormsTestingReport;
  accessibilityRiskReport?: AccessibilityRiskReport;
  responsiveReport?: ResponsiveTestReport;
  siteHostname: string;
}): ScenarioExecutionResult[] {
  const {
    scenarios,
    brokenLinksReport,
    formsReport,
    accessibilityRiskReport,
    responsiveReport,
    siteHostname,
  } = params;

  return scenarios.map((scenario) => {
    let next = { ...scenario };
    next.consoleErrors = filterConsoleErrors(next.consoleErrors, siteHostname);

    if (brokenLinksReport && featureMatches(scenario, /broken link/)) {
      const confirmed =
        brokenLinksReport.confirmedFailedCount ?? brokenLinksReport.failedCount;
      if (confirmed > 0) {
        next = markScenarioFailed(
          next,
          `${confirmed} confirmed broken link(s) found across ${brokenLinksReport.pagesSampled ?? 1} sampled page(s).`
        );
      }
    }

    if (formsReport && featureMatches(scenario, /contact form|forms/)) {
      const failedForms = formsReport.results.filter(
        (item) =>
          !item.requiredFieldsOk ||
          (item.successfulSubmissionAttempted && !item.successfulSubmissionPassed)
      );
      if (failedForms.length > 0) {
        next = markScenarioFailed(
          next,
          `Form validation issue on ${failedForms[0].pageUrl} (${failedForms[0].formType}).`
        );
      }
    }

    if (accessibilityRiskReport && featureMatches(scenario, /accessibility/)) {
      const highFindings = accessibilityRiskReport.findings.filter(
        (item) => item.severity === "high"
      );
      if (highFindings.length > 0) {
        next = markScenarioFailed(
          next,
          `${highFindings.length} high-severity accessibility risk finding(s) detected across sampled templates.`
        );
      }
    }

    if (responsiveReport && featureMatches(scenario, /responsive/)) {
      const issueViewports = responsiveReport.summary.issueViewports;
      if (issueViewports >= 3) {
        next = markScenarioFailed(
          next,
          `Responsive issues detected on ${issueViewports}/${responsiveReport.summary.totalViewports} viewports.`
        );
      }
    }

    const ownedConsoleIssues = next.consoleErrors.filter(isSiteOwnedConsoleIssue);
    if (ownedConsoleIssues.length > 0 && featureMatches(scenario, /contact form|forms/)) {
      next = markScenarioFailed(
        next,
        `Site console error detected: ${ownedConsoleIssues[0]}`
      );
    }

    return next;
  });
}

function derivePostRunUserImpact(summary: string, actualResult: string): string {
  const combined = `${summary} ${actualResult}`.toLowerCase();
  if (/intlTelInput/.test(combined)) {
    return "Phone/country fields on contact forms may not initialize, blocking or confusing users who try to submit.";
  }
  if (/form submission|form validation/.test(combined)) {
    return "Users submitting the form may not get confirmation that their request was received.";
  }
  if (/responsive|viewport|layout/.test(combined)) {
    return "Mobile and tablet users may miss CTAs or see broken layouts on key pages.";
  }
  if (/accessibility|unlabeled|focus|alt text/.test(combined)) {
    return "Keyboard and screen-reader users may be unable to complete tasks on affected templates.";
  }
  if (/broken link/.test(combined)) {
    return "Users clicking broken internal links hit dead ends instead of expected content.";
  }
  if (/console defect|console error/.test(combined)) {
    return "JavaScript errors on the page can break widgets and form behavior for real users.";
  }
  return actualResult;
}

function bugFromFinding(params: {
  summary: string;
  description: string;
  severity: HumanFriendlyBugReport["severity"];
  pageUrl: string;
  suggestedFix: string;
  actualResult: string;
}): HumanFriendlyBugReport {
  const priority =
    params.severity === "Critical"
      ? "P0"
      : params.severity === "High"
        ? "P1"
        : params.severity === "Medium"
          ? "P2"
          : "P3";

  const userImpact = derivePostRunUserImpact(params.summary, params.actualResult);

  return {
    summary: params.summary,
    description: params.description,
    stepsToReproduce: [`Open ${params.pageUrl}`, "Review automated post-run analysis findings."],
    expectedResult: "Page should meet quality expectations without user-impacting defects.",
    actualResult: params.actualResult,
    screenshot: null,
    suggestedFix: params.suggestedFix,
    severity: params.severity,
    priority,
    confidenceScore: 88,
    businessImpact: /form|contact|checkout/.test(params.summary.toLowerCase())
      ? "Broken lead or conversion flows can reduce inbound inquiries and revenue."
      : "Quality issues on public pages can increase bounce rate and support load.",
    userImpact,
    revenueImpact: "Indirect revenue impact possible depending on affected journeys.",
    recoveryAttempts: ["Post-run analysis completed after scenario execution."],
    rootCauseAnalysis: params.actualResult,
    technicalDetails: {
      errorReason: params.actualResult,
      consoleErrors: [],
      networkErrors: [],
      pageUrl: params.pageUrl,
      timestamp: new Date().toISOString(),
      selfHealing: {
        attempted: false,
        recovered: false,
        attempts: 0,
        strategyLogs: [],
      },
      preconditionDiscovery: {
        missingPreconditions: [],
        actionsTaken: [],
        retryResult: "not-needed",
      },
    },
  };
}

export function generatePostRunBugReports(
  run: Pick<
    ExecutionRunResult,
    | "scenarios"
    | "brokenLinksReport"
    | "formsReport"
    | "accessibilityRiskReport"
    | "responsiveReport"
  >
): HumanFriendlyBugReport[] {
  const bugs: HumanFriendlyBugReport[] = [];

  if (run.brokenLinksReport) {
    const confirmed =
      run.brokenLinksReport.confirmedFailedCount ?? run.brokenLinksReport.failedCount;
    if (confirmed > 0) {
      const sample = run.brokenLinksReport.findings.find(
        (item) => item.failureType !== "blocked" && item.failureType !== "403"
      );
      bugs.push(
        bugFromFinding({
          summary: `Broken links detected (${confirmed} confirmed)`,
          description: `Automated link health checks found ${confirmed} confirmed broken links across ${run.brokenLinksReport.pagesSampled ?? 1} sampled pages.`,
          severity: confirmed >= 10 ? "High" : "Medium",
          pageUrl: sample?.fromUrl ?? run.brokenLinksReport.baseUrl,
          suggestedFix: "Fix or redirect failing internal URLs surfaced in header, footer, CTA, and content links.",
          actualResult: `${confirmed} links returned 404/500/timeout after browser-verified checks.`,
        })
      );
    }
  }

  if (run.formsReport) {
    for (const form of run.formsReport.results) {
      if (form.successfulSubmissionAttempted && !form.successfulSubmissionPassed) {
        bugs.push(
          bugFromFinding({
            summary: `${form.formType} form submission not confirmed`,
            description: `Form on ${form.pageUrl} did not show a reliable success signal after submission.`,
            severity: "High",
            pageUrl: form.pageUrl,
            suggestedFix: "Verify form handler, validation messaging, and success confirmation UX.",
            actualResult: "Submission was attempted but success could not be confirmed.",
          })
        );
      }
    }
  }

  if (run.accessibilityRiskReport) {
    for (const finding of run.accessibilityRiskReport.findings.filter(
      (item) => item.severity === "high" || item.severity === "medium"
    )) {
      bugs.push(
        bugFromFinding({
          summary: `Accessibility risk: ${finding.category}`,
          description: finding.message,
          severity: finding.severity === "high" ? "High" : "Medium",
          pageUrl: finding.pageUrl,
          suggestedFix: "Review template markup, labels, focus states, and media alternatives.",
          actualResult: finding.message,
        })
      );
    }
  }

  if (run.responsiveReport && run.responsiveReport.summary.issueViewports >= 3) {
    bugs.push(
      bugFromFinding({
        summary: "Responsive layout issues across multiple viewports",
        description: `Responsive audit flagged issues on ${run.responsiveReport.summary.issueViewports} of ${run.responsiveReport.summary.totalViewports} viewports.`,
        severity: "Medium",
        pageUrl: run.responsiveReport.baseUrl,
        suggestedFix: "Review mobile/tablet breakpoints, hidden CTAs, and layout overflow rules.",
        actualResult: run.responsiveReport.findings
          .flatMap((item) => item.notes)
          .slice(0, 3)
          .join(" "),
      })
    );
  }

  for (const scenario of run.scenarios) {
    const owned = filterConsoleErrors(scenario.consoleErrors, "").filter(isSiteOwnedConsoleIssue);
    if (owned.length === 0) {
      continue;
    }
    bugs.push(
      bugFromFinding({
        summary: `Console defect: ${owned[0]}`,
        description: `Runtime console error observed during ${scenario.feature} - ${scenario.scenario}.`,
        severity: /intlTelInput/i.test(owned[0]) ? "Medium" : "High",
        pageUrl: scenario.pageUrl,
        suggestedFix: "Fix missing script dependencies or initialization order for affected widgets.",
        actualResult: owned[0],
      })
    );
  }

  return bugs;
}

export function summarizeRunCounts(scenarios: ScenarioExecutionResult[]): {
  passed: number;
  failed: number;
  skipped: number;
} {
  return {
    passed: scenarios.filter((item) => item.status === "passed").length,
    failed: scenarios.filter((item) => item.status === "failed").length,
    skipped: scenarios.filter((item) => item.status === "skipped").length,
  };
}
