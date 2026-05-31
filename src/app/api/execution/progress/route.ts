import { NextRequest, NextResponse } from "next/server";
import {
  getExecutionProgressSnapshot,
  subscribeExecutionProgress,
} from "@/server/execution/progressStreamStore";

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
      { ok: false, error: { code: "RUN_NOT_FOUND", message: `No active run ${runId} found.` } },
      { status: 404 }
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      let heartbeat: ReturnType<typeof setInterval> | null = null;
      let pollTimer: ReturnType<typeof setInterval> | null = null;
      let lastUpdatedAt: string | null = snapshot.updatedAt;
      let unsubscribe: (() => void) | null = null;
      const safeEnqueue = (chunk: string) => {
        if (closed) {
          return;
        }
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };
      const push = (payload: unknown) => {
        safeEnqueue(`data: ${JSON.stringify(payload)}\n\n`);
      };
      const closeStream = () => {
        if (closed) {
          return;
        }
        closed = true;
        if (heartbeat) {
          clearInterval(heartbeat);
        }
        if (pollTimer) {
          clearInterval(pollTimer);
        }
        unsubscribe?.();
        try {
          controller.close();
        } catch {
          // Stream already closed.
        }
      };

      push({ ok: true, data: snapshot });

      unsubscribe = subscribeExecutionProgress(runId, (next) => {
        push({ ok: true, data: next });
        lastUpdatedAt = next.updatedAt;
        if (next.status === "completed" || next.status === "failed" || next.status === "cancelled") {
          push({ ok: true, done: true, data: next });
          closeStream();
        }
      });

      // Always poll disk — launch worker and SSE route may run in separate isolates.
      pollTimer = setInterval(() => {
        const next = getExecutionProgressSnapshot(runId);
        if (!next) {
          return;
        }
        if (next.updatedAt !== lastUpdatedAt) {
          push({ ok: true, data: next });
          lastUpdatedAt = next.updatedAt;
        }
        if (next.status === "completed" || next.status === "failed" || next.status === "cancelled") {
          push({ ok: true, done: true, data: next });
          closeStream();
        }
      }, 800);

      heartbeat = setInterval(() => {
        safeEnqueue(": heartbeat\n\n");
      }, 15000);

      request.signal.addEventListener("abort", () => {
        closeStream();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
