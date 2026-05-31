export type ExecutionMode = "Headed" | "Headless";

export type ExecutionRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface ExecutionHistoryRun {
  executionId: string;
  websiteUrl: string;
  testType: string;
  browser: string;
  mode: ExecutionMode;
  devices: string[];
  startTime: string;
  endTime: string | null;
  durationSeconds: number;
  totalCases: number;
  passed: number;
  failed: number;
  skipped: number;
  bugsFound: number;
  reportPath: string;
  status: ExecutionRunStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExecutionHistoryInput {
  websiteUrl: string;
  testType: string;
  browser: string;
  mode: ExecutionMode;
  devices: string[];
  startTime: string;
  endTime: string | null;
  durationSeconds: number;
  totalCases: number;
  passed: number;
  failed: number;
  skipped: number;
  bugsFound: number;
  reportPath: string;
  status: ExecutionRunStatus;
}

export interface UpdateExecutionHistoryInput {
  endTime?: string | null;
  durationSeconds?: number;
  totalCases?: number;
  passed?: number;
  failed?: number;
  skipped?: number;
  bugsFound?: number;
  reportPath?: string;
  status?: ExecutionRunStatus;
}
