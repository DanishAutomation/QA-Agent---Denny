import { NextRequest, NextResponse } from "next/server";
import { generateBugIntelligenceFromRun } from "@/server/bug-intelligence/bugIntelligenceEngine";
import type { ScenarioExecutionResult } from "@/types";

export const runtime = "nodejs";

interface BugIntelligenceBody {
  scenarios?: ScenarioExecutionResult[];
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as BugIntelligenceBody | null;
  if (!body?.scenarios) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_REQUEST", message: "scenarios array is required." },
      },
      { status: 400 }
    );
  }

  const reports = generateBugIntelligenceFromRun({ scenarios: body.scenarios });
  return NextResponse.json({ ok: true, data: reports });
}
