import { NextRequest, NextResponse } from "next/server";
import {
  getRunControlState,
  pauseRun,
  resumeRun,
  stopRun,
} from "@/server/execution/executionControlStore";
import {
  cancelExecutionProgress,
  getExecutionProgressSnapshot,
  pauseExecutionProgress,
  resumeExecutionProgress,
} from "@/server/execution/progressStreamStore";

export const runtime = "nodejs";

type ControlAction = "pause" | "resume" | "stop";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    runId?: string;
    action?: ControlAction;
  } | null;

  if (!body?.runId || !body?.action) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_REQUEST", message: "runId and action are required." },
      },
      { status: 400 }
    );
  }

  const snapshot = getExecutionProgressSnapshot(body.runId);
  if (!snapshot) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "RUN_NOT_FOUND", message: `No run ${body.runId} found.` },
      },
      { status: 404 }
    );
  }

  if (snapshot.status === "completed" || snapshot.status === "failed" || snapshot.status === "cancelled") {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "RUN_TERMINAL", message: "Run has already finished." },
      },
      { status: 409 }
    );
  }

  if (body.action === "pause") {
    if (snapshot.status === "paused") {
      return NextResponse.json({ ok: true, data: snapshot });
    }
    pauseRun(body.runId);
    const next = pauseExecutionProgress(body.runId);
    return NextResponse.json({ ok: true, data: next });
  }

  if (body.action === "resume") {
    if (snapshot.status !== "paused") {
      return NextResponse.json({
        ok: true,
        data: snapshot,
      });
    }
    resumeRun(body.runId);
    const next = resumeExecutionProgress(body.runId);
    return NextResponse.json({ ok: true, data: next });
  }

  stopRun(body.runId);
  const next = cancelExecutionProgress(body.runId, "Execution stopped by user.");
  return NextResponse.json({ ok: true, data: next });
}

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get("runId");
  if (!runId) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_REQUEST", message: "runId is required." } },
      { status: 400 }
    );
  }

  const snapshot = getExecutionProgressSnapshot(runId);
  return NextResponse.json({
    ok: true,
    data: {
      snapshot,
      controlState: getRunControlState(runId),
    },
  });
}
