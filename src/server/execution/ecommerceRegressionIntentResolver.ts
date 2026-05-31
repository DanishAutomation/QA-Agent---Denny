import type { BddScenario, PlaywrightExecutionConfig } from "@/types";
import {
  buildSecondaryCartLinePdpUrl,
  getSecondaryCartLineConfig,
  usesProphyflexPrimaryFlow,
} from "./ecommerceCartConfig";
import { isRunCartPopulated } from "./ecommerceSessionStore";
import { getCheckoutPhase } from "./checkoutSessionStore";
import type { DomainExecutionMemory } from "./executionMemoryStore";
import {
  isCartPageUrl,
  isOnPaymentStep,
  isOnShippingStep,
  cartHasLineItems,
  cartOrMinicartHasItems,
  isCartRemoveConfirmModalVisible,
  isPaymentStepVisible,
  isShippingStepVisible,
  countListingProducts,
  validateListingPaginationPage2,
  dismissCheckoutBlockingModals,
} from "./pageInteractionHelpers";

const DEFAULT_ADD_TO_CART_STEPS = (
  searchQuery: string
): string[] => [
  `Search for '${searchQuery}'`,
  "Open first product from the results",
  'Click "buy once" checkbox for the first sku',
  "Click Add to Cart",
];

const CHECKOUT_FLOW_STEPS = {
  proceedFromCart:
    'Move to cart and click "proceed to checkout" to reach shipping address screen',
  shippingNext: 'On shipping address screen click "next button"',
  keepScheduled:
    'Click "KEEP AS SCHEDULED" button inside the popup window which is opened after clicking "Next" button to reach payment and billing info page',
  billingDefault:
    "On payment page choose customer's default address as billing address",
  makePayment: 'Click "MAKE PAYMENT"',
  confirmPaymentStep: "Confirm checkout reached payment step after shipping",
  confirmReviewStep: "Confirm checkout review step on payment page",
};

export function isEcommerceRegressionRun(config: PlaywrightExecutionConfig): boolean {
  const testType = (config.selectedTestType ?? "").toLowerCase();
  if (testType.includes("custom command")) {
    return false;
  }
  if (config.siteSuite !== "ecommerce" && config.siteSuite !== "mixed") {
    return false;
  }
  return testType.includes("full regression") || testType.includes("smoke");
}

export function extractSearchQueryFromMemory(memory: DomainExecutionMemory): string {
  for (const path of memory.successfulFlowPaths) {
    const match = path.match(/[?&]q=([^&]+)/i);
    if (match?.[1]) {
      return decodeURIComponent(match[1]).replace(/\+/g, " ");
    }
  }
  for (const step of memory.provenJourneySteps ?? []) {
    const quoted = step.match(/search(?:\s+for)?\s+['"]([^'"]+)['"]/i);
    if (quoted?.[1]) {
      return quoted[1].trim();
    }
  }
  return "powder";
}

