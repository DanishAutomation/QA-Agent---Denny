import type { QaRunIntent, QaRunRequestPayload } from "@/types";

const ALLOWED_INTENTS: QaRunIntent[] = ["smoke", "regression", "exploratory"];

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  message?: string;
}

export function validateCreateRunRequest(body: unknown): ValidationResult<QaRunRequestPayload> {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Request body must be an object." };
  }

  const candidate = body as Record<string, unknown>;
  const projectId = candidate.projectId;
  const objective = candidate.objective;
  const intent = candidate.intent;
  const featureKeys = candidate.featureKeys;
  const targetBaseUrl = candidate.targetBaseUrl;
  const metadata = candidate.metadata;

  if (typeof projectId !== "string" || projectId.trim().length === 0) {
    return { ok: false, message: "projectId is required." };
  }

  if (typeof objective !== "string" || objective.trim().length < 10) {
    return { ok: false, message: "objective must be at least 10 characters." };
  }

  if (typeof intent !== "string" || !ALLOWED_INTENTS.includes(intent as QaRunIntent)) {
    return { ok: false, message: "intent must be smoke, regression, or exploratory." };
  }

  if (!Array.isArray(featureKeys) || featureKeys.some((key) => typeof key !== "string")) {
    return { ok: false, message: "featureKeys must be an array of strings." };
  }

  if (targetBaseUrl !== undefined && typeof targetBaseUrl !== "string") {
    return { ok: false, message: "targetBaseUrl must be a string when provided." };
  }

  if (metadata !== undefined && (typeof metadata !== "object" || metadata === null)) {
    return { ok: false, message: "metadata must be an object when provided." };
  }

  return {
    ok: true,
    value: {
      projectId: projectId.trim(),
      objective: objective.trim(),
      intent: intent as QaRunIntent,
      featureKeys: featureKeys as string[],
      targetBaseUrl: targetBaseUrl as string | undefined,
      metadata: metadata as Record<string, unknown> | undefined,
    },
  };
}
