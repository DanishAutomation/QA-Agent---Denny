"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, ExternalLink, ImageIcon, Maximize2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScreenshotVerdictFrame } from "@/components/qa/ScreenshotVerdictFrame";
import {
  verdictBadgeVariant,
  verdictBorderClass,
  verdictLabel,
  type ScreenshotVerdict,
} from "@/lib/screenshotIssueLabels";

export interface ExecutionScreenshotItem {
  fileName: string;
  scenarioId: string;
  device: string;
  captureType: "landing" | "recovered" | "failure" | "other";
  status: "passed" | "failed" | "unknown";
  verdict: ScreenshotVerdict;
  capturedAt: string;
  folder: "screenshots" | "forms-screenshots" | "responsive-screenshots";
  category: "scenario" | "form" | "responsive";
  title: string;
  issueSummary?: string;
  issueFlags: string[];
}

interface ExecutionScreenshotGalleryProps {
  runId: string;
  isActive?: boolean;
}

type FilterMode = "all" | "pass" | "fail";

function buildImageUrl(runId: string, folder: string, fileName: string): string {
  return `/api/execution/screenshot-gallery/image?runId=${encodeURIComponent(runId)}&folder=${encodeURIComponent(folder)}&file=${encodeURIComponent(fileName)}`;
}

function categoryLabel(category: ExecutionScreenshotItem["category"]): string {
  if (category === "scenario") return "Scenario";
  if (category === "form") return "Form";
  return "Responsive";
}

