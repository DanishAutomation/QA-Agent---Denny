import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  formIssueFlags,
  responsiveIssueFlags,
  type ScreenshotVerdict,
} from "@/lib/screenshotIssueLabels";
import type { ExecutionRunResult } from "@/types";
import type { FormValidationResult } from "@/types/brokenForms";
import type { ResponsiveViewportFinding } from "@/types/responsive";

export const runtime = "nodejs";

export interface ExecutionScreenshotItem {
  fileName: string;
  scenarioId: string;
  device: string;
  captureType: "landing" | "recovered" | "failure" | "other";
  status: "passed" | "failed" | "unknown";
  verdict: ScreenshotVerdict;
  capturedAt: string;
  folder: "screenshots" | "forms-screenshots" | "responsive-screenshots";
  category: "scenario" | "form" | "responsive";
  title: string;
  issueSummary?: string;
  issueFlags: string[];
}

function isSafeName(value: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(value);
}

function readRunResult(runDir: string): ExecutionRunResult | null {
  const resultPath = path.join(runDir, "result.json");
  if (!fs.existsSync(resultPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(resultPath, "utf-8")) as ExecutionRunResult;
  } catch {
    return null;
  }
}

function parseFormIndex(fileName: string): number | null {
  const match = fileName.match(/^form-(\d+)-/i);
  return match ? Number(match[1]) : null;
}

function enrichScreenshot(
  item: Omit<
    ExecutionScreenshotItem,
    "verdict" | "category" | "title" | "issueSummary" | "issueFlags"
  >,
  runResult: ExecutionRunResult | null
): ExecutionScreenshotItem {
  if (item.folder === "screenshots") {
    const scenario = runResult?.scenarios.find(
      (entry) => entry.scenarioId === item.scenarioId
    );
    const verdict: ScreenshotVerdict =
      item.status === "failed" ? "fail" : item.status === "passed" ? "pass" : "info";
    const issueFlags: string[] = [];
    if (scenario?.errorReason) {
      issueFlags.push(scenario.errorReason);
    }
    if (scenario?.consoleErrors?.length) {
      issueFlags.push(`Console: ${scenario.consoleErrors[0]}`);
    }
    return {
      ...item,
      category: "scenario",
      verdict,
      title: scenario ? `${scenario.feature} — ${scenario.scenario}` : item.scenarioId,
      issueSummary:
        verdict === "fail"
          ? scenario?.errorReason ?? "Scenario failed at capture point"
          : verdict === "pass"
            ? "Scenario step completed successfully"
            : undefined,
      issueFlags: verdict === "fail" ? issueFlags.slice(0, 4) : [],
    };
  }

  if (item.folder === "forms-screenshots") {
    const formIndex = parseFormIndex(item.fileName);
    const formResult: FormValidationResult | undefined =
      formIndex !== null ? runResult?.formsReport?.results[formIndex] : undefined;
    const flags = formResult ? formIssueFlags(formResult) : [];
    const verdict: ScreenshotVerdict = flags.length > 0 ? "fail" : formResult ? "pass" : "info";
    return {
      ...item,
      category: "form",
      verdict,
      title: formResult
        ? `${formResult.formType} form · ${(() => {
            try {
              return new URL(formResult.pageUrl).pathname || formResult.pageUrl;
            } catch {
              return formResult.pageUrl;
            }
          })()}`
        : item.fileName.replace(/\.png$/i, ""),
      issueSummary:
        verdict === "fail"
          ? flags[0] ?? "Form validation issue detected"
          : verdict === "pass"
            ? "Form checks passed"
            : "Form capture (no linked validation result)",
      issueFlags: flags,
    };
  }

  const responsiveFinding: ResponsiveViewportFinding | undefined =
    runResult?.responsiveReport?.findings.find(
      (finding) => path.basename(finding.screenshotPath) === item.fileName
    );
  const flags = responsiveFinding ? responsiveIssueFlags(responsiveFinding) : [];
  const verdict: ScreenshotVerdict = flags.length > 0 ? "fail" : responsiveFinding ? "pass" : "info";
  const viewportLabel = responsiveFinding?.viewport ?? item.fileName.replace(/\.png$/i, "");
  return {
    ...item,
    category: "responsive",
    verdict,
    title: viewportLabel,
    issueSummary:
      verdict === "fail"
        ? responsiveFinding?.notes[0] ?? `${flags.length} responsive issue(s) detected`
        : verdict === "pass"
          ? "Responsive layout looks healthy"
          : "Responsive viewport capture",
    issueFlags: flags,
  };
}

