import { Globe, MonitorSmartphone, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { RunUiStatus } from "@/components/qa/ExecutionRunControls";
import { cn } from "@/lib/utils";

interface TestProgressTrackerProps {
  totalGeneratedTestCases: number;
  currentExecutingTestCaseNumber: number;
  currentTestCaseTitle: string;
  currentUrl: string;
  browser: string;
  device: string;
  progressPercentage: number;
  runStatus?: RunUiStatus;
}

export function TestProgressTracker({
  totalGeneratedTestCases,
  currentExecutingTestCaseNumber,
  currentTestCaseTitle,
  currentUrl,
  browser,
  device,
  progressPercentage,
  runStatus = "running",
}: TestProgressTrackerProps) {
  const clampedProgress = Math.max(0, Math.min(100, progressPercentage));
  const isPaused = runStatus === "paused";

  return (
    <section className="qa-progress-panel rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-950/70">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="size-4 text-indigo-500" />
        <h3 className="font-semibold">Live Scenario Progress</h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border bg-gradient-to-br from-indigo-50/80 to-white p-4 dark:from-indigo-950/30 dark:to-slate-950">
          <p className="text-xs text-muted-foreground">Total Generated Test Cases</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{totalGeneratedTestCases}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-violet-50/80 to-white p-4 dark:from-violet-950/30 dark:to-slate-950">
          <p className="text-xs text-muted-foreground">Current Executing Test Case #</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{currentExecutingTestCaseNumber}</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border bg-muted/20 p-4">
        <p className="text-xs text-muted-foreground">Current Test Case Title</p>
        <p className="mt-1 text-sm font-medium leading-relaxed">{currentTestCaseTitle}</p>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div className="rounded-xl border p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="size-3.5" />
            Current URL
          </div>
          <p className="mt-1 truncate text-sm font-medium" title={currentUrl}>
            {currentUrl}
          </p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">Browser</p>
          <p className="mt-1 text-sm font-medium">{browser}</p>
        </div>
        <div className="rounded-xl border p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MonitorSmartphone className="size-3.5" />
            Device
          </div>
          <p className="mt-1 text-sm font-medium">{device}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Overall Progress</span>
          <span className="font-medium text-foreground">{clampedProgress}%</span>
        </div>
        <div className="relative">
          <Progress
            value={clampedProgress}
            className={cn("h-3 overflow-hidden bg-muted/60", isPaused && "opacity-70")}
          />
          {runStatus === "running" ? (
            <div className="qa-progress-shimmer pointer-events-none absolute inset-0 rounded-full" />
          ) : null}
        </div>
      </div>
    </section>
  );
}
