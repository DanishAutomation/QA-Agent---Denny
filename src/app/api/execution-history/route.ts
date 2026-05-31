import { NextRequest, NextResponse } from "next/server";
import {
  createExecutionHistoryRun,
  listExecutionHistoryRuns,
} from "@/database/executionHistoryRepository";
import type { CreateExecutionHistoryInput } from "@/types";

export async function GET() {
  const rows = listExecutionHistoryRuns().filter(
    (row) => !row.reportPath.toLowerCase().includes("mock-report-run")
  );
  return NextResponse.json({
    ok: true,
    data: rows,
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | Partial<CreateExecutionHistoryInput>
    | null;

  if (!body?.websiteUrl || !body?.testType || !body?.browser || !body?.mode) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_INPUT",
          message: "websiteUrl, testType, browser, and mode are required.",
        },
      },
      { status: 400 }
    );
  }

  const created = createExecutionHistoryRun({
    websiteUrl: body.websiteUrl,
    testType: body.testType,
    browser: body.browser,
    mode: body.mode,
    devices: body.devices ?? ["Desktop"],
    startTime: body.startTime ?? new Date().toISOString(),
    endTime: body.endTime ?? null,
    durationSeconds: body.durationSeconds ?? 0,
    totalCases: body.totalCases ?? 0,
    passed: body.passed ?? 0,
    failed: body.failed ?? 0,
    skipped: body.skipped ?? 0,
    bugsFound: body.bugsFound ?? 0,
    reportPath: body.reportPath ?? "/reports/pending.html",
    status: body.status ?? "queued",
  });

  return NextResponse.json(
    {
      ok: true,
      data: created,
    },
    { status: 201 }
  );
}
