import { Activity, CheckCircle2, PauseCircle, StopCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ExecutionPhase } from "@/lib/mockExecutionState";
import type { RunUiStatus } from "@/components/qa/ExecutionRunControls";
import { cn } from "@/lib/utils";

interface ExecutionStatusCardProps {
  runId: string;
  currentPhase: ExecutionPhase;
  runStatus?: RunUiStatus;
  passCount: number;
  failCount: number;
  skippedCount: number;
}

function phaseDisplayLabel(phase: ExecutionPhase | string): string {
  if (phase === "Analysis") {
    return "Post-run analysis";
  }
  switch (phase) {
    case "Discovery":
      return "Discovery";
    case "Crawling":
      return "Crawling site pages";
    case "Test Generation":
      return "Generating test cases";
    case "Execution":
      return "Running scenarios";
    case "Self-Healing":
      return "Self-healing retries";
    case "Post-Run Analysis":
      return "Post-run analysis";
    case "Reporting":
      return "Generating reports";
    default:
      return phase;
  }
}

function statusMeta(runStatus: RunUiStatus, currentPhase: ExecutionPhase) {
  if (runStatus === "completed") {
    return { label: "Completed", variant: "success" as const, icon: CheckCircle2, tone: "emerald" };
  }
  if (runStatus === "failed") {
    return { label: "Failed", variant: "danger" as const, icon: XCircle, tone: "rose" };
  }
  if (runStatus === "cancelled") {
    return { label: "Stopped", variant: "outline" as const, icon: StopCircle, tone: "slate" };
  }
  if (runStatus === "paused") {
    return { label: "Paused", variant: "outline" as const, icon: PauseCircle, tone: "amber" };
  }
  if (runStatus === "queued") {
    return { label: "Queued", variant: "outline" as const, icon: Activity, tone: "slate" };
  }
  return {
    label: phaseDisplayLabel(currentPhase),
    variant: "warning" as const,
    icon: Activity,
    tone: "indigo",
  };
}

export function ExecutionStatusCard({
  runId,
  currentPhase,
  runStatus = "running",
  passCount,
  failCount,
  skippedCount,
}: ExecutionStatusCardProps) {
  const meta = statusMeta(runStatus, currentPhase);
  const StatusIcon = meta.icon;
  const total = passCount + failCount + skippedCount;

  return (
    <section className="qa-status-hero relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-950/70">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_45%)]" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Execution Run</p>
          <p className="mt-1 font-mono text-sm font-semibold">{runId}</p>
        </div>
        <Badge
          variant={meta.variant}
          className={cn(runStatus === "running" && "qa-live-badge", "gap-1.5 px-3 py-1")}
        >
          <StatusIcon className="size-3.5" />
          {meta.label}
        </Badge>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-white p-3 dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-slate-950">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Pass</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800 dark:text-emerald-200">{passCount}</p>
          <p className="text-[11px] text-emerald-600/80">
            {total > 0 ? `${Math.round((passCount / total) * 100)}%` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-rose-200/70 bg-gradient-to-br from-rose-50 to-white p-3 dark:border-rose-900/40 dark:from-rose-950/40 dark:to-slate-950">
          <p className="text-xs font-medium text-rose-700 dark:text-rose-300">Fail</p>
          <p className="mt-1 text-2xl font-semibold text-rose-800 dark:text-rose-200">{failCount}</p>
          <p className="text-[11px] text-rose-600/80">
            {total > 0 ? `${Math.round((failCount / total) * 100)}%` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-3 dark:border-amber-900/40 dark:from-amber-950/40 dark:to-slate-950">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Skipped</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800 dark:text-amber-200">{skippedCount}</p>
          <p className="text-[11px] text-amber-600/80">conditional steps</p>
        </div>
      </div>
    </section>
  );
}
