export type QaRunStatus = "queued" | "running" | "completed" | "failed";

export type QaRunIntent = "smoke" | "regression" | "exploratory";

export interface QaRunRequestPayload {
  projectId: string;
  objective: string;
  targetBaseUrl?: string;
  intent: QaRunIntent;
  featureKeys: string[];
  metadata?: Record<string, unknown>;
}

export interface QaPipelineStepResult {
  step: number;
  agentId: string;
  agentName: string;
  status: "completed" | "failed";
  summary: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export interface QaRunRecord {
  runId: string;
  status: QaRunStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  request: QaRunRequestPayload;
  steps: QaPipelineStepResult[];
}
