import type {
  BddScenario,
  DiscoveryCapabilities,
  DiscoveryResult,
  WebsiteType,
} from "@/types";
import type { RegressionSuite, SiteClassification } from "@/server/discovery/websiteClassification";
import {
  isEcommerceRegressionContext,
  resolveEcommerceFullRegressionMaxCount,
  sortScenariosForExecution,
} from "./ecommerceScenarioOrdering";
import { resolveExecutionCapabilities } from "./executionCapabilityResolver";

export interface SiteCapabilityContext {
  websiteType: WebsiteType;
  siteSuite: RegressionSuite;
  capabilities: DiscoveryCapabilities;
  executionCapabilities: DiscoveryCapabilities;
  ecommerceConfidence: number;
  allowsEcommerceScenarios: boolean;
  allowsStaticScenarios: boolean;
  classificationNotes: string[];
}

const ECOMMERCE_FEATURES =
  /^(catalog|pdp|cart|checkout|authentication|account|homepage)$/i;

const STATIC_FEATURES =
  /^(navigation|static pages|blog|contact form|newsletter form|quote form|forms|broken link|responsive|accessibility)$/i;

function ecommerceConfidenceFromDiscovery(discovery: DiscoveryResult): number {
  let score = 0;
  const caps = discovery.capabilities;
  if (discovery.siteSuite === "ecommerce") score += 50;
  if (discovery.siteSuite === "mixed") score += 30;
  if (discovery.detectedEcommerceSignals?.length) {
    score += Math.min(30, discovery.detectedEcommerceSignals.length * 5);
  }
  if (caps.addToCart && caps.cart) score += 10;
  if (caps.checkout) score += 10;
  if (caps.productListing || caps.productDetail) score += 5;
  return Math.min(100, score);
}

export function buildCapabilityContext(
  discovery: DiscoveryResult,
  memoryCaps?: Partial<DiscoveryCapabilities>
): SiteCapabilityContext {
  const siteSuite = discovery.siteSuite ?? inferSuiteFromDiscovery(discovery);
  const ecommerceConfidence = ecommerceConfidenceFromDiscovery(discovery);
  const allowsEcommerceScenarios =
    siteSuite === "ecommerce" ||
    (siteSuite === "mixed" && ecommerceConfidence >= 25);
  const allowsStaticScenarios =
    siteSuite === "static" ||
    siteSuite === "mixed" ||
    !allowsEcommerceScenarios;
  const executionCapabilities = resolveExecutionCapabilities(
    discovery,
    memoryCaps,
    allowsEcommerceScenarios
  );

  return {
    websiteType: discovery.websiteType,
    siteSuite,
    capabilities: discovery.capabilities,
    executionCapabilities,
    ecommerceConfidence,
    allowsEcommerceScenarios,
    allowsStaticScenarios,
    classificationNotes: discovery.classificationNotes ?? [],
  };
}

function inferSuiteFromDiscovery(discovery: DiscoveryResult): RegressionSuite {
  if (
    discovery.websiteType === "Ecommerce" ||
    discovery.websiteType === "Marketplace"
  ) {
    return "ecommerce";
  }
  const caps = discovery.capabilities;
  const hasStoreSignals =
    (caps.addToCart || caps.productDetail || caps.productListing) &&
    discovery.detectedEcommerceSignals?.length;
  if (hasStoreSignals) {
    return "mixed";
  }
  return "static";
}

