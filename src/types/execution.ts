import type { BddScenario } from "./testGeneration";
import type { ParsedInstructionData } from "./testData";
import type { HumanFriendlyBugReport } from "./bugIntelligence";
import type { BrokenLinksReport, FormsTestingReport } from "./brokenForms";
import type { AccessibilityRiskReport } from "./accessibility";
import type { ResponsiveTestReport } from "./responsive";
import type { DiscoveryPage } from "./discovery";

export type SupportedBrowser = "Chrome" | "Firefox" | "Edge";
export type PlaywrightExecutionMode = "headed" | "headless";
export type ScreenshotMode = "failures-only" | "pass-fail" | "every-major-step";

export interface PlaywrightExecutionConfig {
  runId: string;
  baseUrl: string;
  browser: SupportedBrowser;
  mode: PlaywrightExecutionMode;
  devices: string[];
  screenshotMode: ScreenshotMode;
  timeoutMs?: number;
  enableAdvancedSelfHealing?: boolean;
  maxSelfHealingAttempts?: number;
  parsedInstructions?: ParsedInstructionData;
  safeTestMode?: boolean;
  selectedTestType?: string;
  siteSuite?: "static" | "ecommerce" | "mixed";
  discoveryPages?: DiscoveryPage[];
  executionMemory?: {
    domain: string;
    successfulFlowPaths: string[];
    successfulSelectors: string[];
    provenJourneySteps?: string[];
    customCommandMappings?: Array<{ command: string; success: boolean }>;
  };
}

export interface SelfHealingMetadata {
  attempted: boolean;
  recovered: boolean;
  attempts: number;
  strategyLogs: string[];
}

export interface PreconditionDiscoverySummary {
  missingPreconditions: string[];
  actionsTaken: string[];
  retryResult: "not-needed" | "recovered" | "failed";
  investigationFindings?: string[];
}

export interface ScenarioExecutionResult {
  scenarioId: string;
  feature: string;
  scenario: string;
  status: "passed" | "failed" | "skipped";
  errorReason?: string;
  screenshots: string[];
  consoleErrors: string[];
  networkErrors: string[];
  pageUrl: string;
  timestamp: string;
  durationMs: number;
  selfHealing: SelfHealingMetadata;
  preconditionDiscovery: PreconditionDiscoverySummary;
}

export interface ExecutionRunResult {
  runId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  passed: number;
  failed: number;
  skipped: number;
  reportPath: string;
  scenarios: ScenarioExecutionResult[];
  bugReports: HumanFriendlyBugReport[];
  brokenLinksReport?: BrokenLinksReport;
  formsReport?: FormsTestingReport;
  accessibilityRiskReport?: AccessibilityRiskReport;
  responsiveReport?: ResponsiveTestReport;
  responsiveReportPath?: string;
  brokenLinksReportPath?: string;
  formsReportPath?: string;
  accessibilityRiskReportPath?: string;
  productionReportPaths?: {
    html: string;
    json: string;
    markdown: string;
  };
  retryAssistant?: {
    logs: Array<{
      id: string;
      scenarioId: string;
      userInstruction: string;
      retryPlan: {
        cssSelectors: string[];
        xpaths: string[];
        playwrightLocators: string[];
        naturalLanguageCommands: string[];
      };
      retryResult: ScenarioExecutionResult;
      createdAt: string;
    }>;
    effectiveSummary: {
      passed: number;
      failed: number;
      skipped: number;
    };
  };
}

export interface ExecutableScenarioInput {
  id: string;
  definition: BddScenario;
}
