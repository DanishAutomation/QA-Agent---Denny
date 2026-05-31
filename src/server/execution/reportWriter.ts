import fs from "node:fs";
import path from "node:path";
import type { ExecutionRunResult } from "@/types";

export interface ReportPaths {
  reportDir: string;
  screenshotsDir: string;
  responsiveScreenshotsDir: string;
  formsScreenshotsDir: string;
  resultJsonPath: string;
  responsiveReportJsonPath: string;
  brokenLinksReportJsonPath: string;
  formsReportJsonPath: string;
  accessibilityRiskReportJsonPath: string;
}

export function createReportPaths(runId: string): ReportPaths {
  const reportDir = path.join(process.cwd(), "src", "reports", "executions", runId);
  const screenshotsDir = path.join(reportDir, "screenshots");
  const responsiveScreenshotsDir = path.join(reportDir, "responsive-screenshots");
  const formsScreenshotsDir = path.join(reportDir, "forms-screenshots");
  const resultJsonPath = path.join(reportDir, "result.json");
  const responsiveReportJsonPath = path.join(reportDir, "responsive-report.json");
  const brokenLinksReportJsonPath = path.join(reportDir, "broken-links-report.json");
  const formsReportJsonPath = path.join(reportDir, "forms-report.json");
  const accessibilityRiskReportJsonPath = path.join(
    reportDir,
    "accessibility-risk-report.json"
  );
  fs.mkdirSync(screenshotsDir, { recursive: true });
  fs.mkdirSync(responsiveScreenshotsDir, { recursive: true });
  fs.mkdirSync(formsScreenshotsDir, { recursive: true });
  return {
    reportDir,
    screenshotsDir,
    responsiveScreenshotsDir,
    formsScreenshotsDir,
    resultJsonPath,
    responsiveReportJsonPath,
    brokenLinksReportJsonPath,
    formsReportJsonPath,
    accessibilityRiskReportJsonPath,
  };
}

export function writeExecutionReport(paths: ReportPaths, result: ExecutionRunResult): void {
  fs.writeFileSync(paths.resultJsonPath, JSON.stringify(result, null, 2), "utf-8");
}
