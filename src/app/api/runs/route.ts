import { NextRequest, NextResponse } from "next/server";
import {
  createQaRun,
  getQaRun,
  listQaRuns,
  validateCreateRunRequest,
} from "@/server";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  RunCreatedResponse,
  RunDetailsResponse,
  RunListResponse,
} from "@/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const validation = validateCreateRunRequest(body);

  if (!validation.ok || !validation.value) {
    const response: ApiErrorResponse = {
      ok: false,
      error: {
        code: "INVALID_REQUEST",
        message: validation.message ?? "Invalid request payload.",
      },
    };

    return NextResponse.json(response, { status: 400 });
  }

  const run = await createQaRun(validation.value);
  const response: ApiSuccessResponse<RunCreatedResponse> = {
    ok: true,
    data: {
      runId: run.runId,
      status: run.status,
      createdAt: run.createdAt,
    },
  };

  return NextResponse.json(response, { status: 201 });
}

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get("runId");

  if (runId) {
    const run = getQaRun(runId);
    if (!run) {
      const notFound: ApiErrorResponse = {
        ok: false,
        error: {
          code: "RUN_NOT_FOUND",
          message: `No run found for id "${runId}".`,
        },
      };
      return NextResponse.json(notFound, { status: 404 });
    }

    const response: ApiSuccessResponse<RunDetailsResponse> = {
      ok: true,
      data: { run },
    };
    return NextResponse.json(response);
  }

  const response: ApiSuccessResponse<RunListResponse> = {
    ok: true,
    data: { runs: listQaRuns() },
  };
  return NextResponse.json(response);
}
