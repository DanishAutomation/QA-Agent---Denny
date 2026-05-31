"use client";

import { useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/qa/page-title";
import { ScreenshotVerdictFrame } from "@/components/qa/ScreenshotVerdictFrame";
import { Badge } from "@/components/ui/badge";
import {
  responsiveIssueFlags,
  verdictBadgeVariant,
  verdictLabel,
  type ScreenshotVerdict,
} from "@/lib/screenshotIssueLabels";
import type { ResponsiveTestReport } from "@/types";

type GalleryFinding = ResponsiveTestReport["findings"][number] & {
  screenshotFile: string;
};

interface GalleryPayload {
  runId: string;
  responsiveReport: Omit<ResponsiveTestReport, "findings"> & {
    findings: GalleryFinding[];
  };
}

type FilterMode = "all" | "pass" | "fail";

function findingVerdict(item: GalleryFinding): ScreenshotVerdict {
  const flags = responsiveIssueFlags(item);
  return flags.length > 0 ? "fail" : "pass";
}

export default function ResponsiveGalleryPage() {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<GalleryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/execution/responsive-gallery", {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          ok: boolean;
          data: GalleryPayload | null;
          message?: string;
        };
        if (!data.ok || !data.data) {
          setError(data.message ?? "No responsive data found.");
        } else {
          setPayload(data.data);
        }
      } catch {
        setError("Could not load responsive gallery data.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const findings = payload?.responsiveReport.findings ?? [];
  const summary = useMemo(() => {
    const pass = findings.filter((item) => findingVerdict(item) === "pass").length;
    const fail = findings.filter((item) => findingVerdict(item) === "fail").length;
    return { total: findings.length, pass, fail };
  }, [findings]);

  const filteredFindings = useMemo(() => {
    if (filter === "pass") {
      return findings.filter((item) => findingVerdict(item) === "pass");
    }
    if (filter === "fail") {
      return findings.filter((item) => findingVerdict(item) === "fail");
    }
    return findings;
  }, [filter, findings]);

  return (
    <main className="space-y-4">
      <PageTitle
        title="Responsive Gallery"
        subtitle="Each viewport screenshot is labeled PASS (green) or FAIL (red) with specific layout issues called out."
        tag={payload?.runId ?? "Latest Run"}
      />

      {loading ? (
        <section className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
          <p className="text-sm text-muted-foreground">Loading responsive gallery...</p>
        </section>
      ) : error ? (
        <section className="rounded-xl border bg-amber-50 p-4 text-sm text-amber-700">
          {error}
        </section>
      ) : payload ? (
        <>
          <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">{summary.pass} healthy</Badge>
              <Badge variant="danger">{summary.fail} with issues</Badge>
              <Badge variant="secondary">{summary.total} captures</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["all", `All (${summary.total})`],
                  ["pass", `Healthy (${summary.pass})`],
                  ["fail", `Issues (${summary.fail})`],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilter(mode)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    filter === mode
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200"
                      : "hover:bg-muted/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            {filteredFindings.map((item, index) => {
              const issueFlags = responsiveIssueFlags(item);
              const verdict = findingVerdict(item);
              const pageLabel =
                item.screenshotFile === "desktop-viewport.png"
                  ? item.viewport
                  : `${item.viewport} · ${item.screenshotFile.replace(/^desktop-/, "").replace(/\.png$/i, "")}`;
              const issueSummary =
                verdict === "fail"
                  ? item.notes[0] ?? `${issueFlags.length} responsive issue(s) detected`
                  : "No responsive issues detected";

              return (
                <article
                  key={`${item.screenshotFile}-${index}`}
                  className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{pageLabel}</h3>
                    <Badge variant={verdictBadgeVariant(verdict)}>{verdictLabel(verdict)}</Badge>
                  </div>
                  <ScreenshotVerdictFrame
                    verdict={verdict}
                    issueSummary={issueSummary}
                    issueFlags={issueFlags}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/execution/responsive-gallery/image?runId=${encodeURIComponent(
                        payload.runId
                      )}&file=${encodeURIComponent(item.screenshotFile)}`}
                      alt={`${item.viewport} responsive screenshot`}
                      className="h-auto w-full object-cover pb-8 pt-10"
                    />
                  </ScreenshotVerdictFrame>
                  {item.notes.length > 0 ? (
                    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                      {item.notes.map((note, noteIndex) => (
                        <p key={`${item.screenshotFile}-note-${noteIndex}`}>{note}</p>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        </>
      ) : null}
    </main>
  );
}
