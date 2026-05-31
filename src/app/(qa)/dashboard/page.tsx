"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, PlayCircle } from "lucide-react";
import { PageTitle } from "@/components/qa/page-title";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExecutionHistoryRun, ExecutionRunResult } from "@/types";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<ExecutionHistoryRun[]>([]);
  const [latestRun, setLatestRun] = useState<ExecutionRunResult | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [historyRes, latestRes] = await Promise.all([
          fetch("/api/execution-history", { cache: "no-store" }),
          fetch("/api/execution/latest-report", { cache: "no-store" }),
        ]);
        const historyPayload = (await historyRes.json()) as {
          ok: boolean;
          data?: ExecutionHistoryRun[];
        };
        const latestPayload = (await latestRes.json()) as {
          ok: boolean;
          data: ExecutionRunResult | null;
        };
        if (historyPayload.ok && historyPayload.data) {
          setRuns(historyPayload.data);
        }
        if (latestPayload.ok && latestPayload.data) {
          setLatestRun(latestPayload.data);
        }
      } finally {
        setLoading(false);
      }
    };
    void loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const totalExecutions = runs.length;
    const totals = runs.reduce(
      (acc, run) => {
        acc.passed += run.passed;
        acc.failed += run.failed;
        acc.skipped += run.skipped;
        acc.duration += run.durationSeconds;
        return acc;
      },
      { passed: 0, failed: 0, skipped: 0, duration: 0 }
    );
    const totalCases = totals.passed + totals.failed + totals.skipped;
    const passRate = totalCases > 0 ? ((totals.passed / totalCases) * 100).toFixed(1) : "0.0";
    const avgDurationSec = totalExecutions > 0 ? Math.round(totals.duration / totalExecutions) : 0;
    const criticalBugs =
      latestRun?.bugReports.filter((bug) => bug.severity === "Critical").length ?? 0;

    return [
      { label: "Total Executions", value: String(totalExecutions), trend: "Live history" },
      { label: "Pass Rate", value: `${passRate}%`, trend: "Based on real runs" },
      { label: "Critical Bugs", value: String(criticalBugs), trend: "From latest run" },
      {
        label: "Avg. Runtime",
        value: formatDuration(avgDurationSec),
        trend: "Execution history average",
      },
    ];
  }, [latestRun, runs]);

  const recentRuns = useMemo(() => runs.slice(0, 6), [runs]);

  const weeklyQualityTrend = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const lastSix = [...runs].slice(0, 6).reverse();
    return labels.map((day, idx) => {
      const run = lastSix[idx];
      const total = run ? run.passed + run.failed + run.skipped : 0;
      const passRate = total > 0 ? Math.round((run.passed / total) * 100) : 0;
      return { day, passRate };
    });
  }, [runs]);

  const browserStability = useMemo(() => {
    const byBrowser = new Map<string, { pass: number; total: number }>();
    for (const run of runs) {
      const total = run.passed + run.failed + run.skipped;
      const current = byBrowser.get(run.browser) ?? { pass: 0, total: 0 };
      current.pass += run.passed;
      current.total += total;
      byBrowser.set(run.browser, current);
    }
    return ["Chrome", "Firefox", "Edge"].map((browser) => {
      const item = byBrowser.get(browser) ?? { pass: 0, total: 0 };
      return {
        browser,
        score: item.total > 0 ? Math.round((item.pass / item.total) * 100) : 0,
      };
    });
  }, [runs]);

  if (loading) {
    return (
      <main className="space-y-4">
        <PageTitle
          title="Dashboard"
          subtitle="Loading your latest quality snapshot..."
          tag="Refreshing"
        />
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-20" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <PageTitle
        title="Dashboard"
        subtitle="Monitor live quality signals and latest execution trends."
        tag="Live Data"
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70"
          >
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
            <p className="mt-1 text-xs text-emerald-600">{metric.trend}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <article className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Recent Executions</h3>
            <Badge variant="secondary">Live updates</Badge>
          </div>
          <div className="space-y-3">
            {recentRuns.length === 0 ? (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                No execution runs available yet. Launch your first live run from New Execution.
              </div>
            ) : (
              recentRuns.map((run) => (
                <div key={run.executionId} className="qa-card rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{run.websiteUrl}</p>
                      <p className="text-xs text-muted-foreground">
                        {run.executionId} • {run.testType} • {run.browser}
                      </p>
                    </div>
                    <Badge
                      variant={
                        run.status === "completed"
                          ? "success"
                          : run.status === "failed"
                            ? "danger"
                            : "warning"
                      }
                      className={run.status === "running" ? "qa-live-badge" : undefined}
                    >
                      {run.status}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <Progress
                      value={
                        run.status === "completed" || run.status === "failed"
                          ? 100
                          : Math.min(
                              100,
                              run.totalCases > 0
                                ? Math.round(
                                    ((run.passed + run.failed + run.skipped) / run.totalCases) * 100
                                  )
                                : 0
                            )
                      }
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="qa-card space-y-3 rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70 xl:col-span-2">
          <h3 className="font-semibold">Today&apos;s Highlights</h3>
          <div className="grid gap-2 text-sm">
            <div className="rounded-lg border bg-emerald-50/60 p-3 text-emerald-800 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                {latestRun ? `${latestRun.passed} scenarios passed in latest run` : "No run data yet"}
              </div>
            </div>
            <div className="rounded-lg border bg-amber-50/60 p-3 text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <Clock3 className="size-4" />
                {runs.filter((run) => run.status === "running").length} runs currently running
              </div>
            </div>
            <div className="rounded-lg border bg-rose-50/60 p-3 text-rose-800 dark:text-rose-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4" />
                {latestRun ? latestRun.failed : 0} failed scenarios in latest run
              </div>
            </div>
            <div className="rounded-lg border bg-indigo-50/60 p-3 text-indigo-800 dark:text-indigo-200">
              <div className="flex items-center gap-2">
                <PlayCircle className="size-4" />
                {runs.length} total execution records available
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <article className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Weekly Pass Rate</h3>
            <Badge variant="outline">Live trend</Badge>
          </div>
          <div className="grid grid-cols-6 items-end gap-2">
            {weeklyQualityTrend.map((item) => (
              <div key={item.day} className="space-y-2 text-center">
                <div className="flex h-28 items-end justify-center rounded-md bg-muted/40 p-1">
                  <div
                    className="w-full rounded-sm bg-gradient-to-t from-indigo-500 to-cyan-400"
                    style={{ height: `${item.passRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{item.day}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Browser Stability</h3>
            <Badge variant="secondary">Live score</Badge>
          </div>
          <div className="space-y-3">
            {browserStability.map((item) => (
              <div key={item.browser}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>{item.browser}</span>
                  <span>{item.score}%</span>
                </div>
                <Progress value={item.score} />
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

function formatDuration(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}
