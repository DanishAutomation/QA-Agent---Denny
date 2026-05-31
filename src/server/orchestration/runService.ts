import { executeQaRunPipeline } from "./runPipeline";
import { runStore } from "../store/runStore";
import type { QaRunRecord, QaRunRequestPayload } from "@/types";

function createRunId(): string {
  return `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function createQaRun(request: QaRunRequestPayload): Promise<QaRunRecord> {
  const runId = createRunId();
  const initialRecord: QaRunRecord = {
    runId,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    request,
    steps: [],
  };

  runStore.save(initialRecord);

  const result = await executeQaRunPipeline(request, runId);
  runStore.save(result);

  return result;
}

export function getQaRun(runId: string): QaRunRecord | undefined {
  return runStore.get(runId);
}

export function listQaRuns(): QaRunRecord[] {
  return runStore.list();
}
