import type { HumanFriendlyBugReport } from "./bugIntelligence";

export interface JiraIntegrationSettings {
  baseUrl: string;
  projectKey: string;
  issueType: string;
  defaultAssignee?: string;
  /** Atlassian account email used with the API token for Basic auth. */
  apiEmail?: string;
  apiToken?: string;
}

export interface JiraCreateIssueRequest {
  bugReport: HumanFriendlyBugReport;
  settings: JiraIntegrationSettings;
}

export interface JiraCreateIssueResponse {
  ok: boolean;
  issueKey?: string;
  issueUrl?: string;
  fallbackCreateUrl?: string;
  message: string;
  copiedPayloadText?: string;
}
