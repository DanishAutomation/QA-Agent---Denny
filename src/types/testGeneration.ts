import type { DiscoveryCapabilities, DiscoveryResult } from "./discovery";
import type { ParsedInstructionData } from "./testData";

export type ScenarioPriority = "High" | "Medium" | "Low";
export type ScenarioRiskLevel = "Critical" | "High" | "Medium" | "Low";
export type ScenarioExecutionStatus = "executable" | "skipped";

export interface BddScenario {
  feature: string;
  scenario: string;
  priority: ScenarioPriority;
  riskLevel: ScenarioRiskLevel;
  given: string[];
  when: string[];
  then: string[];
  requiredTestData: string[];
  skipConditions: string[];
  expectedResult: string;
  executionStatus: ScenarioExecutionStatus;
  skipReason?: string;
}

export interface DynamicGenerationInput {
  discoveryResult: DiscoveryResult;
  selectedTestType: string;
  parsedInstructions: ParsedInstructionData;
  capabilityMap?: Partial<DiscoveryCapabilities> & Record<string, boolean | undefined>;
}

export interface DynamicGenerationOutput {
  generatedAt: string;
  selectedTestType: string;
  websiteType: DiscoveryResult["websiteType"];
  totalScenarios: number;
  executableScenarios: number;
  skippedScenarios: number;
  scenarios: BddScenario[];
}
