"use client";

import { useState } from "react";
import { PageTitle } from "@/components/qa/page-title";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { DiscoveryResult } from "@/types";

interface DiscoveryApiResponse {
  ok: boolean;
  data?: DiscoveryResult;
  error?: { message: string };
}

export default function DiscoveryLabPage() {
  const [url, setUrl] = useState("https://example.com");
  const [maxDepth, setMaxDepth] = useState(2);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<DiscoveryResult | null>(null);

  const runDiscovery = async () => {
    setRunning(true);
    setError(null);
    setMessage("Starting discovery...");
    setResult(null);
    try {
      const response = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, maxDepth }),
      });
      const payload = (await response.json()) as DiscoveryApiResponse;
      if (!payload.ok || !payload.data) {
        setError(payload.error?.message ?? "Discovery failed.");
      } else {
        setResult(payload.data);
        setMessage(
          `Discovery completed: ${payload.data.pagesFound.length} pages, ${payload.data.formsFound.length} forms, ${payload.data.linksFound.length} links.`
        );
      }
    } catch {
      setError("Could not connect to discovery API.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="space-y-4">
      <PageTitle
        title="Discovery Lab"
        subtitle="Run website discovery crawl and inspect capabilities/signals before test generation."
        tag="Playwright Crawl"
      />

      <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Website URL</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="h-10 w-full rounded-lg border px-3"
              placeholder="https://example.com"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Crawl Depth</span>
            <input
              type="number"
              min={0}
              max={5}
              value={maxDepth}
              onChange={(event) => setMaxDepth(Number(event.target.value))}
              className="h-10 w-full rounded-lg border px-3"
            />
          </label>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={runDiscovery}
            disabled={running}
            className={buttonVariants({
              className:
                "h-10 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:opacity-90",
            })}
          >
            {running ? "Running Discovery..." : "Run Discovery"}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-indigo-600">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      {result ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric label="Website Type" value={result.websiteType} />
            <Metric label="Pages Found" value={String(result.pagesFound.length)} />
            <Metric label="Forms Found" value={String(result.formsFound.length)} />
            <Metric label="Links Found" value={String(result.linksFound.length)} />
            <Metric
              label="Possible Journeys"
              value={String(result.possibleJourneys.length)}
            />
          </section>

          <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
            <h3 className="mb-2 font-semibold">Capabilities</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.capabilities).map(([key, enabled]) => (
                <Badge key={key} variant={enabled ? "success" : "outline"}>
                  {key}
                </Badge>
              ))}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <ListCard title="Detected Ecommerce Signals" items={result.detectedEcommerceSignals} />
            <ListCard title="Detected Form Signals" items={result.detectedFormSignals} />
            <ListCard title="Detected Static Pages" items={result.detectedStaticPages} />
            <ListCard title="Possible Journeys" items={result.possibleJourneys} />
          </section>

          <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
            <h3 className="mb-2 font-semibold">Important Selectors</h3>
            <div className="max-h-64 overflow-y-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs">
              {result.importantSelectors.slice(0, 120).map((selector) => (
                <div key={selector}>{selector}</div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </article>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <div className="max-h-52 overflow-y-auto rounded-lg border bg-muted/20 p-2 text-sm">
        {items.length === 0 ? (
          <p className="text-muted-foreground">No items detected.</p>
        ) : (
          items.map((item) => <div key={item}>{item}</div>)
        )}
      </div>
    </section>
  );
}