export function ExecutionScreenshotGallery({
  runId,
  isActive = false,
}: ExecutionScreenshotGalleryProps) {
  const [screenshots, setScreenshots] = useState<ExecutionScreenshotItem[]>([]);
  const [summary, setSummary] = useState({ total: 0, pass: 0, fail: 0, info: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ExecutionScreenshotItem | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    setScreenshots([]);
    setSelected(null);
    setLightboxOpen(false);
    setLoading(true);

    if (!runId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(
          `/api/execution/screenshot-gallery?runId=${encodeURIComponent(runId)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as {
          ok: boolean;
          data?: {
            screenshots: ExecutionScreenshotItem[];
            summary?: { total: number; pass: number; fail: number; info: number };
          };
        };
        if (cancelled || !payload.ok || !payload.data) {
          return;
        }
        setScreenshots(payload.data.screenshots);
        setSummary(
          payload.data.summary ?? {
            total: payload.data.screenshots.length,
            pass: payload.data.screenshots.filter((item) => item.verdict === "pass").length,
            fail: payload.data.screenshots.filter((item) => item.verdict === "fail").length,
            info: payload.data.screenshots.filter((item) => item.verdict === "info").length,
          }
        );
        setSelected((current) => {
          if (current) {
            const stillExists = payload.data!.screenshots.some(
              (item) =>
                item.folder === current.folder && item.fileName === current.fileName
            );
            if (stillExists) {
              return payload.data!.screenshots.find(
                (item) =>
                  item.folder === current.folder && item.fileName === current.fileName
              )!;
            }
          }
          return payload.data!.screenshots[0] ?? null;
        });
      } catch {
        // Keep previous empty state for this run.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    const interval = setInterval(() => {
      if (isActive) {
        void load();
      }
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [runId, isActive]);

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen]);

  const filteredScreenshots = useMemo(() => {
    if (filter === "pass") {
      return screenshots.filter((item) => item.verdict === "pass");
    }
    if (filter === "fail") {
      return screenshots.filter((item) => item.verdict === "fail");
    }
    return screenshots;
  }, [filter, screenshots]);

  const previewSrc = selected
    ? buildImageUrl(runId, selected.folder, selected.fileName)
    : null;

  return (
    <>
      <section className="qa-card rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-950/70">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Camera className="size-4 text-indigo-500" />
            <div>
              <h3 className="font-semibold">Screenshot Gallery</h3>
              <p className="text-xs text-muted-foreground">
                Green = pass · Red = fail · Issue labels are shown on each capture.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">{summary.pass} pass</Badge>
            <Badge variant="danger">{summary.fail} fail</Badge>
            <Badge variant="secondary">{summary.total} total</Badge>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["all", `All (${summary.total})`],
              ["pass", `Pass (${summary.pass})`],
              ["fail", `Fail (${summary.fail})`],
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

        {loading && screenshots.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Loading screenshots…
          </div>
        ) : filteredScreenshots.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            <ImageIcon className="mx-auto mb-2 size-8 opacity-40" />
            No screenshots match this filter.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
            <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {filteredScreenshots.map((item) => {
                const isSelected =
                  selected?.fileName === item.fileName && selected?.folder === item.folder;
                return (
                  <button
                    key={`${item.folder}-${item.fileName}`}
                    type="button"
                    onClick={() => setSelected(item)}
                    className={`flex w-full items-start gap-3 rounded-xl border-2 p-2 text-left transition ${
                      isSelected
                        ? "border-indigo-400 bg-indigo-50/70 dark:border-indigo-700 dark:bg-indigo-950/30"
                        : verdictBorderClass(item.verdict)
                    }`}
                  >
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={buildImageUrl(runId, item.folder, item.fileName)}
                        alt={item.title}
                        className="size-16 rounded-md border object-cover"
                      />
                      <span
                        className={`absolute -right-1 -top-1 rounded px-1 text-[9px] font-bold ${
                          item.verdict === "pass"
                            ? "bg-emerald-600 text-white"
                            : item.verdict === "fail"
                              ? "bg-rose-600 text-white"
                              : "bg-slate-600 text-white"
                        }`}
                      >
                        {verdictLabel(item.verdict)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.fileName}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant={verdictBadgeVariant(item.verdict)} className="text-[10px]">
                          {verdictLabel(item.verdict)}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {categoryLabel(item.category)}
                        </Badge>
                      </div>
                      {item.issueSummary ? (
                        <p className="mt-1 line-clamp-2 text-[11px] text-rose-700 dark:text-rose-300">
                          {item.issueSummary}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border bg-slate-950/5 dark:bg-slate-900/40">
              {previewSrc && selected ? (
                <>
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="group relative flex flex-1 items-center justify-center bg-slate-950 p-2"
                    aria-label="Enlarge screenshot"
                  >
                    <ScreenshotVerdictFrame
                      verdict={selected.verdict}
                      issueSummary={selected.issueSummary}
                      issueFlags={selected.issueFlags}
                      className="w-full border-0 ring-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewSrc}
                        alt={selected.title}
                        className="max-h-[min(60vh,560px)] w-full object-contain pb-8 pt-10"
                      />
                    </ScreenshotVerdictFrame>
                    <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                      <Maximize2 className="size-3.5" />
                      Enlarge
                    </span>
                  </button>
                  <div className="border-t bg-background p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap gap-1">
                          <Badge variant={verdictBadgeVariant(selected.verdict)}>
                            {verdictLabel(selected.verdict)}
                          </Badge>
                          <Badge variant="outline">{categoryLabel(selected.category)}</Badge>
                          <Badge variant="outline">{selected.device}</Badge>
                        </div>
                        <p className="font-medium">{selected.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {selected.captureType} · {new Date(selected.capturedAt).toLocaleTimeString()}
                        </p>
                        {selected.issueSummary ? (
                          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
                            {selected.issueSummary}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => setLightboxOpen(true)}
                          className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted"
                        >
                          <Maximize2 className="size-3.5" />
                          Enlarge
                        </button>
                        <a
                          href={previewSrc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200"
                        >
                          <ExternalLink className="size-3.5" />
                          Open in new tab
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
                  Select a screenshot from the list.
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {lightboxOpen && previewSrc && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/80"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close enlarged screenshot"
          />
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap gap-1">
                  <Badge variant={verdictBadgeVariant(selected.verdict)}>
                    {verdictLabel(selected.verdict)}
                  </Badge>
                  <Badge variant="outline">{categoryLabel(selected.category)}</Badge>
                </div>
                <p className="truncate text-sm font-medium">{selected.title}</p>
                <p className="truncate text-xs text-white/70">{selected.fileName}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={previewSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-white/20 px-2.5 py-1.5 text-xs hover:bg-white/10"
                >
                  <ExternalLink className="size-3.5" />
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="rounded-md border border-white/20 p-2 hover:bg-white/10"
                  aria-label="Close lightbox"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto bg-black p-4">
              <ScreenshotVerdictFrame
                verdict={selected.verdict}
                issueSummary={selected.issueSummary}
                issueFlags={selected.issueFlags}
                className="w-full max-w-5xl border-0 ring-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt={selected.title}
                  className="max-h-[calc(92vh-8rem)] w-full object-contain pb-8 pt-10"
                />
              </ScreenshotVerdictFrame>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
