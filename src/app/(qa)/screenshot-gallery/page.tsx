"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageTitle } from "@/components/qa/page-title";
import { ExecutionScreenshotGallery } from "@/components/qa/ExecutionScreenshotGallery";
import { Badge } from "@/components/ui/badge";
import type { ExecutionRunResult } from "@/types";

export default function ScreenshotGalleryPage() {
  const [runId, setRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActiveRun, setIsActiveRun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const resolveRun = async () => {
      const runIdFromUrl = new URLSearchParams(window.location.search).get("runId");
      if (runIdFromUrl) {
        setRunId(runIdFromUrl);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/execution/latest-report", { cache: "no-store" });
        const payload = (await response.json()) as {
          ok: boolean;
          data: ExecutionRunResult | null;
        };
        if (payload.ok && payload.data?.runId) {
          setRunId(payload.data.runId);
        } else {
          setError("No execution run found yet. Launch a run to capture screenshots.");
        }
      } catch {
        setError("Could not load screenshot gallery data.");
      } finally {
        setLoading(false);
      }
    };

    void resolveRun();
  }, []);

  useEffect(() => {
    if (!runId) {
      return;
    }

    const source = new EventSource(
      `/api/execution/progress?runId=${encodeURIComponent(runId)}`
    );

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          ok: boolean;
          done?: boolean;
          data?: { status?: string };
        };
        if (!payload.ok || !payload.data) {
          return;
        }
        const status = payload.data.status ?? "running";
        setIsActiveRun(status === "running" || status === "paused" || status === "queued");
        if (payload.done) {
          setIsActiveRun(false);
          source.close();
        }
      } catch {
        setIsActiveRun(false);
      }
    };

    source.onerror = () => {
      setIsActiveRun(false);
      source.close();
    };

    return () => source.close();
  }, [runId]);

  return (
    <main className="qa-page space-y-4">
      <PageTitle
        title="Screenshot Gallery"
        subtitle="Execution captures with full-size preview. Pass ?runId= in the URL to view a specific run."
        tag={runId ?? "Latest Run"}
      />

      {loading ? (
        <section className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <p className="text-sm text-muted-foreground">Loading screenshot gallery…</p>
        </section>
      ) : error ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {error}
        </section>
      ) : runId ? (
        <>
          <section className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Run: {runId}</Badge>
            {isActiveRun ? (
              <Badge variant="warning" className="qa-live-badge">
                Live — refreshing every 4s
              </Badge>
            ) : (
              <Badge variant="outline">Completed run</Badge>
            )}
            <Link
              href={`/execution-progress?runId=${encodeURIComponent(runId)}`}
              className="text-xs text-indigo-600 hover:underline"
            >
              View execution progress
            </Link>
          </section>

          <ExecutionScreenshotGallery runId={runId} isActive={isActiveRun} />
        </>
      ) : null}
    </main>
  );
}
