export type BugSeverity = "Critical" | "High" | "Medium" | "Low";
export type BugPriority = "P0" | "P1" | "P2" | "P3";

export interface BugSelfHealingMetadata {
  attempted: boolean;
  recovered: boolean;
  attempts: number;
  strategyLogs: string[];
}

export interface BugPreconditionDiscoverySummary {
  missingPreconditions: string[];
  actionsTaken: string[];
  retryResult: "not-needed" | "recovered" | "failed";
  investigationFindings?: string[];
}

export interface HumanFriendlyBugReport {
  summary: string;
  description: string;
  stepsToReproduce: string[];
  expectedResult: string;
  actualResult: string;
  screenshot: string | null;
  suggestedFix: string;
  severity: BugSeverity;
  priority: BugPriority;
  confidenceScore: number;
  businessImpact: string;
  userImpact: string;
  revenueImpact: string;
  recoveryAttempts: string[];
  rootCauseAnalysis: string;
  technicalDetails: {
    errorReason?: string;
    consoleErrors: string[];
    networkErrors: string[];
    pageUrl: string;
    timestamp: string;
    selfHealing: BugSelfHealingMetadata;
    preconditionDiscovery: BugPreconditionDiscoverySummary;
  };
}
