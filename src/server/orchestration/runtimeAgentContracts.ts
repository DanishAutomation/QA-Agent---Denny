import type {
  DiscoveryResult,
  ParsedInstructionData,
  BddScenario,
  ExecutableScenarioInput,
  DiscoveryCapabilities,
} from "@/types";

export interface PlannerAgentInput {
  websiteUrl: string;
  selectedTestType: string;
  parsedInstructions: ParsedInstructionData;
  siteSuite?: "static" | "ecommerce" | "mixed";
}

export interface PlannerAgentOutput {
  strategySummary: string;
  businessCriticalFlows: string[];
  prioritizedFlows: string[];
  skippedFlows: string[];
}

export interface DiscoveryAgentInput {
  websiteUrl: string;
  selectedTestType: string;
  onProgress?: (update: import("@/types/discovery").DiscoveryProgressUpdate) => void;
}

export interface DiscoveryAgentOutput {
  discovery: DiscoveryResult;
}

export interface TestDesignAgentInput {
  discovery: DiscoveryResult;
  selectedTestType: string;
  parsedInstructions: ParsedInstructionData;
  capabilityMap?: Partial<DiscoveryCapabilities>;
}

export interface TestDesignAgentOutput {
  scenarios: BddScenario[];
  executableCount: number;
  skippedCount: number;
}

export interface AutomationAgentInput {
  scenarios: BddScenario[];
  selectedTestType: string;
  discovery?: DiscoveryResult;
  capabilityMap?: Partial<DiscoveryCapabilities>;
}

export interface AutomationAgentOutput {
  executableQueue: ExecutableScenarioInput[];
}
