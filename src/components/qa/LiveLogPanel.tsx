"use client";

import { useEffect, useRef } from "react";

interface LiveLogPanelProps {
  logs: string[];
}

function logTone(line: string): string {
  if (/failed|error|stop|could not/i.test(line)) {
    return "border-rose-500/30 bg-rose-500/10 text-rose-200";
  }
  if (/skipped|optional|not required|already on file/i.test(line)) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  }
  if (/passed|completed|success|recovered|clicked make payment/i.test(line)) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  }
  if (/paused|resume|queued/i.test(line)) {
    return "border-sky-500/30 bg-sky-500/10 text-sky-100";
  }
  return "border-white/10 bg-white/5 text-emerald-100/90";
}

export function LiveLogPanel({ logs }: LiveLogPanelProps) {
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!logsContainerRef.current) {
      return;
    }
    logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
  }, [logs]);

  return (
    <section className="qa-log-panel rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-950/70">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Live Logs</h3>
        <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          {logs.length} events
        </span>
      </div>
      <div
        ref={logsContainerRef}
        className="qa-log-stream max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-3 font-mono text-xs"
      >
        {logs.length === 0 ? (
          <p className="px-2 py-6 text-center text-slate-500">Waiting for execution events…</p>
        ) : (
          logs.map((log, idx) => (
            <div
              key={`${log}-${idx}`}
              className={`rounded-md border px-2.5 py-1.5 ${logTone(log)}`}
            >
              {log}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
