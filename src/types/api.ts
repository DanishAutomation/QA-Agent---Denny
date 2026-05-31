import type { QaRunRecord, QaRunStatus } from "./orchestration";

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export interface ApiErrorResponse {
  ok: false;
  error: ApiErrorPayload;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface RunCreatedResponse {
  runId: string;
  status: QaRunStatus;
  createdAt: string;
}

export interface RunDetailsResponse {
  run: QaRunRecord;
}

export interface RunListResponse {
  runs: QaRunRecord[];
}
