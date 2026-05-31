import { NextRequest, NextResponse } from "next/server";
import { createExecutionHistoryRun } from "@/database/executionHistoryRepository";
import { runPlaywrightExecution } from "@/server/execution/playwrightExecutionEngine";
import type { ExecutableScenarioInput, PlaywrightExecutionConfig } from "@/types";

export const runtime = "nodejs";

interface RunExecutionBody {
  config?: PlaywrightExecutionConfig;
  scenarios?: ExecutableScenarioInput[];
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as RunExecutionBody | null;
  if (!body?.config || !body?.scenarios) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message: "config and scenarios are required.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const result = await runPlaywrightExecution({
      config: body.config,
      scenarios: body.scenarios,
    });

    createExecutionHistoryRun({
      websiteUrl: body.config.baseUrl,
      testType: body.config.selectedTestType ?? "Custom",
      browser: body.config.browser,
      mode: body.config.mode === "headed" ? "Headed" : "Headless",
      devices: body.config.devices,
      startTime: result.startedAt,
      endTime: result.completedAt,
      durationSeconds: Math.max(0, Math.round(result.durationMs / 1000)),
      totalCases: result.scenarios.length,
      passed: result.passed,
      failed: result.failed,
      skipped: result.skipped,
      bugsFound: result.bugReports.length,
      reportPath: result.productionReportPaths?.html ?? result.reportPath,
      status: result.failed > 0 ? "failed" : "completed",
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "EXECUTION_FAILED",
          message: error instanceof Error ? error.message : "Execution failed.",
        },
      },
      { status: 500 }
    );
  }
}
