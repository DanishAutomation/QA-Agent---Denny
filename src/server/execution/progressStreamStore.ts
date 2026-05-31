import type { ExecutionRunResult, ParsedInstructionData } from "@/types";
import type { ExecutionPhase, TestCaseItem, TestCaseStatus } from "@/lib/mockExecutionState";
import fs from "node:fs";
import path from "node:path";

export interface LaunchExecutionRequest {
  websiteUrl: string;
  selectedTestType: string;
  browser: "Chrome" | "Firefox" | "Edge";
  mode: "headed" | "headless";
  screenshotMode: "failures-only" | "pass-fail" | "every-major-step";
  devices: string[];
  parsedInstructions: ParsedInstructionData;
}

export interface ExecutionProgressSnapshot {
  runId: string;
  status: "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
  orchestrationState:
    | "IDLE"
    | "DISCOVERY"
    | "TEST_GENERATION"
    | "SCENARIO_QUEUE_READY"
    | "EXECUTION"
    | "RESULT_COLLECTION"
    | "BUG_ANALYSIS"
    | "REPORTING"
    | "COMPLETE"
    | "FAILED";
  currentPhase: ExecutionPhase;
  totalGeneratedTestCases: number;
  currentExecutingTestCaseNumber: number;
  currentTestCaseTitle: string;
  currentUrl: string;
  browser: "Chrome" | "Firefox" | "Edge";
  device: string;
  progressPercentage: number;
  passCount: number;
  failCount: number;
  skippedCount: number;
  liveLogs: string[];
  testCases: TestCaseItem[];
  updatedAt: string;
  error?: string;
  result?: ExecutionRunResult;
}

interface StoreEntry {
  snapshot: ExecutionProgressSnapshot;
  listeners: Set<(snapshot: ExecutionProgressSnapshot) => void>;
}

const progressStore = new Map<string, StoreEntry>();
const stateRank: Record<ExecutionProgressSnapshot["orchestrationState"], number> = {
  IDLE: 0,
  DISCOVERY: 1,
  TEST_GENERATION: 2,
  SCENARIO_QUEUE_READY: 3,
  EXECUTION: 4,
  RESULT_COLLECTION: 5,
  BUG_ANALYSIS: 6,
  REPORTING: 7,
  COMPLETE: 8,
  FAILED: 9,
};
const phaseRank: Record<ExecutionPhase, number> = {
  Discovery: 1,
  Crawling: 2,
  "Test Generation": 3,
  Execution: 4,
  "Self-Healing": 5,
  "Post-Run Analysis": 6,
  Reporting: 7,
};

function stateFromPhase(phase: ExecutionPhase): ExecutionProgressSnapshot["orchestrationState"] {
  if (phase === "Discovery" || phase === "Crawling") {
    return "DISCOVERY";
  }
  if (phase === "Test Generation") {
    return "TEST_GENERATION";
  }
  if (phase === "Execution" || phase === "Self-Healing") {
    return "EXECUTION";
  }
  if (phase === "Post-Run Analysis") {
    return "BUG_ANALYSIS";
  }
  return "REPORTING";
}

function hasMeaningfulProgressPatch(
  patch: Partial<Omit<ExecutionProgressSnapshot, "runId" | "liveLogs" | "testCases" | "updatedAt">> & {
    log?: string;
    testCaseUpdate?: { id: string; title: string; status: TestCaseStatus };
  }
): boolean {
  return Boolean(
    patch.log ||
      patch.testCaseUpdate ||
      patch.currentTestCaseTitle ||
      patch.currentUrl ||
      patch.passCount !== undefined ||
      patch.failCount !== undefined ||
      patch.skippedCount !== undefined ||
      patch.totalGeneratedTestCases !== undefined ||
      patch.currentExecutingTestCaseNumber !== undefined ||
      (patch.progressPercentage !== undefined && patch.progressPercentage > 0)
  );
}

function hasNonTerminalTestCases(snapshot: ExecutionProgressSnapshot): boolean {
  return snapshot.testCases.some((testCase) => testCase.status === "pending" || testCase.status === "running");
}

function emit(runId: string) {
  const entry = progressStore.get(runId);
  if (!entry) {
    return;
  }
  for (const listener of entry.listeners) {
    listener(entry.snapshot);
  }
}

function getSnapshotFilePath(runId: string): string {
  return path.join(
    process.cwd(),
    "src",
    "reports",
    "executions",
    runId,
    "progress-snapshot.json"
  );
}

