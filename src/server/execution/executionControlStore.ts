export type RunControlState = "running" | "paused" | "stopped";

interface RunControlEntry {
  state: RunControlState;
  waiters: Array<(result: "continue" | "stopped") => void>;
}

const controls = new Map<string, RunControlEntry>();

function getOrCreateEntry(runId: string): RunControlEntry {
  const existing = controls.get(runId);
  if (existing) {
    return existing;
  }
  const created: RunControlEntry = { state: "running", waiters: [] };
  controls.set(runId, created);
  return created;
}

export function initRunControl(runId: string): void {
  controls.set(runId, { state: "running", waiters: [] });
}

export function getRunControlState(runId: string): RunControlState {
  return controls.get(runId)?.state ?? "running";
}

export function pauseRun(runId: string): RunControlState {
  const entry = getOrCreateEntry(runId);
  entry.state = "paused";
  return entry.state;
}

export function resumeRun(runId: string): RunControlState {
  const entry = getOrCreateEntry(runId);
  entry.state = "running";
  for (const resolve of entry.waiters) {
    resolve("continue");
  }
  entry.waiters = [];
  return entry.state;
}

export function stopRun(runId: string): RunControlState {
  const entry = getOrCreateEntry(runId);
  entry.state = "stopped";
  for (const resolve of entry.waiters) {
    resolve("stopped");
  }
  entry.waiters = [];
  return entry.state;
}

export function waitForRunControl(runId: string): Promise<"continue" | "stopped"> {
  const entry = controls.get(runId);
  if (!entry || entry.state === "running") {
    return Promise.resolve("continue");
  }
  if (entry.state === "stopped") {
    return Promise.resolve("stopped");
  }
  return new Promise((resolve) => {
    entry.waiters.push(resolve);
  });
}

export async function waitWhilePausedOrStopped(runId: string): Promise<void> {
  while (true) {
    const result = await waitForRunControl(runId);
    if (result === "stopped") {
      throw new Error("Execution stopped by user.");
    }
    return;
  }
}

export function clearRunControl(runId: string): void {
  controls.delete(runId);
}