export function pickProductUrlFromMemory(memory: DomainExecutionMemory): string | undefined {
  return memory.successfulFlowPaths.find((path) => /\/product\//i.test(path));
}

export function pickListingUrlFromMemory(memory: DomainExecutionMemory): string | undefined {
  return memory.successfulFlowPaths.find(
    (path) =>
      /\.html(?:$|[?#])/i.test(path) &&
      !/\/product\//i.test(path) &&
      !/\/customer\//i.test(path) &&
      !/\/checkout/i.test(path)
  );
}

function scrubAddToCartSteps(steps: string[]): string[] {
  return steps.filter(
    (step) => !/select quantity|qty dropdown|quantity from qty/i.test(step)
  );
}

function orderAddToCartSteps(steps: string[]): string[] {
  const order: Array<{ pattern: RegExp; pick?: (matches: string[]) => string | undefined }> = [
    { pattern: /wait.*login|click search bar/i },
    { pattern: /search for/i },
    { pattern: /open first product/i },
    { pattern: /buy once/i },
    { pattern: /select quantity|qty dropdown|quantity from/i },
    {
      pattern: /add to cart/i,
      pick: (matches) => matches.find((step) => /^click add to cart$/i.test(step.trim())) ?? matches[matches.length - 1],
    },
  ];

  const ordered: string[] = [];
  for (const rule of order) {
    const matches = steps.filter((step) => rule.pattern.test(step));
    if (matches.length === 0) {
      continue;
    }
    const chosen = rule.pick?.(matches) ?? matches[0];
    if (chosen && !ordered.includes(chosen)) {
      ordered.push(chosen);
    }
  }
  return ordered;
}

function buildAddToCartSteps(memory: DomainExecutionMemory): string[] {
  const proven = memory.provenJourneySteps ?? [];
  const addToCartCandidates = proven.filter((step) =>
    /search|open first product|buy once|quantity|add to cart|click search bar|wait.*login/i.test(step)
  );
  const orderedProven = orderAddToCartSteps(addToCartCandidates);
  if (orderedProven.length >= 3 && orderedProven.some((step) => /add to cart/i.test(step))) {
    return scrubAddToCartSteps(orderedProven);
  }

  const fromMappings = orderAddToCartSteps(
    memory.customCommandMappings
      .filter((entry) => entry.success)
      .map((entry) => entry.command.trim())
      .filter((step) =>
        /search|open first product|buy once|quantity|add to cart|click search bar|wait.*login/i.test(step)
      )
  );
  if (fromMappings.length >= 3 && fromMappings.some((step) => /add to cart/i.test(step))) {
    return scrubAddToCartSteps(fromMappings);
  }

  return DEFAULT_ADD_TO_CART_STEPS(extractSearchQueryFromMemory(memory));
}

function appendSecondaryCartLineStep(
  steps: string[],
  memory: DomainExecutionMemory,
  baseUrl: string
): string[] {
  const config = getSecondaryCartLineConfig(baseUrl);
  if (!config || !usesProphyflexPrimaryFlow(memory.successfulFlowPaths, steps)) {
    return steps;
  }
  const step = `Add second cart line item ${config.itemNumber} from PROPHYflex page`;
  if (steps.some((item) => item.includes(config.itemNumber) || /second cart line item/i.test(item))) {
    return steps;
  }
  const moveIdx = steps.findIndex((item) => /move to cart/i.test(item));
  if (moveIdx >= 0) {
    const next = [...steps];
    next.splice(moveIdx, 0, step);
    return next;
  }
  return [...steps, step];
}

function buildCartReadySteps(
  memory: DomainExecutionMemory,
  runId: string | undefined,
  baseUrl: string
): string[] {
  if (runId && isRunCartPopulated(runId)) {
    return ["Move to cart"];
  }
  return [...appendSecondaryCartLineStep(buildAddToCartSteps(memory), memory, baseUrl), "Move to cart"];
}

function buildCheckoutPrefix(
  memory: DomainExecutionMemory,
  runId: string | undefined,
  baseUrl: string
): string[] {
  const phase = runId ? getCheckoutPhase(runId) : "none";
  if (phase === "payment" || phase === "complete") {
    return [];
  }
  if (phase === "shipping") {
    return [];
  }

  const cartSteps =
    runId && isRunCartPopulated(runId)
      ? ["Move to cart", "Ensure cart has items for checkout"]
      : [...buildCartReadySteps(memory, runId, baseUrl), "Ensure cart has items for checkout"];
  return [...cartSteps, CHECKOUT_FLOW_STEPS.proceedFromCart];
}

function buildPdpNavigationSteps(
  memory: DomainExecutionMemory,
  text: string,
  runId?: string
): string[] {
  const productUrl = pickProductUrlFromMemory(memory);
  const searchQuery = extractSearchQueryFromMemory(memory);

  if (/add to cart/.test(text)) {
    if (runId && isRunCartPopulated(runId)) {
      return productUrl
        ? [`Navigate to ${productUrl}`, "Click Add to Cart"]
        : [`Search for '${searchQuery}'`, "Open first product from the results", "Click Add to Cart"];
    }
    return buildAddToCartSteps(memory);
  }
  if (/variant|child sku|item number|buy once/.test(text)) {
    return [
      `Search for '${searchQuery}'`,
      "Open first product from the results",
      'Click "buy once" checkbox for the first sku',
    ];
  }
  if (/quantity/.test(text)) {
    return productUrl
      ? [`Navigate to ${productUrl}`, "Select Quantity from Qty dropdown"]
      : [`Search for '${searchQuery}'`, "Open first product from the results", "Select Quantity from Qty dropdown"];
  }
  if (productUrl) {
    return [`Navigate to ${productUrl}`];
  }
  return [`Search for '${searchQuery}'`, "Open first product from the results"];
}

function isCategoryListingPath(url: string): boolean {
  return (
    /\.html(?:$|[?#])/i.test(url) &&
    !/\/product\//i.test(url) &&
    !/\/customer\//i.test(url) &&
    !/\/checkout/i.test(url) &&
    !/catalogsearch/i.test(url)
  );
}

export function pickCategoryListingUrl(
  memory: DomainExecutionMemory,
  config: PlaywrightExecutionConfig
): string | undefined {
  const discoveryMatches =
    config.discoveryPages?.filter((page) => isCategoryListingPath(page.url)) ?? [];
  const preferredDiscovery = discoveryMatches.find((page) => /gloves\.html/i.test(page.url));
  if (preferredDiscovery) {
    return preferredDiscovery.url;
  }
  if (discoveryMatches[0]?.url) {
    return discoveryMatches[0].url;
  }

  const fromMemory = memory.successfulFlowPaths.find((path) => isCategoryListingPath(path));
  if (fromMemory) {
    return fromMemory;
  }

  try {
    const base = new URL(config.baseUrl);
    return `${base.origin}/gloves.html`;
  } catch {
    return undefined;
  }
}

function buildCategoryListingSteps(
  memory: DomainExecutionMemory,
  config: PlaywrightExecutionConfig
): string[] {
  const categoryUrl = pickCategoryListingUrl(memory, config);
  if (categoryUrl) {
    return [`Navigate to ${categoryUrl}`];
  }
  return buildCatalogListingSteps(memory);
}

function buildCatalogListingSteps(memory: DomainExecutionMemory): string[] {
  const listingUrl = pickListingUrlFromMemory(memory);
  const searchQuery = extractSearchQueryFromMemory(memory);
  if (listingUrl) {
    return [`Navigate to ${listingUrl}`];
  }
  return [`Search for '${searchQuery}'`];
}

export function resolveEcommerceRegressionIntents(
  scenario: BddScenario,
  memory: DomainExecutionMemory,
  config: PlaywrightExecutionConfig
): string[] {
  if (!isEcommerceRegressionRun(config)) {
    return [];
  }

  const feature = scenario.feature.trim();
  const text = `${scenario.scenario} ${scenario.when.join(" ")}`.toLowerCase();
  const searchQuery = extractSearchQueryFromMemory(memory);

  if (feature === "Authentication") {
    if (/guest checkout/.test(text)) {
      return [
        ...buildCartReadySteps(memory, config.runId, config.baseUrl),
        CHECKOUT_FLOW_STEPS.proceedFromCart,
        "Proceed to guest checkout",
      ];
    }
    if (/signup/.test(text)) {
      return ["Navigate to customer account create page"];
    }
    if (/forgot password/.test(text)) {
      return ["Navigate to forgot password page"];
    }
    if (/login flow/.test(text)) {
      return ["Login with provided credentials"];
    }
  }

  if (feature === "Catalog") {
    if (/search/.test(text)) {
      return [`Search for '${searchQuery}'`];
    }
    if (/product listing|plp/.test(text)) {
      return buildCategoryListingSteps(memory, config).concat("Open first product from the results");
    }
    if (/categor/.test(text)) {
      return buildCategoryListingSteps(memory, config);
    }
    if (/filter/.test(text)) {
      return [...buildCategoryListingSteps(memory, config), "Apply first catalog filter if available"];
    }
    if (/pagination/.test(text)) {
      return [...buildCategoryListingSteps(memory, config), "Go to page 2 of product listing if pagination exists"];
    }
    if (/sort/.test(text)) {
      return [...buildCategoryListingSteps(memory, config), "Apply first sort option if available"];
    }
  }

  if (feature === "PDP") {
    return buildPdpNavigationSteps(memory, text, config.runId);
  }

  if (feature === "Cart") {
    if (/add item/.test(text)) {
      return buildCartReadySteps(memory, config.runId, config.baseUrl);
    }
    if (/update quantity/.test(text)) {
      if (config.runId && isRunCartPopulated(config.runId)) {
        return ["Move to cart", "Update quantity in cart to 2"];
      }
      return [...buildCartReadySteps(memory, config.runId, config.baseUrl), "Update quantity in cart to 2"];
    }
    if (/remove item/.test(text)) {
      return [
        ...buildCartReadySteps(memory, config.runId, config.baseUrl),
        "Ensure second cart line item if needed",
        "Remove item from cart",
      ];
    }
    if (/coupon/.test(text)) {
      return [...buildCartReadySteps(memory, config.runId, config.baseUrl), "Apply coupon code if available"];
    }
  }

  if (feature === "Checkout") {
    const phase = config.runId ? getCheckoutPhase(config.runId) : "none";
    const prefix = buildCheckoutPrefix(memory, config.runId, config.baseUrl);
    if (/address/.test(text)) {
      return [...prefix, CHECKOUT_FLOW_STEPS.shippingNext];
    }
    if (/shipping/.test(text)) {
      if (phase === "payment" || phase === "complete") {
        return [CHECKOUT_FLOW_STEPS.confirmPaymentStep];
      }
      return [...prefix, CHECKOUT_FLOW_STEPS.shippingNext];
    }
    if (/billing/.test(text)) {
      if (phase === "payment" || phase === "complete") {
        return [CHECKOUT_FLOW_STEPS.billingDefault];
      }
      return [...prefix, CHECKOUT_FLOW_STEPS.shippingNext, CHECKOUT_FLOW_STEPS.billingDefault];
    }
    if (/payment/.test(text)) {
      if (phase === "payment" || phase === "complete") {
        return [CHECKOUT_FLOW_STEPS.makePayment];
      }
      return [
        ...prefix,
        CHECKOUT_FLOW_STEPS.shippingNext,
        CHECKOUT_FLOW_STEPS.billingDefault,
        CHECKOUT_FLOW_STEPS.makePayment,
      ];
    }
    if (/review/.test(text)) {
      if (phase === "complete" || phase === "payment") {
        return [CHECKOUT_FLOW_STEPS.confirmReviewStep];
      }
      return [...prefix, CHECKOUT_FLOW_STEPS.shippingNext, CHECKOUT_FLOW_STEPS.billingDefault];
    }
  }

  if (feature === "Account") {
    if (/orders/.test(text)) {
      return ["Navigate to customer orders page"];
    }
    if (/profile/.test(text)) {
      return ["Navigate to customer account profile"];
    }
  }

  return [];
}

export async function assertEcommerceRegressionOutcome(params: {
  page: import("playwright-core").Page;
  scenario: BddScenario;
  runId: string;
  cartHasItems: boolean;
}): Promise<void> {
  const { page, scenario, cartHasItems } = params;
  const feature = scenario.feature.trim();
  const text = `${scenario.scenario} ${scenario.when.join(" ")}`.toLowerCase();
  const url = page.url();

  if (feature === "Catalog") {
    if (/categor|product listing|filter|pagination|sort/.test(text) && /catalogsearch/i.test(url)) {
      throw new Error(
        `Catalog scenario "${scenario.scenario}" ended on search results (${url}) instead of a category/product listing page.`
      );
    }
    if (/product listing/.test(text) && /catalogsearch/i.test(url)) {
      throw new Error(
        `Product listing scenario "${scenario.scenario}" ended on search results (${url}) instead of a category listing or product page.`
      );
    }
    if (/product listing/.test(text) && !/\/product\//i.test(url) && !isCategoryListingPath(url)) {
      throw new Error(
        `Product listing scenario "${scenario.scenario}" did not open a product or remain on a listing page (${url}).`
      );
    }
    if (/categor/.test(text) && !/catalogsearch/i.test(url) && !isCategoryListingPath(url)) {
      throw new Error(`Categories scenario "${scenario.scenario}" did not end on a category page (${url}).`);
    }
    if (/filter/.test(text)) {
      const applied = /filter applied|catalog filter|narrowed listing/i.test(
        (await page.content()).slice(0, 120_000)
      );
      const urlChanged = /(?:^|[?&])(?:filter|price|cat)=|amshopby/i.test(url);
      const activeFilter =
        (await page.locator(".filter-current, .amshopby-filter-current, .block-subtitle.filter-current, .filter-current-subtitle").count()) > 0;
      const narrowedCategory = /\/gloves\/|\/category\//i.test(url) && !/gloves\.html(?:$|[?#])/i.test(url);
      if (!applied && !urlChanged && !activeFilter && !narrowedCategory) {
        throw new Error("Filter scenario completed without applying a catalog filter.");
      }
    }
    if (/pagination/.test(text)) {
      const validation = await validateListingPaginationPage2(page, 20_000, await countListingProducts(page));
      if (!validation.ok) {
        throw new Error(
          validation.failureReason ??
            "Pagination opens empty product listing page — page 2 loaded but no products were displayed."
        );
      }
      if (validation.emptyStateDetected && (validation.productCountAfter ?? 0) === 0) {
        return;
      }
      if ((validation.productCountAfter ?? 0) === 0) {
        throw new Error(
          "Pagination scenario completed on page 2 without visible products or a clear empty-state message."
        );
      }
    }
  }

  if (feature === "Authentication" && /login flow/.test(text)) {
    const authenticated =
      url.includes("is_logged_in=1") ||
      (url.includes("/customer/account") && !url.includes("/login"));
    if (!authenticated) {
      throw new Error("Login scenario completed without establishing an authenticated session.");
    }
  }

  if (feature === "Authentication" && /guest checkout/.test(text)) {
    if (isCartPageUrl(url) && !(await cartHasLineItems(page))) {
      throw new Error("Guest checkout scenario ended on empty cart page.");
    }
    const onCheckoutFlow =
      isOnShippingStep(url) ||
      isOnPaymentStep(url) ||
      /\/checkout(?:\/|$|[?#])/i.test(url);
    if (!onCheckoutFlow && isCartPageUrl(url)) {
      throw new Error(
        "Guest checkout scenario did not advance past cart — checkout flow was not reached."
      );
    }
  }

  if (feature === "PDP" && /add to cart/.test(text)) {
    const hasItems = cartHasItems || (await cartOrMinicartHasItems(page));
    if (!hasItems) {
      throw new Error("Add to cart scenario completed but cart state was not established.");
    }
  }

  if (feature === "Cart") {
    if (!isCartPageUrl(url)) {
      throw new Error(`Cart scenario expected cart page but ended on ${url}.`);
    }
    if (await isCartRemoveConfirmModalVisible(page)) {
      await dismissCheckoutBlockingModals(page, 10_000);
    }
    if (await isCartRemoveConfirmModalVisible(page)) {
      throw new Error("Cart scenario ended with remove confirmation modal still open.");
    }
    const hasItems = await cartHasLineItems(page);
    if (!hasItems && !/coupon/.test(text)) {
      throw new Error("Cart scenario passed on an empty cart page.");
    }
    if (/remove item/.test(text) && !hasItems) {
      throw new Error("Remove item scenario emptied the cart — checkout prerequisites were lost.");
    }
  }

  if (feature === "Checkout") {
    if (!(await cartHasLineItems(page)) && !cartHasItems && !/payment|billing|shipping|address/.test(text)) {
      throw new Error(
        "Checkout blocked because cart is empty and product could not be restored."
      );
    }

    if (/address/.test(text)) {
      const onAddressStep =
        isOnShippingStep(url) ||
        isOnPaymentStep(url) ||
        (await isShippingStepVisible(page)) ||
        (await isPaymentStepVisible(page));
      if (!onAddressStep) {
        throw new Error(`Address step scenario did not reach checkout shipping/payment (${url}).`);
      }
      return;
    }

    if (/shipping/.test(text)) {
      if (!isOnPaymentStep(url) && !(await isPaymentStepVisible(page))) {
        throw new Error("Shipping scenario did not reach payment step after shipping Next.");
      }
      return;
    }

    if (/billing/.test(text)) {
      if (!isOnPaymentStep(url) && !(await isPaymentStepVisible(page))) {
        throw new Error(`Billing scenario expected payment step but ended on ${url}.`);
      }
      return;
    }

    if (/payment/.test(text)) {
      const phase = getCheckoutPhase(params.runId);
      if (phase !== "complete" && !isOnPaymentStep(url) && !(await isPaymentStepVisible(page))) {
        throw new Error(`Payment scenario did not reach payment step or complete Make Payment (${url}).`);
      }
      return;
    }

    if (/review/.test(text)) {
      const phase = getCheckoutPhase(params.runId);
      if (
        phase === "complete" ||
        phase === "payment" ||
        isOnPaymentStep(url) ||
        (await isPaymentStepVisible(page))
      ) {
        return;
      }
      throw new Error(`Review scenario did not reach payment or completed checkout (${url}).`);
    }

    if (isCartPageUrl(url)) {
      throw new Error(
        "Checkout scenario ended on cart page — checkout flow was not reached (cart may be empty)."
      );
    }
    const onCheckoutFlow =
      isOnShippingStep(url) || isOnPaymentStep(url) || /\/checkout(?:\/|$|[?#])/i.test(url);
    if (!onCheckoutFlow) {
      throw new Error(`Checkout scenario expected checkout flow page but ended on ${url}.`);
    }
  }

  if (feature === "Account") {
    if (!url.includes("/customer/account") || url.includes("/login")) {
      throw new Error(`Account scenario expected authenticated account page but ended on ${url}.`);
    }
  }
}