export function validateMemoryAgainstDiscovery(
  memoryCapabilities: Partial<DiscoveryCapabilities> | undefined,
  context: SiteCapabilityContext
): Partial<DiscoveryCapabilities> | undefined {
  if (!memoryCapabilities) {
    return undefined;
  }
  if (context.siteSuite === "static" || !context.allowsEcommerceScenarios) {
    return undefined;
  }
  if (context.siteSuite !== "ecommerce" && context.ecommerceConfidence < 25) {
    return undefined;
  }
  const sanitized: Partial<DiscoveryCapabilities> = {};
  for (const [key, value] of Object.entries(memoryCapabilities)) {
    if (typeof value !== "boolean" || !value) {
      continue;
    }
    sanitized[key as keyof DiscoveryCapabilities] = true;
  }
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function generateSkipReason(params: {
  feature: string;
  scenario: string;
  requiredCapability?: keyof DiscoveryCapabilities | string;
  siteSuite: RegressionSuite;
}): string {
  const text = `${params.feature} ${params.scenario}`.toLowerCase();

  if (/add to cart|add item/.test(text)) {
    return "Skipped Add to Cart because no product/cart capability was detected.";
  }
  if (/checkout|payment|shipping|billing|guest checkout/.test(text)) {
    return "Skipped Checkout because no cart or checkout page was detected.";
  }
  if (/cart|coupon|quantity|remove item/.test(text)) {
    return "Skipped cart validation because no cart capability was detected.";
  }
  if (/catalog|filter|sort|pagination|search/.test(text)) {
    return "Skipped PLP validation because no product listing page was detected.";
  }
  if (/pdp|product detail|variant|inventory/.test(text)) {
    return "Skipped PDP validation because no product detail capability was detected.";
  }
  if (/address step|shipping address|billing address/.test(text)) {
    return "Skipped checkout address validation because checkout capability was not detected.";
  }
  if (/address book|account address/.test(text)) {
    return "Skipped Account Address because login/account area was not detected.";
  }
  if (/login|signup|authentication|forgot password/.test(text)) {
    return "Skipped authentication flow because login capability was not detected.";
  }
  if (/wishlist|order history|profile/.test(text)) {
    return "Skipped account scenario because account capability was not detected.";
  }
  if (params.siteSuite === "static") {
    return `Skipped ${params.feature} because ecommerce capability was not detected during discovery.`;
  }
  if (params.requiredCapability) {
    return `Skipped ${params.feature} because ${String(params.requiredCapability)} was not detected during discovery.`;
  }
  return `Skipped ${params.feature} because required capability was not detected during discovery.`;
}

function requiredCapabilitiesForScenario(
  scenario: BddScenario
): Array<keyof DiscoveryCapabilities> {
  const feature = scenario.feature.toLowerCase();
  const text = `${scenario.feature} ${scenario.scenario}`.toLowerCase();

  if (feature === "catalog") {
    if (/search/.test(text)) return ["search"];
    if (/categor/.test(text)) return ["categories"];
    if (/filter/.test(text)) return ["productListing"];
    if (/pagination/.test(text)) return ["productListing"];
    if (/sort/.test(text)) return ["productListing"];
    return ["productListing"];
  }
  if (feature === "pdp") {
    if (/add to cart/.test(text)) return ["addToCart", "productDetail"];
    return ["productDetail"];
  }
  if (feature === "cart") return ["cart", "addToCart"];
  if (feature === "checkout") return ["checkout", "cart"];
  if (feature === "authentication") {
    if (/signup/.test(text)) return ["signup"];
    if (/guest checkout/.test(text)) return ["checkout"];
    return ["login"];
  }
  if (feature === "account") return ["login"];
  return [];
}

function isEcommerceScenario(scenario: BddScenario): boolean {
  return ECOMMERCE_FEATURES.test(scenario.feature.trim());
}

function isStaticScenario(scenario: BddScenario): boolean {
  return (
    STATIC_FEATURES.test(scenario.feature.trim()) ||
    scenario.feature === "Custom Command"
  );
}

function scenarioHasRequiredCapabilities(
  scenario: BddScenario,
  capabilities: DiscoveryCapabilities,
  overrides?: Partial<DiscoveryCapabilities>
): boolean {
  const required = requiredCapabilitiesForScenario(scenario);
  if (required.length === 0) {
    return true;
  }

  const feature = scenario.feature.toLowerCase();
  const text = `${scenario.feature} ${scenario.scenario}`.toLowerCase();
  const customCaps = overrides as Record<string, boolean | undefined> | undefined;

  if (feature === "catalog" && /filter/.test(text)) {
    if (customCaps && typeof customCaps.filters === "boolean") {
      return customCaps.filters;
    }
  }
  if (feature === "catalog" && /pagination/.test(text)) {
    if (customCaps && typeof customCaps.pagination === "boolean") {
      return customCaps.pagination;
    }
  }
  if (feature === "catalog" && /sort/.test(text)) {
    if (customCaps && typeof customCaps.sorting === "boolean") {
      return customCaps.sorting;
    }
  }

  if (
    feature === "catalog" &&
    /product listing|filter|sort|pagination|plp/.test(text)
  ) {
    const listingSignals = ["productListing", "productDetail", "categories", "search"] as const;
    return listingSignals.some((key) => {
      if (overrides && typeof overrides[key] === "boolean") {
        return Boolean(overrides[key]);
      }
      return Boolean(capabilities[key]);
    });
  }

  return required.every((key) => {
    if (overrides && typeof overrides[key] === "boolean") {
      return Boolean(overrides[key]);
    }
    return Boolean(capabilities[key]);
  });
}

function isEcommerceCustomCommand(scenario: BddScenario): boolean {
  const text = `${scenario.scenario} ${scenario.when.join(" ")}`.toLowerCase();
  return /checkout|add to cart|cart|payment|shipping|billing|pdp|product|plp|wishlist/.test(
    text
  );
}

function skipScenario(
  scenario: BddScenario,
  context: SiteCapabilityContext,
  hint?: keyof DiscoveryCapabilities
): BddScenario {
  const required = requiredCapabilitiesForScenario(scenario)[0];
  const skipReason = generateSkipReason({
    feature: scenario.feature,
    scenario: scenario.scenario,
    requiredCapability: hint ?? required,
    siteSuite: context.siteSuite,
  });
  return {
    ...scenario,
    executionStatus: "skipped",
    skipReason,
    skipConditions: [skipReason],
  };
}

function resolveGateCapabilities(
  context: SiteCapabilityContext,
  overrides?: Partial<DiscoveryCapabilities>
): DiscoveryCapabilities {
  if (!overrides) {
    return context.executionCapabilities;
  }
  const merged = { ...context.executionCapabilities };
  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === "boolean" && value) {
      merged[key as keyof DiscoveryCapabilities] = true;
    }
  }
  return merged;
}

