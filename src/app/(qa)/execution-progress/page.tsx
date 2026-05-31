"use client";

import { useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/qa/page-title";
import { ExecutionPhaseStepper } from "@/components/qa/ExecutionPhaseStepper";
import { ExecutionRunControls, type RunUiStatus } from "@/components/qa/ExecutionRunControls";
import { ExecutionStatusCard } from "@/components/qa/ExecutionStatusCard";
import { LiveLogPanel } from "@/components/qa/LiveLogPanel";
import { TestCaseStatusList } from "@/components/qa/TestCaseStatusList";
import { TestProgressTracker } from "@/components/qa/TestProgressTracker";
import {
  executionPhases,
  executionStateSnapshots,
  type ExecutionStateSnapshot,
  type TestCaseItem,
} from "@/lib/mockExecutionState";
import type { ExecutionRunResult } from "@/types";

interface StreamSnapshot extends ExecutionStateSnapshot {
  status: RunUiStatus;
  error?: string;
}

function toCompletedSnapshot(run: ExecutionRunResult): ExecutionStateSnapshot {
  const currentScenario =
    run.scenarios.find((scenario) => scenario.status === "failed") ??
    run.scenarios.find((scenario) => scenario.status === "passed") ??
    run.scenarios[0];

  const testCases: TestCaseItem[] = run.scenarios.map((scenario, idx) => ({
    id: scenario.scenarioId || `TC-${idx + 1}`,
    title: scenario.scenario,
    status: scenario.status,
  }));

  const logFeed: string[] = [
    `[${new Date(run.startedAt).toLocaleTimeString()}] Run started (${run.runId})`,
    `[${new Date(run.completedAt).toLocaleTimeString()}] Run completed in ${Math.round(
      run.durationMs / 1000
    )}s`,
    `Summary: passed=${run.passed}, failed=${run.failed}, skipped=${run.skipped}`,
  ];

  for (const scenario of run.scenarios.slice(0, 8)) {
    logFeed.push(
      `${scenario.status.toUpperCase()} ${scenario.scenarioId}: ${scenario.feature} - ${scenario.scenario}`
    );
  }

  return {
    runId: run.runId,
    currentPhase: "Reporting",
    totalGeneratedTestCases: run.scenarios.length,
    currentExecutingTestCaseNumber: run.scenarios.length,
    currentTestCaseTitle: currentScenario?.scenario ?? "No scenarios executed",
    currentUrl: currentScenario?.pageUrl ?? "",
    browser: "Chrome",
    device: "Desktop",
    progressPercentage: 100,
    passCount: run.passed,
    failCount: run.failed,
    skippedCount: run.skipped,
    liveLogs: logFeed,
    testCases,
  };
}

export default function ExecutionProgressPage() {
  const [snapshotIndex] = useState(0);
  const [liveRun, setLiveRun] = useState<ExecutionRunResult | null>(null);
  const [streamSnapshot, setStreamSnapshot] = useState<StreamSnapshot | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [runIdFromUrl, setRunIdFromUrl] = useState<string | null>(null);

  const completedSnapshot = useMemo(
    () => (liveRun ? toCompletedSnapshot(liveRun) : null),
    [liveRun]
  );
  const waitingSnapshot = useMemo<ExecutionStateSnapshot | null>(() => {
    if (!runIdFromUrl || streamSnapshot || completedSnapshot) {
      return null;
    }
    return {
      runId: runIdFromUrl,
      currentPhase: "Discovery",
      totalGeneratedTestCases: 0,
      currentExecutingTestCaseNumber: 0,
      currentTestCaseTitle: "Connecting to live progress…",
      currentUrl: "",
      browser: "Chrome",
      device: "Desktop",
      progressPercentage: 3,
      passCount: 0,
      failCount: 0,
      skippedCount: 0,
      liveLogs: [`[${new Date().toLocaleTimeString()}] Waiting for live progress updates…`],
      testCases: [],
    };
  }, [runIdFromUrl, streamSnapshot, completedSnapshot]);
  const currentSnapshot =
    streamSnapshot ??
    completedSnapshot ??
    waitingSnapshot ??
    executionStateSnapshots[snapshotIndex];
  const currentRunStatus: RunUiStatus = streamSnapshot
    ? streamSnapshot.status
    : completedSnapshot
      ? "completed"
      : "running";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const currentRunId = new URLSearchParams(window.location.search).get("runId");
    setRunIdFromUrl(currentRunId);
    if (!currentRunId) {
      const loadLatestRun = async () => {
        try {
          const response = await fetch("/api/execution/latest-report", { cache: "no-store" });
          const payload = (await response.json()) as {
            ok: boolean;
            data: ExecutionRunResult | null;
          };
          if (payload.ok && payload.data) {
            setLiveRun(payload.data);
          }
        } catch {
          setLiveError("Could not load latest execution report.");
        }
      };
      void loadLatestRun();
      return;
    }

    let closed = false;
    let source: EventSource | null = null;

    const applySnapshot = (data: StreamSnapshot) => {
      setStreamSnapshot(data);
      setLiveError(null);
    };

    const loadSnapshot = async () => {
      try {
        const response = await fetch(
          `/api/execution/progress/snapshot?runId=${encodeURIComponent(currentRunId)}`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as {
          ok: boolean;
          data?: StreamSnapshot;
        };
        if (payload.ok && payload.data) {
          applySnapshot(payload.data);
          if (
            payload.data.status === "completed" ||
            payload.data.status === "failed" ||
            payload.data.status === "cancelled"
          ) {
            closed = true;
            source?.close();
          }
        }
      } catch {
        // Polling fallback is best-effort when SSE is unavailable.
      }
    };

    const connectStream = () => {
      source = new EventSource(
        `/api/execution/progress?runId=${encodeURIComponent(currentRunId)}`
      );
      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            ok: boolean;
            done?: boolean;
            data?: StreamSnapshot;
          };
          if (!payload.ok || !payload.data) {
            return;
          }
          applySnapshot(payload.data);
          if (payload.done) {
            closed = true;
            source?.close();
          }
        } catch {
          setLiveError("Could not parse live progress payload.");
        }
      };
      source.onerror = () => {
        source?.close();
        source = null;
      };
    };

    void loadSnapshot();
    connectStream();
    const pollTimer = window.setInterval(() => {
      if (closed) {
        return;
      }
      void loadSnapshot();
    }, 2000);

    return () => {
      closed = true;
      window.clearInterval(pollTimer);
      source?.close();
    };
  }, []);

  const logFeed = useMemo(() => {
    if (streamSnapshot) {
      return streamSnapshot.liveLogs;
    }
    if (completedSnapshot) {
      return completedSnapshot.liveLogs;
    }
    return executionStateSnapshots
      .slice(0, snapshotIndex + 1)
      .flatMap((snapshot) => snapshot.liveLogs);
  }, [snapshotIndex, streamSnapshot, completedSnapshot]);

  const subtitle = streamSnapshot
    ? streamSnapshot.status === "paused"
      ? "Run is paused — resume or stop from controls below."
      : streamSnapshot.status === "cancelled"
        ? "Run was stopped by user."
        : `Live stream active (${streamSnapshot.status}).`
    : completedSnapshot
      ? "Showing latest completed live run."
      : "No live run stream found.";

  return (
    <main className="qa-page space-y-4">
      <PageTitle
        title="Execution Progress"
        subtitle={subtitle}
        tag={currentSnapshot.runId}
      />

      {liveError ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          {liveError}
        </section>
      ) : null}

      {runIdFromUrl ? (
        <ExecutionRunControls
          runId={runIdFromUrl}
          runStatus={currentRunStatus}
          disabled={!streamSnapshot && !completedSnapshot}
          onStatusChange={(status) => {
            setStreamSnapshot((prev) => (prev ? { ...prev, status } : prev));
          }}
        />
      ) : null}

      <ExecutionStatusCard
        runId={currentSnapshot.runId}
        currentPhase={currentSnapshot.currentPhase}
        runStatus={currentRunStatus}
        passCount={currentSnapshot.passCount}
        failCount={currentSnapshot.failCount}
        skippedCount={currentSnapshot.skippedCount}
      />

      <TestProgressTracker
        totalGeneratedTestCases={currentSnapshot.totalGeneratedTestCases}
        currentExecutingTestCaseNumber={currentSnapshot.currentExecutingTestCaseNumber}
        currentTestCaseTitle={currentSnapshot.currentTestCaseTitle}
        currentUrl={currentSnapshot.currentUrl}
        browser={currentSnapshot.browser}
        device={currentSnapshot.device}
        progressPercentage={currentSnapshot.progressPercentage}
        runStatus={currentRunStatus}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ExecutionPhaseStepper
          phases={executionPhases}
          currentPhase={currentSnapshot.currentPhase}
          isComplete={
            currentRunStatus === "completed" ||
            currentRunStatus === "failed" ||
            currentRunStatus === "cancelled"
          }
        />
        <LiveLogPanel logs={logFeed} />
      </div>

      <TestCaseStatusList testCases={currentSnapshot.testCases} />
    </main>
  );
}
