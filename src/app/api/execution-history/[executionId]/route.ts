import { NextRequest, NextResponse } from "next/server";
import {
  deleteExecutionHistoryRun,
  getExecutionHistoryRunById,
  updateExecutionHistoryRun,
} from "@/database/executionHistoryRepository";
import type { UpdateExecutionHistoryInput } from "@/types";

interface RouteContext {
  params: Promise<{ executionId: string }>;
}

export async function GET(_: NextRequest, context: RouteContext) {
  const { executionId } = await context.params;
  const run = getExecutionHistoryRunById(executionId);
  if (!run) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Execution run not found." } },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, data: run });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { executionId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | UpdateExecutionHistoryInput
    | null;

  if (!body) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_INPUT", message: "Invalid payload." } },
      { status: 400 }
    );
  }

  const updated = updateExecutionHistoryRun(executionId, body);
  if (!updated) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Execution run not found." } },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const { executionId } = await context.params;
  const deleted = deleteExecutionHistoryRun(executionId);
  if (!deleted) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Execution run not found." } },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