function persistSnapshot(snapshot: ExecutionProgressSnapshot): void {
  const filePath = getSnapshotFilePath(snapshot.runId);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf-8");
}

function readSnapshotFromDisk(runId: string): ExecutionProgressSnapshot | null {
  const filePath = getSnapshotFilePath(runId);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as ExecutionProgressSnapshot;
  } catch {
    return null;
  }
}

function syncEntryFromDisk(runId: string): StoreEntry | null {
  const diskSnapshot = readSnapshotFromDisk(runId);
  const existing = progressStore.get(runId);

  if (!diskSnapshot && !existing) {
    return null;
  }

  if (diskSnapshot && existing) {
    if (diskSnapshot.updatedAt > existing.snapshot.updatedAt) {
      existing.snapshot = diskSnapshot;
    }
    return existing;
  }

  if (diskSnapshot) {
    const hydrated: StoreEntry = {
      snapshot: diskSnapshot,
      listeners: new Set(),
    };
    progressStore.set(runId, hydrated);
    return hydrated;
  }

  return existing ?? null;
}

function getOrHydrateEntry(runId: string): StoreEntry | null {
  return syncEntryFromDisk(runId);
}

function pushLog(snapshot: ExecutionProgressSnapshot, message: string) {
  const timestamp = new Date().toLocaleTimeString();
  snapshot.liveLogs = [...snapshot.liveLogs.slice(-120), `[${timestamp}] ${message}`];
}

export function initializeExecutionProgress(params: {
  runId: string;
  browser: "Chrome" | "Firefox" | "Edge";
  devices: string[];
  url: string;
}): ExecutionProgressSnapshot {
  const snapshot: ExecutionProgressSnapshot = {
    runId: params.runId,
    status: "queued",
    orchestrationState: "IDLE",
    currentPhase: "Discovery",
    totalGeneratedTestCases: 0,
    currentExecutingTestCaseNumber: 0,
    currentTestCaseTitle: "Preparing execution pipeline",
    currentUrl: params.url,
    browser: params.browser,
    device: params.devices[0] ?? "Desktop",
    progressPercentage: 3,
    passCount: 0,
    failCount: 0,
    skippedCount: 0,
    liveLogs: [],
    testCases: [],
    updatedAt: new Date().toISOString(),
  };
  pushLog(snapshot, `Run queued (${params.runId})`);
  progressStore.set(params.runId, { snapshot, listeners: new Set() });
  persistSnapshot(snapshot);
  emit(params.runId);
  return snapshot;
}

export function updateExecutionProgress(
  runId: string,
  patch: Partial<Omit<ExecutionProgressSnapshot, "runId" | "liveLogs" | "testCases" | "updatedAt">> & {
    log?: string;
    appendLogs?: string[];
    testCases?: TestCaseItem[];
    testCaseUpdate?: {
      id: string;
      title: string;
      status: TestCaseStatus;
    };
  }
): ExecutionProgressSnapshot | null {
  const entry = getOrHydrateEntry(runId);
  if (!entry) {
    return null;
  }

  const definedPatch = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  ) as typeof patch;
  const next = { ...entry.snapshot, ...definedPatch };
  const meaningfulPatch = hasMeaningfulProgressPatch(patch);
  const candidateState =
    patch.orchestrationState ??
    (patch.currentPhase ? stateFromPhase(patch.currentPhase) : entry.snapshot.orchestrationState);

  if (
    stateRank[candidateState] < stateRank[entry.snapshot.orchestrationState] &&
    !meaningfulPatch
  ) {
    return entry.snapshot;
  }
  next.orchestrationState = candidateState;

  if (patch.currentPhase) {
    const currentRank = phaseRank[entry.snapshot.currentPhase];
    const nextRank = phaseRank[patch.currentPhase];
    if (nextRank < currentRank && !meaningfulPatch) {
      return entry.snapshot;
    }
    next.currentPhase = patch.currentPhase;
  }
  if (patch.status === "running" && entry.snapshot.status === "completed") {
    return entry.snapshot;
  }
  if (patch.status === "completed") {
    next.orchestrationState = "COMPLETE";
  }
  if (patch.status === "cancelled") {
    next.orchestrationState = "COMPLETE";
  } else if (patch.status === "failed") {
    next.orchestrationState = "FAILED";
  }
  if (next.orchestrationState === "REPORTING" && next.status !== "failed" && hasNonTerminalTestCases(next)) {
    return entry.snapshot;
  }
  next.updatedAt = new Date().toISOString();
  if (patch.log) {
    pushLog(next, patch.log);
  }
  if (patch.appendLogs) {
    for (const line of patch.appendLogs) {
      pushLog(next, line);
    }
  }
  if (patch.testCaseUpdate) {
    const existing = next.testCases.find((item) => item.id === patch.testCaseUpdate?.id);
    if (existing) {
      existing.status = patch.testCaseUpdate.status;
      existing.title = patch.testCaseUpdate.title;
    } else {
      next.testCases.push({
        id: patch.testCaseUpdate.id,
        title: patch.testCaseUpdate.title,
        status: patch.testCaseUpdate.status,
      });
    }
  }
  if (patch.testCases) {
    next.testCases = patch.testCases;
  }
  entry.snapshot = next;
  persistSnapshot(next);
  emit(runId);
  return next;
}

