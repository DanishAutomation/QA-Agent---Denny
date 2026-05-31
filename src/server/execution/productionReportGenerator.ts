import fs from "node:fs";
import path from "node:path";
import type { ExecutionRunResult, PlaywrightExecutionConfig } from "@/types";
import { appConfig } from "@/core/configManager";

interface ProductionReportPaths {
  html: string;
  json: string;
  markdown: string;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function confidenceFromRun(run: ExecutionRunResult): number {
  if (run.bugReports.length === 0) {
    return 96;
  }
  const average =
    run.bugReports.reduce((sum, bug) => sum + bug.confidenceScore, 0) /
    run.bugReports.length;
  return Math.round(average);
}

function rootCauseSummary(run: ExecutionRunResult): string[] {
  if (run.bugReports.length === 0) {
    return ["No major root-cause signals detected in this run."];
  }
  return run.bugReports.map((bug) => `${bug.summary}: ${bug.rootCauseAnalysis}`);
}

function recoveryAttemptSummary(run: ExecutionRunResult): string[] {
  const attempts = run.bugReports.flatMap((bug) => bug.recoveryAttempts);
  if (attempts.length === 0) {
    return ["No recovery attempts were required."];
  }
  return [...new Set(attempts)];
}

function aiAssumptions(config: PlaywrightExecutionConfig): string[] {
  return [
    "Execution assertions rely on generated BDD scenario intent and detected capabilities.",
    "Fallback test data may be used for missing non-sensitive fields where configured.",
    "Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.",
    `Browser/device matrix reflects configured run values: ${config.browser} / ${config.devices.join(", ")}.`,
  ];
}

function toProductionJson(
  run: ExecutionRunResult,
  config: PlaywrightExecutionConfig
): Record<string, unknown> {
  return {
    executiveSummary: {
      runId: run.runId,
      environment: appConfig.env,
      url: config.baseUrl,
      testType: config.selectedTestType ?? "Unspecified",
      browser: config.browser,
      devices: config.devices,
      totalCases: run.scenarios.length,
      passed: run.passed,
      failed: run.failed,
      skipped: run.skipped,
      bugsFound: run.bugReports.length,
      confidenceScore: confidenceFromRun(run),
    },
    rootCauseAnalysis: rootCauseSummary(run),
    recoveryAttempts: recoveryAttemptSummary(run),
    aiAssumptions: aiAssumptions(config),
    screenshots: run.scenarios.flatMap((scenario) =>
      scenario.screenshots.map((pathValue) => ({
        scenarioId: scenario.scenarioId,
        path: pathValue,
      }))
    ),
    bugs: run.bugReports,
    technicalLogs: run.scenarios.map((scenario) => ({
      scenarioId: scenario.scenarioId,
      feature: scenario.feature,
      scenario: scenario.scenario,
      status: scenario.status,
      errorReason: scenario.errorReason,
      consoleErrors: scenario.consoleErrors,
      networkErrors: scenario.networkErrors,
      selfHealing: scenario.selfHealing,
      preconditionDiscovery: scenario.preconditionDiscovery,
    })),
    generatedAt: new Date().toISOString(),
  };
}

function toMarkdownSummary(run: ExecutionRunResult, config: PlaywrightExecutionConfig): string {
  const confidence = confidenceFromRun(run);
  const rootCauses = rootCauseSummary(run);
  const recoveries = recoveryAttemptSummary(run);
  const assumptions = aiAssumptions(config);

  return [
    `# DennyQA vNext Test Report`,
    ``,
    `## Executive Summary`,
    `- Run ID: ${run.runId}`,
    `- URL: ${config.baseUrl}`,
    `- Test type: ${config.selectedTestType ?? "Unspecified"}`,
    `- Browser: ${config.browser}`,
    `- Device(s): ${config.devices.join(", ")}`,
    `- Environment: ${appConfig.env}`,
    `- Total cases: ${run.scenarios.length}`,
    `- Passed: ${run.passed}`,
    `- Failed: ${run.failed}`,
    `- Skipped: ${run.skipped}`,
    `- Bugs found: ${run.bugReports.length}`,
    `- Confidence score: ${confidence}%`,
    ``,
    `## Root Cause Analysis`,
    ...rootCauses.map((item) => `- ${item}`),
    ``,
    `## Recovery Attempts`,
    ...recoveries.map((item) => `- ${item}`),
    ``,
    `## AI Assumptions`,
    ...assumptions.map((item) => `- ${item}`),
    ``,
    `## Screenshots`,
    ...run.scenarios.flatMap((scenario) =>
      scenario.screenshots.map((shot) => `- ${scenario.scenarioId}: ${shot}`)
    ),
    ``,
    `## Technical Logs`,
    ...run.scenarios.map(
      (scenario) =>
        `- ${scenario.scenarioId} (${scenario.status}) :: error=${scenario.errorReason ?? "none"}, console=${scenario.consoleErrors.length}, network=${scenario.networkErrors.length}`
    ),
    ``,
  ].join("\n");
}

function toHtmlReport(run: ExecutionRunResult, config: PlaywrightExecutionConfig): string {
  const confidence = confidenceFromRun(run);
  const rootCauses = rootCauseSummary(run);
  const recoveries = recoveryAttemptSummary(run);
  const assumptions = aiAssumptions(config);

  const screenshotItems = run.scenarios
    .flatMap((scenario) =>
      scenario.screenshots.map(
        (shot) =>
          `<li><strong>${escapeHtml(scenario.scenarioId)}</strong>: ${escapeHtml(shot)}</li>`
      )
    )
    .join("");

  const technicalDetails = run.scenarios
    .map((scenario) => {
      const consoleErrors = scenario.consoleErrors.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      const networkErrors = scenario.networkErrors.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      return `
        <details>
          <summary>${escapeHtml(scenario.scenarioId)} - ${escapeHtml(scenario.feature)} (${escapeHtml(
        scenario.status
      )})</summary>
          <p><strong>Scenario:</strong> ${escapeHtml(scenario.scenario)}</p>
          <p><strong>Error reason:</strong> ${escapeHtml(scenario.errorReason ?? "none")}</p>
          <p><strong>Page URL:</strong> ${escapeHtml(scenario.pageUrl)}</p>
          <p><strong>Recovery attempts:</strong> ${escapeHtml(
            scenario.preconditionDiscovery.actionsTaken.join(" | ") || "none"
          )}</p>
          <p><strong>Self-healing logs:</strong> ${escapeHtml(
            scenario.selfHealing.strategyLogs.join(" | ") || "none"
          )}</p>
          <p><strong>Console errors:</strong></p><ul>${consoleErrors || "<li>none</li>"}</ul>
          <p><strong>Network errors:</strong></p><ul>${networkErrors || "<li>none</li>"}</ul>
        </details>
      `;
    })
    .join("");

  const bugList = run.bugReports
    .map(
      (bug) => `
      <article>
        <h4>${escapeHtml(bug.summary)} (${escapeHtml(bug.severity)} / ${escapeHtml(
        bug.priority
      )})</h4>
        <p>${escapeHtml(bug.description)}</p>
        <p><strong>Expected:</strong> ${escapeHtml(bug.expectedResult)}</p>
        <p><strong>Actual:</strong> ${escapeHtml(bug.actualResult)}</p>
        <p><strong>Suggested fix:</strong> ${escapeHtml(bug.suggestedFix)}</p>
      </article>
    `
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>DennyQA vNext Report - ${escapeHtml(run.runId)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
      h1, h2, h3 { margin-bottom: 8px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 10px; }
      .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; background: #fff; }
      .muted { color: #6b7280; font-size: 13px; }
      details { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; margin-bottom: 8px; }
      summary { cursor: pointer; font-weight: 600; }
      ul { margin-top: 4px; }
    </style>
  </head>
  <body>
    <h1>DennyQA vNext Production Report</h1>
    <p class="muted">Client-shareable test outcome report.</p>

    <h2>Executive Summary</h2>
    <div class="grid">
      <div class="card"><strong>Run ID</strong><br/>${escapeHtml(run.runId)}</div>
      <div class="card"><strong>URL</strong><br/>${escapeHtml(config.baseUrl)}</div>
      <div class="card"><strong>Test Type</strong><br/>${escapeHtml(config.selectedTestType ?? "Unspecified")}</div>
      <div class="card"><strong>Browser</strong><br/>${escapeHtml(config.browser)}</div>
      <div class="card"><strong>Device(s)</strong><br/>${escapeHtml(config.devices.join(", "))}</div>
      <div class="card"><strong>Environment</strong><br/>${escapeHtml(appConfig.env)}</div>
      <div class="card"><strong>Total Cases</strong><br/>${run.scenarios.length}</div>
      <div class="card"><strong>Passed / Failed / Skipped</strong><br/>${run.passed} / ${run.failed} / ${run.skipped}</div>
      <div class="card"><strong>Bugs Found</strong><br/>${run.bugReports.length}</div>
      <div class="card"><strong>Confidence Score</strong><br/>${confidence}%</div>
    </div>

    <h2>Root Cause Analysis</h2>
    <ul>${rootCauses.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>

    <h2>Recovery Attempts</h2>
    <ul>${recoveries.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>

    <h2>AI Assumptions</h2>
    <ul>${assumptions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>

    <h2>Screenshots</h2>
    <ul>${screenshotItems || "<li>No screenshots generated.</li>"}</ul>

    <h2>Bug Details</h2>
    ${bugList || "<p class='muted'>No bugs generated.</p>"}

    <h2>Technical Logs (Collapsible)</h2>
    ${technicalDetails || "<p class='muted'>No scenario logs available.</p>"}
  </body>
</html>`;
}

export function generateProductionGradeReports(params: {
  run: ExecutionRunResult;
  config: PlaywrightExecutionConfig;
  reportDir: string;
}): ProductionReportPaths {
  const { run, config, reportDir } = params;

  const htmlPath = path.join(reportDir, "client-report.html");
  const jsonPath = path.join(reportDir, "client-report.json");
  const markdownPath = path.join(reportDir, "summary.md");

  const productionJson = toProductionJson(run, config);
  const markdown = toMarkdownSummary(run, config);
  const html = toHtmlReport(run, config);

  fs.writeFileSync(jsonPath, JSON.stringify(productionJson, null, 2), "utf-8");
  fs.writeFileSync(markdownPath, markdown, "utf-8");
  fs.writeFileSync(htmlPath, html, "utf-8");

  return {
    html: htmlPath,
    json: jsonPath,
    markdown: markdownPath,
  };
}