export function applyScenarioCapabilityGate(
  scenarios: BddScenario[],
  context: SiteCapabilityContext,
  overrides?: Partial<DiscoveryCapabilities>
): BddScenario[] {
  const gateCapabilities = resolveGateCapabilities(context, overrides);
  return scenarios.map((scenario) => {
    if (scenario.executionStatus === "skipped") {
      return scenario;
    }
    if (scenario.feature === "Custom Command") {
      if (!context.allowsEcommerceScenarios && isEcommerceCustomCommand(scenario)) {
        return skipScenario(scenario, context, "checkout");
      }
      return scenario;
    }

    if (isEcommerceScenario(scenario) && !context.allowsEcommerceScenarios) {
      return skipScenario(scenario, context);
    }

    if (
      isEcommerceScenario(scenario) &&
      !scenarioHasRequiredCapabilities(scenario, gateCapabilities, overrides)
    ) {
      return skipScenario(scenario, context);
    }

    if (isStaticScenario(scenario) && !context.allowsStaticScenarios) {
      return skipScenario(scenario, context);
    }

    return scenario;
  });
}

export function filterScenarioQueue(params: {
  scenarios: BddScenario[];
  context: SiteCapabilityContext;
  maxCount: number;
  selectedTestType?: string;
  memoryCaps?: Partial<DiscoveryCapabilities>;
}): BddScenario[] {
  const gated = applyScenarioCapabilityGate(
    params.scenarios,
    params.context,
    params.memoryCaps
  );
  const executable = gated.filter((scenario) => scenario.executionStatus === "executable");
  const sorted = sortScenariosForExecution(
    executable,
    params.selectedTestType ?? "Full Regression",
    params.context
  );
  const limit = resolveEcommerceFullRegressionMaxCount(sorted.length, params.context);
  const effectiveMax =
    params.selectedTestType?.toLowerCase().includes("full regression") &&
    isEcommerceRegressionContext(params.context)
      ? Math.min(sorted.length, limit)
      : params.maxCount;
  return sorted.slice(0, effectiveMax);
}

export function filterScenariosForTestTypeAndCapabilities(
  scenarios: BddScenario[],
  selectedTestType: string,
  context: SiteCapabilityContext,
  memoryCaps?: Partial<DiscoveryCapabilities>
): BddScenario[] {
  const normalized = selectedTestType.toLowerCase();
  const gated = applyScenarioCapabilityGate(scenarios, context, memoryCaps);

  const sorted = sortScenariosForExecution(gated, selectedTestType, context);

  if (normalized.includes("smoke")) {
    const executableOnly = sorted.filter((item) => item.executionStatus === "executable");
    const smokePool =
      context.siteSuite === "static" || !context.allowsEcommerceScenarios
        ? executableOnly.filter((item) => isStaticScenario(item))
        : executableOnly;
    return smokePool.filter((item) => item.priority === "High").slice(0, 6);
  }

  if (normalized.includes("full regression")) {
    return sorted;
  }

  return sorted;
}

export function shouldUseEcommerceScenarioGeneration(context: SiteCapabilityContext): boolean {
  return context.allowsEcommerceScenarios && context.siteSuite !== "static";
}

export function shouldUseStaticScenarioGeneration(context: SiteCapabilityContext): boolean {
  return (
    context.allowsStaticScenarios &&
    (context.siteSuite === "static" ||
      context.siteSuite === "mixed" ||
      !context.allowsEcommerceScenarios)
  );
}

export function reconcileDiscoveryWithClassification(
  discovery: DiscoveryResult,
  classification: SiteClassification
): DiscoveryResult {
  if (discovery.siteSuite === classification.suite) {
    return discovery;
  }
  return {
    ...discovery,
    siteSuite: classification.suite,
    websiteType: classification.websiteType,
    classificationNotes: classification.rationale,
  };
}
