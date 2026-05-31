import { NextRequest, NextResponse } from "next/server";
import { getExecutionProgressSnapshot } from "@/server/execution/progressStreamStore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get("runId");
  if (!runId) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_REQUEST", message: "runId is required." } },
      { status: 400 }
    );
  }

  const snapshot = getExecutionProgressSnapshot(runId);
  if (!snapshot) {
    return NextResponse.json(
      { ok: false, error: { code: "RUN_NOT_FOUND", message: `No run ${runId} found.` } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data: snapshot });
}
