import type {
  AutomationAgentInput,
  AutomationAgentOutput,
  DiscoveryAgentInput,
  DiscoveryAgentOutput,
  PlannerAgentInput,
  PlannerAgentOutput,
  TestDesignAgentInput,
  TestDesignAgentOutput,
} from "./runtimeAgentContracts";
import { createMinimalDiscoveryResult, runDiscovery } from "@/server/discovery/discoveryEngine";
import { generateDynamicTestScenarios } from "@/server/test-generation/dynamicTestGenerationEngine";
import {
  buildCapabilityContext,
  filterScenarioQueue,
  applyScenarioCapabilityGate,
} from "@/server/execution/scenarioCapabilityGate";
import { resolveEcommerceFullRegressionMaxCount } from "@/server/execution/ecommerceScenarioOrdering";

function buildPlannerFlowHints(
  selectedTestType: string,
  siteSuite?: "static" | "ecommerce" | "mixed"
): {
  critical: string[];
  medium: string[];
  low: string[];
} {
  const normalized = selectedTestType.toLowerCase();
  const isStaticSite = siteSuite === "static" || !siteSuite;

  if (normalized.includes("smoke")) {
    if (isStaticSite) {
      return {
        critical: ["homepage", "navigation", "contact form", "key CTA"],
        medium: ["newsletter", "broken links"],
        low: ["blog", "footer links"],
      };
    }
    return {
      critical: ["login", "search", "add to cart", "checkout"],
      medium: ["navigation", "forms"],
      low: ["blog", "footer links"],
    };
  }
  if (normalized.includes("full regression")) {
    if (isStaticSite) {
      return {
        critical: ["navigation", "static pages", "contact form", "broken links"],
        medium: ["newsletter", "responsive", "accessibility"],
        low: ["blog", "secondary links"],
      };
    }
    return {
      critical: ["login", "search", "pdp", "add to cart", "cart", "checkout"],
      medium: ["account", "wishlist", "filters", "sorting"],
      low: ["blog", "informational pages"],
    };
  }
  return {
    critical: ["navigation", "core CTA", "lead conversion flow"],
    medium: ["forms", "content pages"],
    low: ["blog", "secondary links"],
  };
}

export function runPlannerAgent(input: PlannerAgentInput): PlannerAgentOutput {
  const flows = buildPlannerFlowHints(input.selectedTestType, input.siteSuite);
  return {
    strategySummary:
      "Risk-based plan prepared from selected test type and custom instruction intent.",
    businessCriticalFlows: flows.critical,
    prioritizedFlows: [...flows.critical, ...flows.medium],
    skippedFlows: flows.low,
  };
}

export async function runDiscoveryAgent(
  input: DiscoveryAgentInput
): Promise<DiscoveryAgentOutput> {
  const normalizedType = input.selectedTestType.toLowerCase();
  if (normalizedType.includes("custom command")) {
    return { discovery: createMinimalDiscoveryResult(input.websiteUrl) };
  }

  const discovery = await runDiscovery(input.websiteUrl, {
    maxDepth: normalizedType.includes("full regression") ? 2 : 1,
    maxPages: normalizedType.includes("full regression") ? 20 : 10,
    maxLinksPerPage: 40,
    onProgress: input.onProgress,
  });
  return { discovery };
}

export function runTestDesignAgent(input: TestDesignAgentInput): TestDesignAgentOutput {
  const generated = generateDynamicTestScenarios({
    discoveryResult: input.discovery,
    selectedTestType: input.selectedTestType,
    parsedInstructions: input.parsedInstructions,
    capabilityMap: input.capabilityMap,
  });
  return {
    scenarios: generated.scenarios,
    executableCount: generated.executableScenarios,
    skippedCount: generated.skippedScenarios,
  };
}

export function runAutomationAgent(input: AutomationAgentInput): AutomationAgentOutput {
  const normalized = input.selectedTestType.toLowerCase();
  const maxCount = normalized.includes("custom command")
    ? 30
    : input.selectedTestType === "Full Regression"
      ? 12
      : 8;

  if (input.discovery) {
    const context = buildCapabilityContext(input.discovery, input.capabilityMap);
    const memoryCaps = input.capabilityMap;
    const executableBeforeLimit = applyScenarioCapabilityGate(
      input.scenarios,
      context,
      memoryCaps
    ).filter((scenario) => scenario.executionStatus === "executable").length;
    const maxCount = normalized.includes("custom command")
      ? 30
      : input.selectedTestType === "Full Regression"
        ? resolveEcommerceFullRegressionMaxCount(executableBeforeLimit, context)
        : 8;
    const executableQueue = filterScenarioQueue({
      scenarios: input.scenarios,
      context,
      maxCount,
      selectedTestType: input.selectedTestType,
      memoryCaps,
    }).map((definition, idx) => ({
      id: `scenario-${idx + 1}`,
      definition,
    }));
    return { executableQueue };
  }

  const executableQueue = input.scenarios
    .filter((scenario) => scenario.executionStatus === "executable")
    .slice(0, maxCount)
    .map((definition, idx) => ({
      id: `scenario-${idx + 1}`,
      definition,
    }));

  return { executableQueue };
}
