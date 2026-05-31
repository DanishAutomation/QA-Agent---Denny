import type { BddScenario } from "@/types";
import type { SiteCapabilityContext } from "./scenarioCapabilityGate";

const CHECKOUT_STEP_ORDER = ["address", "shipping", "billing", "payment", "review"] as const;

function catalogStepRank(scenario: BddScenario): number {
  const text = scenario.scenario.toLowerCase();
  if (/product listing|plp/.test(text)) return 0;
  if (/search/.test(text)) return 1;
  if (/categor/.test(text)) return 2;
  if (/filter/.test(text)) return 3;
  if (/sort/.test(text)) return 4;
  if (/pagination/.test(text)) return 5;
  return 6;
}

function authStepRank(scenario: BddScenario): number {
  const text = scenario.scenario.toLowerCase();
  if (/login/.test(text)) return 1;
  if (/signup|register/.test(text)) return 2;
  if (/forgot password/.test(text)) return 3;
  if (/guest checkout/.test(text)) return 9;
  return 5;
}

function customCommandRank(scenario: BddScenario): number {
  const text = `${scenario.scenario} ${scenario.when.join(" ")}`.toLowerCase();
  if (/login|signin|sign in/.test(text)) return 1;
  if (/search|searchbar|keyword/.test(text)) return 20;
  if (/add to cart|cart/.test(text)) return 35;
  if (/checkout|payment|shipping|billing/.test(text)) return 45;
  return 10;
}

function checkoutStepRank(scenario: BddScenario): number {
  const text = scenario.scenario.toLowerCase();
  const index = CHECKOUT_STEP_ORDER.findIndex((step) => text.includes(step));
  return index >= 0 ? index + 1 : CHECKOUT_STEP_ORDER.length + 1;
}

function featureFlowRank(scenario: BddScenario): number {
  const feature = scenario.feature.trim();

  if (feature === "Custom Command") return 0;
  if (feature === "Authentication") return 10;
  if (feature === "Homepage") return 15;
  if (feature === "Catalog") return 20;
  if (feature === "PDP") return 30;
  if (feature === "Cart") return 40;
  if (feature === "Checkout") return 50;
  if (feature === "Account") return 60;

  return 100;
}

function subFlowRank(scenario: BddScenario): number {
  const feature = scenario.feature.trim();
  if (feature === "Custom Command") return customCommandRank(scenario);
  if (feature === "Authentication") return authStepRank(scenario);
  if (feature === "Catalog") return catalogStepRank(scenario);
  if (feature === "Checkout") return checkoutStepRank(scenario);
  return 0;
}

export function isEcommerceRegressionContext(context: SiteCapabilityContext): boolean {
  return context.allowsEcommerceScenarios && context.siteSuite !== "static";
}

export function sortScenariosForEcommerceHumanQaFlow(
  scenarios: BddScenario[]
): BddScenario[] {
  return [...scenarios].sort((a, b) => {
    const byFeature = featureFlowRank(a) - featureFlowRank(b);
    if (byFeature !== 0) {
      return byFeature;
    }
    const bySubFlow = subFlowRank(a) - subFlowRank(b);
    if (bySubFlow !== 0) {
      return bySubFlow;
    }
    return a.scenario.localeCompare(b.scenario);
  });
}

export function resolveEcommerceFullRegressionMaxCount(
  executableCount: number,
  context: SiteCapabilityContext
): number {
  if (!isEcommerceRegressionContext(context)) {
    return 12;
  }
  return Math.min(Math.max(executableCount, 12), 30);
}

export function sortScenariosForExecution(
  scenarios: BddScenario[],
  selectedTestType: string,
  context: SiteCapabilityContext
): BddScenario[] {
  const normalized = selectedTestType.toLowerCase();

  if (normalized.includes("full regression") && isEcommerceRegressionContext(context)) {
    return sortScenariosForEcommerceHumanQaFlow(scenarios);
  }

  const priorityOrder: Record<BddScenario["priority"], number> = {
    High: 0,
    Medium: 1,
    Low: 2,
  };
  const riskOrder: Record<BddScenario["riskLevel"], number> = {
    Critical: 0,
    High: 1,
    Medium: 2,
    Low: 3,
  };

  return [...scenarios].sort((a, b) => {
    const byPriority = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (byPriority !== 0) return byPriority;
    return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
  });
}
