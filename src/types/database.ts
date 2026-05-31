export interface QaProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface QaRun {
  id: string;
  projectId: string;
  status: "queued" | "running" | "passed" | "failed";
  startedAt: string | null;
  completedAt: string | null;
}

export interface BugInsight {
  id: string;
  runId: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  details: string;
}
