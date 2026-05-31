"use client";

import { Pause, Play, Square, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RunUiStatus =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

interface ExecutionRunControlsProps {
  runId: string;
  runStatus: RunUiStatus;
  disabled?: boolean;
  onStatusChange?: (status: RunUiStatus) => void;
}

export function ExecutionRunControls({
  runId,
  runStatus,
  disabled = false,
  onStatusChange,
}: ExecutionRunControlsProps) {
  const isActive = runStatus === "running" || runStatus === "paused" || runStatus === "queued";
  const isPaused = runStatus === "paused";
  const isTerminal =
    runStatus === "completed" || runStatus === "failed" || runStatus === "cancelled";

  const sendControl = async (action: "pause" | "resume" | "stop") => {
    try {
      const response = await fetch("/api/execution/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, action }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        data?: { status: RunUiStatus };
      };
      if (payload.ok && payload.data?.status) {
        onStatusChange?.(payload.data.status);
      }
    } catch {
      // UI keeps current state; stream will reconcile.
    }
  };

  const statusLabel =
    runStatus === "paused"
      ? "Paused"
      : runStatus === "cancelled"
        ? "Stopped"
        : runStatus === "completed"
          ? "Completed"
          : runStatus === "failed"
            ? "Failed"
            : runStatus === "queued"
              ? "Queued"
              : "Live";

  const badgeVariant =
    runStatus === "completed"
      ? "success"
      : runStatus === "failed"
        ? "danger"
        : runStatus === "cancelled"
          ? "outline"
          : runStatus === "paused"
            ? "outline"
            : "warning";

  return (
    <section className="qa-run-controls relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-5 text-white shadow-lg">
      <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-10 size-32 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-amber-300" />
            <p className="text-sm font-semibold tracking-wide text-white/90">Run Controls</p>
          </div>
          <p className="max-w-md text-xs text-white/60">
            Pause between scenarios, resume when ready, or stop the run immediately.
          </p>
        </div>

        <Badge
          variant={badgeVariant}
          className={cn(
            "border-white/10 bg-white/10 text-white backdrop-blur",
            runStatus === "running" && "qa-live-badge"
          )}
        >
          {statusLabel}
        </Badge>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !isActive || isPaused || isTerminal}
          className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          onClick={() => void sendControl("pause")}
        >
          <Pause data-icon="inline-start" />
          Pause
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !isPaused}
          className="border-emerald-300/30 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 hover:text-white"
          onClick={() => void sendControl("resume")}
        >
          <Play data-icon="inline-start" />
          Resume
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={disabled || !isActive || isTerminal}
          className="border-rose-400/30 bg-rose-500/20 text-rose-100 hover:bg-rose-500/35"
          onClick={() => void sendControl("stop")}
        >
          <Square data-icon="inline-start" />
          Stop
        </Button>
      </div>
    </section>
  );
}