export function completeExecutionProgress(
  runId: string,
  result: ExecutionRunResult
): ExecutionProgressSnapshot | null {
  const finalTestCases: TestCaseItem[] = result.scenarios.map((scenario, index) => ({
    id: scenario.scenarioId || `scenario-${index + 1}`,
    title: scenario.scenario,
    status: scenario.status,
  }));
  const postRunAdjusted = result.scenarios.filter((scenario) => scenario.errorReason).length;

  return updateExecutionProgress(runId, {
    status: "completed",
    orchestrationState: "COMPLETE",
    currentPhase: "Reporting",
    progressPercentage: 100,
    passCount: result.passed,
    failCount: result.failed,
    skippedCount: result.skipped,
    totalGeneratedTestCases: result.scenarios.length,
    currentExecutingTestCaseNumber: result.scenarios.length,
    currentTestCaseTitle:
      result.failed > 0
        ? `Completed with ${result.failed} failure(s) after post-run analysis`
        : "Execution completed",
    currentUrl: result.scenarios.at(-1)?.pageUrl ?? result.reportPath,
    testCases: finalTestCases,
    result,
    log:
      result.failed > 0
        ? `Run completed: ${result.passed} passed, ${result.failed} failed (${postRunAdjusted} adjusted by post-run checks).`
        : "Run completed and reports generated.",
  });
}

export function cancelExecutionProgress(
  runId: string,
  reason = "Execution stopped by user."
): ExecutionProgressSnapshot | null {
  return updateExecutionProgress(runId, {
    status: "cancelled",
    currentPhase: "Reporting",
    progressPercentage: 100,
    error: reason,
    log: reason,
  });
}

export function pauseExecutionProgress(runId: string): ExecutionProgressSnapshot | null {
  const entry = getOrHydrateEntry(runId);
  if (!entry || entry.snapshot.status !== "running") {
    return entry?.snapshot ?? null;
  }
  const next = {
    ...entry.snapshot,
    status: "paused" as const,
    updatedAt: new Date().toISOString(),
  };
  pushLog(next, "Execution paused by user.");
  entry.snapshot = next;
  persistSnapshot(next);
  emit(runId);
  return next;
}

export function resumeExecutionProgress(runId: string): ExecutionProgressSnapshot | null {
  const entry = getOrHydrateEntry(runId);
  if (!entry || entry.snapshot.status !== "paused") {
    return entry?.snapshot ?? null;
  }
  return updateExecutionProgress(runId, {
    status: "running",
    log: "Execution resumed by user.",
  });
}

export function failExecutionProgress(
  runId: string,
  error: string
): ExecutionProgressSnapshot | null {
  return updateExecutionProgress(runId, {
    status: "failed",
    currentPhase: "Reporting",
    progressPercentage: 100,
    error,
    log: `Run failed: ${error}`,
  });
}

export function getExecutionProgressSnapshot(runId: string): ExecutionProgressSnapshot | null {
  return getOrHydrateEntry(runId)?.snapshot ?? null;
}

export function subscribeExecutionProgress(
  runId: string,
  listener: (snapshot: ExecutionProgressSnapshot) => void
): (() => void) | null {
  const entry = getOrHydrateEntry(runId);
  if (!entry) {
    return null;
  }
  entry.listeners.add(listener);
  listener(entry.snapshot);
  return () => {
    const current = progressStore.get(runId);
    current?.listeners.delete(listener);
  };
}
