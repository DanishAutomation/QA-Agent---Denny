"use client";

import { useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/qa/page-title";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ExecutionHistoryRun } from "@/types";

type ViewMode = "table" | "cards";

export default function ExecutionHistoryPage() {
  const [runs, setRuns] = useState<ExecutionHistoryRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<"All" | "Passed" | "Failed" | "Running">("All");
  const [browserFilter, setBrowserFilter] = useState<"All" | "Chrome" | "Firefox" | "Edge">("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      const response = await fetch("/api/execution-history", { cache: "no-store" });
      const payload = (await response.json()) as { ok: boolean; data?: ExecutionHistoryRun[] };
      if (payload.ok && payload.data) {
        setRuns(payload.data);
      }
      setLoading(false);
    };

    void loadHistory();
  }, []);

  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      const displayStatus = normalizeStatusLabel(run.status);
      const matchesStatus = statusFilter === "All" || displayStatus === statusFilter;
      const matchesBrowser = browserFilter === "All" || run.browser === browserFilter;
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        search.length === 0 ||
        run.executionId.toLowerCase().includes(search) ||
        run.websiteUrl.toLowerCase().includes(search) ||
        run.testType.toLowerCase().includes(search);
      return matchesStatus && matchesBrowser && matchesSearch;
    });
  }, [browserFilter, runs, searchTerm, statusFilter]);

  return (
    <main className="space-y-4">
      <PageTitle
        title="Execution History"
        subtitle="Browse past runs with status, progress snapshots, and duration."
        tag="Latest 30 days"
      />

      <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
        <div className="mb-3 grid gap-3 md:grid-cols-4">
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Search</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="RUN id, project, or test type"
              className="h-9 w-full rounded-lg border px-3 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "All" | "Passed" | "Failed" | "Running")
              }
              className="h-9 w-full rounded-lg border px-3 text-sm"
            >
              <option>All</option>
              <option>Passed</option>
              <option>Failed</option>
              <option>Running</option>
            </select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Browser</span>
            <select
              value={browserFilter}
              onChange={(event) =>
                setBrowserFilter(event.target.value as "All" | "Chrome" | "Firefox" | "Edge")
              }
              className="h-9 w-full rounded-lg border px-3 text-sm"
            >
              <option>All</option>
              <option>Chrome</option>
              <option>Firefox</option>
              <option>Edge</option>
            </select>
          </label>
          <div className="flex items-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-md border px-2 py-1 text-xs ${viewMode === "table" ? "bg-indigo-50 text-indigo-700" : ""}`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`rounded-md border px-2 py-1 text-xs ${viewMode === "cards" ? "bg-indigo-50 text-indigo-700" : ""}`}
              >
                Cards
              </button>
              <Badge variant="outline">{filteredRuns.length} result(s)</Badge>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Loading execution history...
          </div>
        ) : viewMode === "table" ? (
          <TableView runs={filteredRuns} />
        ) : (
          <CardsView runs={filteredRuns} />
        )}
      </section>
    </main>
  );
}

function TableView({ runs }: { runs: ExecutionHistoryRun[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2">URL</th>
            <th className="px-3 py-2">Date/Time</th>
            <th className="px-3 py-2">Test Type</th>
            <th className="px-3 py-2">Browser</th>
            <th className="px-3 py-2">Mode</th>
            <th className="px-3 py-2">Pass/Fail/Skipped</th>
            <th className="px-3 py-2">Duration</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Report</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => {
            const label = normalizeStatusLabel(run.status);
            return (
              <tr key={run.executionId} className="border-t">
                <td className="px-3 py-2">
                  <div className="max-w-[220px] truncate" title={run.websiteUrl}>
                    {run.websiteUrl}
                  </div>
                </td>
                <td className="px-3 py-2">{formatDateTime(run.startTime)}</td>
                <td className="px-3 py-2">{run.testType}</td>
                <td className="px-3 py-2">{run.browser}</td>
                <td className="px-3 py-2">{run.mode}</td>
                <td className="px-3 py-2">
                  {run.passed}/{run.failed}/{run.skipped}
                </td>
                <td className="px-3 py-2">{formatDuration(run.durationSeconds)}</td>
                <td className="px-3 py-2">
                  <Badge
                    variant={toBadgeVariant(label)}
                    className={label === "Running" ? "qa-live-badge" : undefined}
                  >
                    {label}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <a
                    href={resolveReportUrl(run)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                  >
                    Open report
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {runs.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No execution runs match your filters.
        </div>
      ) : null}
    </div>
  );
}

function CardsView({ runs }: { runs: ExecutionHistoryRun[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {runs.map((run) => {
        const label = normalizeStatusLabel(run.status);
        const totalCases = run.totalCases > 0 ? run.totalCases : run.passed + run.failed + run.skipped;
        const completion = totalCases > 0 ? Math.round(((run.passed + run.failed + run.skipped) / totalCases) * 100) : 0;
        return (
          <article key={run.executionId} className="qa-card rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{run.executionId}</p>
                <p className="text-sm font-medium">{run.websiteUrl}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(run.startTime)} • {run.browser} • {run.mode}
                </p>
              </div>
              <Badge
                variant={toBadgeVariant(label)}
                className={label === "Running" ? "qa-live-badge" : undefined}
              >
                {label}
              </Badge>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{run.testType}</div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span>P/F/S: {run.passed}/{run.failed}/{run.skipped}</span>
              <span>Duration: {formatDuration(run.durationSeconds)}</span>
            </div>
            <div className="mt-2">
              <Progress value={completion} />
            </div>
            <div className="mt-2">
              <a
                href={resolveReportUrl(run)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
              >
                Open report
              </a>
            </div>
          </article>
        );
      })}
      {runs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground md:col-span-2">
          No execution runs match your filters.
        </div>
      ) : null}
    </div>
  );
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function formatDuration(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function normalizeStatusLabel(status: ExecutionHistoryRun["status"]): "Passed" | "Failed" | "Running" {
  if (status === "completed") {
    return "Passed";
  }
  if (status === "failed") {
    return "Failed";
  }
  return "Running";
}

function resolveReportUrl(run: ExecutionHistoryRun): string {
  const runMatch = run.reportPath.match(/(run-\d+)/i);
  const runId = runMatch?.[1];
  if (!runId) {
    return run.reportPath;
  }

  const fileName = run.reportPath.split(/[\\/]/).pop() ?? "client-report.html";
  const allowedFiles = new Set(["client-report.html", "client-report.json", "summary.md"]);
  const file = allowedFiles.has(fileName) ? fileName : "client-report.html";
  return `/api/execution/report-file?runId=${encodeURIComponent(runId)}&file=${encodeURIComponent(file)}`;
}

function toBadgeVariant(status: "Passed" | "Failed" | "Running") {
  if (status === "Passed") {
    return "success";
  }
  if (status === "Failed") {
    return "danger";
  }
  return "warning";
}