function parseScreenshotMeta(
  fileName: string,
  folder: ExecutionScreenshotItem["folder"],
  capturedAtMs: number
): Omit<
  ExecutionScreenshotItem,
  "verdict" | "category" | "title" | "issueSummary" | "issueFlags"
> {
  const base = fileName.replace(/\.png$/i, "");
  const stepFormat = base.match(
    /^(scenario-\d+)-step-(\d+)-.+-(Desktop|Mobile|Tablet|Laptop|iPad|iPhone)-(landing|recovered|failure)$/i
  );
  if (stepFormat) {
    const suffix = stepFormat[4].toLowerCase() as "landing" | "recovered" | "failure";
    return {
      fileName,
      scenarioId: stepFormat[1],
      device: stepFormat[3],
      captureType: suffix,
      status: suffix === "failure" ? "failed" : "passed",
      capturedAt: new Date(capturedAtMs).toISOString(),
      folder,
    };
  }

  const parts = base.split("-");
  let scenarioId = base;
  let device = "Desktop";
  let captureType: ExecutionScreenshotItem["captureType"] = "other";
  let status: ExecutionScreenshotItem["status"] = "unknown";

  const suffix = parts.at(-1) ?? "";
  if (suffix === "landing") {
    captureType = "landing";
    status = "passed";
    device = parts.slice(-2, -1)[0] ?? "Desktop";
    scenarioId = parts.slice(0, -2).join("-");
  } else if (suffix === "recovered") {
    captureType = "recovered";
    status = "passed";
    device = parts.slice(-2, -1)[0] ?? "Desktop";
    scenarioId = parts.slice(0, -2).join("-");
  } else if (suffix === "failure") {
    captureType = "failure";
    status = "failed";
    device = parts.slice(-2, -1)[0] ?? "Desktop";
    scenarioId = parts.slice(0, -2).join("-");
  }

  return {
    fileName,
    scenarioId,
    device,
    captureType,
    status,
    capturedAt: new Date(capturedAtMs).toISOString(),
    folder,
  };
}

function listPngs(
  dirPath: string,
  folder: ExecutionScreenshotItem["folder"],
  runResult: ExecutionRunResult | null
): ExecutionScreenshotItem[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
    .map((entry) => {
      const stat = fs.statSync(path.join(dirPath, entry.name));
      const base = parseScreenshotMeta(entry.name, folder, stat.mtimeMs);
      return enrichScreenshot(base, runResult);
    });
}

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get("runId") ?? "";
  if (!isSafeName(runId)) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_PATH", message: "Invalid run id." } },
      { status: 400 }
    );
  }

  const runDir = path.join(process.cwd(), "src", "reports", "executions", runId);
  if (!fs.existsSync(runDir)) {
    return NextResponse.json({
      ok: true,
      data: { runId, screenshots: [] as ExecutionScreenshotItem[] },
    });
  }

  const runResult = readRunResult(runDir);
  const screenshots = [
    ...listPngs(path.join(runDir, "screenshots"), "screenshots", runResult),
    ...listPngs(path.join(runDir, "forms-screenshots"), "forms-screenshots", runResult),
    ...listPngs(path.join(runDir, "responsive-screenshots"), "responsive-screenshots", runResult),
  ].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));

  return NextResponse.json({
    ok: true,
    data: {
      runId,
      screenshots,
      summary: {
        total: screenshots.length,
        pass: screenshots.filter((item) => item.verdict === "pass").length,
        fail: screenshots.filter((item) => item.verdict === "fail").length,
        info: screenshots.filter((item) => item.verdict === "info").length,
      },
    },
  });
}
