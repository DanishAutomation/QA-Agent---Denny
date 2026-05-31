import type { HumanFriendlyBugReport, JiraIntegrationSettings } from "@/types";

export const JIRA_SETTINGS_STORAGE_KEY = "dennyqa-jira-settings";
export const JIRA_RETRY_QUEUE_STORAGE_KEY = "dennyqa-jira-retry-queue";

export function normalizeJiraBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed;
}

export function normalizeProjectKey(projectKey: string): { key: string; error?: string } {
  const trimmed = projectKey.trim();
  if (!trimmed) {
    return { key: "", error: "Project key is required." };
  }
  if (/\s/.test(trimmed)) {
    return {
      key: trimmed,
      error: `"${trimmed}" looks like a project name. Enter the project key (for example QA), not the display name.`,
    };
  }
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(trimmed)) {
    return {
      key: trimmed,
      error: "Project key must start with a letter and contain only letters, numbers, hyphens, or underscores.",
    };
  }
  return { key: trimmed.toUpperCase() };
}

export function buildJiraBasicAuthHeader(apiEmail: string, apiToken: string): string {
  const credentials = `${apiEmail.trim()}:${apiToken.trim()}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

export function buildJiraAdfDescription(text: string): {
  type: "doc";
  version: 1;
  content: Array<{ type: "paragraph"; content: Array<{ type: "text"; text: string }> }>;
} {
  return {
    type: "doc",
    version: 1,
    content: text.split("\n").map((line) => ({
      type: "paragraph" as const,
      content: line ? [{ type: "text" as const, text: line }] : [],
    })),
  };
}

export function hasJiraApiCredentials(settings: JiraIntegrationSettings): boolean {
  return Boolean(
    settings.baseUrl?.trim() &&
      settings.projectKey?.trim() &&
      settings.issueType?.trim() &&
      settings.apiEmail?.trim() &&
      settings.apiToken?.trim()
  );
}

export function buildBugDescription(bug: HumanFriendlyBugReport): string {
  const lines = [
    "h2. Summary",
    bug.summary,
    "",
    "h2. Description",
    bug.description,
    "",
    "h2. Steps To Reproduce",
    ...bug.stepsToReproduce.map((step, index) => `${index + 1}. ${step}`),
    "",
    "h2. Expected Result",
    bug.expectedResult,
    "",
    "h2. Actual Result",
    bug.actualResult,
    "",
    "h2. Screenshot",
    bug.screenshot ?? "No screenshot attached in this run.",
    "",
    "h2. Suggested Fix",
    bug.suggestedFix,
    "",
    "h2. Severity / Priority / Confidence",
    `Severity: ${bug.severity}`,
    `Priority: ${bug.priority}`,
    `Confidence Score: ${bug.confidenceScore}`,
    "",
    "h2. Business Impact",
    bug.businessImpact,
    "",
    "h2. User Impact",
    bug.userImpact,
    "",
    "h2. Revenue Impact",
    bug.revenueImpact,
    "",
    "h2. Recovery Attempts",
    ...bug.recoveryAttempts.map((attempt) => `- ${attempt}`),
    "",
    "h2. Root Cause Analysis",
    bug.rootCauseAnalysis,
  ];
  return lines.join("\n");
}

export function buildJiraCreateIssueUrl(
  settings: JiraIntegrationSettings,
  summary: string,
  description: string
): string {
  const base = normalizeJiraBaseUrl(settings.baseUrl);
  const params = new URLSearchParams({
    summary,
    description,
  });
  return `${base}/secure/CreateIssueDetails!init.jspa?${params.toString()}`;
}

export function buildJiraProjectCreateUrl(settings: JiraIntegrationSettings): string {
  const base = normalizeJiraBaseUrl(settings.baseUrl);
  const projectKey = normalizeProjectKey(settings.projectKey).key;
  if (!projectKey) {
    return `${base}/jira/for-you`;
  }
  return `${base}/jira/software/projects/${encodeURIComponent(projectKey)}/issues`;
}
