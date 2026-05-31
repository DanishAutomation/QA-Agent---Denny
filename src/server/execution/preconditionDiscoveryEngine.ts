import type { Page } from "playwright-core";
import type { ParsedInstructionData } from "@/types";
import {
  fillVisibleInputByHeuristics,
  ensureCheckoutPaymentStep,
  ensureCheckoutShippingStep,
  hasSelectedShippingAddress,
  isCartPageUrl,
  isOnPaymentStep,
  isOnShippingStep,
  isProductDetailPage,
  prepareProductPageForAddToCart,
  tryBuyOnceOptional,
  tryClickCheckoutNext,
  tryCloseCheckoutPopup,
  tryProceedToCheckout,
  trySelectDefaultBillingAddress,
  trySelectQuantity,
} from "./pageInteractionHelpers";

interface DiscoveryContext {
  page: Page;
  actionIntent: string;
  parsedInstructions?: ParsedInstructionData;
  safeTestMode?: boolean;
}

export interface PreconditionDiscoveryResult {
  missingPreconditions: string[];
  actionsTaken: string[];
  retryResult: "not-needed" | "recovered" | "failed";
  investigationFindings: string[];
}

function safeAddressData(parsed?: ParsedInstructionData) {
  return {
    name: parsed?.address.name ?? "Denny QA User",
    street: parsed?.address.street ?? "221B Baker Street",
    city: parsed?.address.city ?? "London",
    state: parsed?.address.state ?? "Greater London",
    zip: parsed?.address.zip ?? "NW16XE",
    country: parsed?.address.country ?? "UK",
    phone: parsed?.address.phone ?? "+442071234567",
  };
}

function parsedPaymentData(parsed?: ParsedInstructionData) {
  if (!parsed?.payment.cardNumber || !parsed.payment.expiry || !parsed.payment.cvv) {
    return null;
  }
  return {
    cardNumber: parsed.payment.cardNumber,
    expiry: parsed.payment.expiry,
    cvv: parsed.payment.cvv,
    cardholderName: parsed.payment.cardholderName ?? "Denny QA User",
  };
}

async function fillInputByHeuristics(
  page: Page,
  tokens: string[],
  value: string
): Promise<boolean> {
  return fillVisibleInputByHeuristics(page, tokens, value);
}

async function resolveProductPagePreconditions(
  page: Page,
  actionIntent: string,
  actionsTaken: string[]
): Promise<void> {
  if (/buy once/i.test(actionIntent)) {
    const buyOnce = await tryBuyOnceOptional(page, 5_000);
    if (buyOnce.ok) {
      actionsTaken.push("Selected buy once option during recovery.");
    } else {
      actionsTaken.push("Buy once not available; skipped during recovery.");
    }
  }

  await prepareProductPageForAddToCart(page, actionsTaken);

  if (/qty|quantity/i.test(actionIntent) && (await isProductDetailPage(page))) {
    const qty = await trySelectQuantity(page);
    if (qty.ok) {
      actionsTaken.push("Set quantity on product page during recovery.");
    }
  }
}

async function resolveCheckoutPreconditions(
  page: Page,
  actionIntent: string,
  actionsTaken: string[]
): Promise<void> {
  if (/proceed to checkout|continue to checkout/i.test(actionIntent)) {
    const proceed = await tryProceedToCheckout(page, 10_000);
    if (proceed.ok) {
      actionsTaken.push("Clicked Proceed to Checkout during recovery.");
    }
    return;
  }

  if (/next button|shipping address screen|continue to payment/i.test(actionIntent)) {
    await ensureCheckoutShippingStep(page, 10_000);
    if (await hasSelectedShippingAddress(page)) {
      actionsTaken.push("Shipping address already selected; attempting Next click only.");
    }
    const next = await tryClickCheckoutNext(page, 10_000, { closePopupAfter: true });
    if (next.ok) {
      actionsTaken.push("Clicked checkout Next/Continue during recovery.");
      await tryCloseCheckoutPopup(page, 5_000);
    }
    return;
  }

  if (/close.*popup|close.*modal|close.*window/i.test(actionIntent)) {
    const closed = await tryCloseCheckoutPopup(page, 10_000);
    if (closed.ok) {
      actionsTaken.push(closed.skipped ? "No popup to close." : "Closed checkout popup during recovery.");
    }
    await ensureCheckoutPaymentStep(page, 10_000);
    return;
  }

  if (/billing address|default address as billing/i.test(actionIntent)) {
    const billing = await trySelectDefaultBillingAddress(page, 10_000);
    if (billing.ok) {
      actionsTaken.push("Selected default billing address during recovery.");
    }
    return;
  }
}

async function resolveRequiredSelections(page: Page, actionsTaken: string[], actionIntent: string): Promise<void> {
  if ((await isProductDetailPage(page)) || /add to cart|buy once|qty|quantity/i.test(actionIntent)) {
    await resolveProductPagePreconditions(page, actionIntent, actionsTaken);
    return;
  }

  if (isOnCheckoutFormStep(page.url()) || isCartPageUrl(page.url()) || isOnShippingStep(page.url())) {
    await resolveCheckoutPreconditions(page, actionIntent, actionsTaken);
    if (/next button|shipping address screen|proceed to checkout|close.*popup|billing address/i.test(actionIntent)) {
      return;
    }
  }
  if (isCartPageUrl(page.url())) {
    return;
  }
  if (!(await isProductDetailPage(page))) {
    return;
  }
  const requiredSelects = page.locator("select[required]");
  const selectCount = Math.min(await requiredSelects.count(), 20);
  for (let i = 0; i < selectCount; i += 1) {
    const select = requiredSelects.nth(i);
    const options = select.locator("option");
    const optionCount = await options.count();
    for (let o = 0; o < optionCount; o += 1) {
      const option = options.nth(o);
      const value = (await option.getAttribute("value")) ?? "";
      if (value && value !== "0") {
        await select.selectOption(value);
        actionsTaken.push(`Selected required dropdown value "${value}".`);
        break;
      }
    }
  }

  const requiredUnchecked = page.locator("input[required][type='checkbox']:not(:checked)");
  const checkboxCount = Math.min(await requiredUnchecked.count(), 20);
  for (let i = 0; i < checkboxCount; i += 1) {
    const box = requiredUnchecked.nth(i);
    await box.check();
    actionsTaken.push("Checked required checkbox.");
  }

  const qtySelects = page.locator("select");
  const qtySelectCount = Math.min(await qtySelects.count(), 20);
  for (let i = 0; i < qtySelectCount; i += 1) {
    const select = qtySelects.nth(i);
    if (!(await select.isVisible())) {
      continue;
    }
    const inMiniCart = await select
      .evaluate((el) => !!el.closest(".minicart, .block-minicart, [data-block='minicart']"))
      .catch(() => false);
    if (inMiniCart || isCartPageUrl(page.url())) {
      continue;
    }
    const descriptor = `${(await select.getAttribute("name")) ?? ""} ${(await select.getAttribute("id")) ?? ""}`.toLowerCase();
    if (!/(^|\b)(qty|quantity)(\b|$)/i.test(descriptor)) {
      continue;
    }
    const options = select.locator("option");
    const optionCount = await options.count();
    for (let o = 0; o < optionCount; o += 1) {
      const option = options.nth(o);
      const value = (await option.getAttribute("value")) ?? "";
      if (value && value !== "0") {
        await select.selectOption(value);
        actionsTaken.push("Set quantity to safe default from visible dropdown.");
        break;
      }
    }
    break;
  }

  const inputs = page.locator("input:not([type='hidden'])");
  const inputCount = Math.min(await inputs.count(), 40);
  for (let i = 0; i < inputCount; i += 1) {
    const element = inputs.nth(i);
    if (!(await element.isVisible())) {
      continue;
    }
    const inMiniCart = await element
      .evaluate((el) => !!el.closest(".minicart, .block-minicart, [data-block='minicart'], header, .block-search"))
      .catch(() => false);
    if (inMiniCart || isCartPageUrl(page.url())) {
      continue;
    }
    const descriptor = `${(await element.getAttribute("name")) ?? ""} ${(await element.getAttribute("id")) ?? ""}`.toLowerCase();
    if (!/(^|\b)(qty|quantity)(\b|$)/i.test(descriptor)) {
      continue;
    }
    await element.fill("1");
    actionsTaken.push("Set quantity to safe default 1.");
    break;
  }

  const variantButtons = page.locator(
    "button[data-variant], button[aria-label*='size' i], button[aria-label*='color' i]"
  );
  if ((await variantButtons.count()) > 0) {
    await variantButtons.first().click();
    actionsTaken.push("Selected first available variant/size/color option.");
  }
}

function isOnCheckoutUrl(url: string): boolean {
  return /checkout|\/cart|shipping|payment|billing|onepage/i.test(url.toLowerCase());
}

function isOnCheckoutFormStep(url: string): boolean {
  const lower = url.toLowerCase();
  if (isCartPageUrl(lower)) {
    return false;
  }
  return (
    isOnShippingStep(lower) ||
    isOnPaymentStep(lower) ||
    /checkout\/index|checkout\/onepage/i.test(lower)
  );
}

async function discoverMissingPreconditions(page: Page): Promise<string[]> {
  const missing: string[] = [];

  if ((await page.locator("select[required]").count()) > 0) {
    missing.push("Required dropdown or variant selection");
  }
  if ((await page.locator("input[required][type='checkbox']:not(:checked)").count()) > 0) {
    missing.push("Required checkbox not selected");
  }
  const visibleQtySelect = page.locator("select").filter({ has: page.locator("option") });
  const selectCount = Math.min(await visibleQtySelect.count(), 20);
  for (let i = 0; i < selectCount; i += 1) {
    const select = visibleQtySelect.nth(i);
    if (!(await select.isVisible())) {
      continue;
    }
    const descriptor = `${(await select.getAttribute("name")) ?? ""} ${(await select.getAttribute("id")) ?? ""}`.toLowerCase();
    if (/(^|\b)(qty|quantity)(\b|$)/i.test(descriptor)) {
      missing.push("Quantity required");
      break;
    }
  }
  const text = (await page.locator("body").innerText()).toLowerCase();
  if (/out of stock|unavailable|sold out/.test(text)) {
    missing.push("Inventory unavailable");
  }
  if (/personalization required|enter engraving|custom text required/.test(text)) {
    missing.push("Personalization required");
  }

  return [...new Set(missing)];
}

async function investigateFailureContext(page: Page): Promise<string[]> {
  const findings: string[] = [];
  try {
    if ((await page.locator("iframe").count()) > 0) {
      findings.push("Iframe detected; target action may be inside nested browsing context.");
    }
    if ((await page.locator("[role='dialog'], .modal, [data-testid*='modal' i]").count()) > 0) {
      findings.push("Modal/dialog present; interactions may be blocked.");
    }
    if (
      (await page.locator("[class*='overlay' i], [id*='overlay' i], [data-testid*='overlay' i]").count()) > 0
    ) {
      findings.push("Overlay detected; click targets may be obscured.");
    }
    if (
      (await page.locator("button[disabled], [aria-disabled='true'], input[disabled]").count()) > 0
    ) {
      findings.push("Disabled controls present; prerequisite steps may be missing.");
    }
    if (
      (await page
        .locator("[role='alert'], .error, .validation-error, [data-testid*='error' i]")
        .count()) > 0
    ) {
      findings.push("Validation/error messages detected on page.");
    }
    const bodyText = (await page.locator("body").innerText()).toLowerCase();
    if (/captcha|i am not a robot|recaptcha/.test(bodyText)) {
      findings.push("Captcha challenge detected.");
    }
    if (/timeout|timed out|server error|500|404/.test(bodyText)) {
      findings.push("Potential navigation/server failure markers detected in page content.");
    }
  } catch {
    findings.push("Failure investigation could not fully inspect page context.");
  }
  return findings;
}

async function fillCheckoutData(
  page: Page,
  parsed?: ParsedInstructionData
): Promise<string[]> {
  const actions: string[] = [];
  const data = safeAddressData(parsed);

  const mappings: Array<[string[], string]> = [
    [["firstname", "full.?name", "customername"], data.name],
    [["address", "street", "line1"], data.street],
    [["city"], data.city],
    [["state", "province", "region"], data.state],
    [["zip", "postal", "postcode"], data.zip],
    [["country"], data.country],
    [["phone", "mobile"], data.phone],
  ];

  for (const [tokens, value] of mappings) {
    const filled = await fillInputByHeuristics(page, tokens, value);
    if (filled) {
      actions.push(`Filled checkout field (${tokens[0]}) from parsed/fallback data.`);
    }
  }
  return actions;
}

async function fillPaymentData(
  page: Page,
  parsed?: ParsedInstructionData
): Promise<string[]> {
  const actions: string[] = [];
  const payment = parsedPaymentData(parsed);
  if (!payment) {
    actions.push("Payment data not provided in custom instructions; skipped payment autofill.");
    return actions;
  }

  const mappings: Array<[string[], string]> = [
    [["cardnumber", "cc-number", "credit.?card", "cc.?number"], payment.cardNumber],
    [["expiry", "exp"], payment.expiry],
    [["cvv", "cvc", "security"], payment.cvv],
    [["cardholder", "name on card"], payment.cardholderName],
  ];

  for (const [tokens, value] of mappings) {
    const filled = await fillInputByHeuristics(page, tokens, value);
    if (filled) {
      actions.push(`Filled payment field (${tokens[0]}) from custom instruction data.`);
    }
  }
  return actions;
}

export async function runPreconditionDiscoveryAndRetry(
  context: DiscoveryContext,
  retryAction: () => Promise<void>
): Promise<PreconditionDiscoveryResult> {
  const { page, actionIntent, parsedInstructions, safeTestMode } = context;
  const actionsTaken: string[] = [];
  const missingPreconditions = await discoverMissingPreconditions(page);
  const investigationFindings = await investigateFailureContext(page);

  await resolveRequiredSelections(page, actionsTaken, actionIntent);

  const skipAddressAutofill =
    (/next button|shipping address screen|proceed to checkout/i.test(actionIntent) &&
      isOnCheckoutUrl(page.url()) &&
      (await hasSelectedShippingAddress(page))) ||
    isCartPageUrl(page.url());

  if (/checkout|address|shipping|billing/i.test(actionIntent) && !skipAddressAutofill && isOnCheckoutFormStep(page.url())) {
    const checkoutActions = await fillCheckoutData(page, parsedInstructions);
    actionsTaken.push(...checkoutActions);
  }

  if (
    /enter card|card detail|card no|card number|\bcvv\b|\bexpiry\b|place order/i.test(actionIntent) &&
    isOnPaymentStep(page.url())
  ) {
    const paymentActions = await fillPaymentData(page, parsedInstructions);
    actionsTaken.push(...paymentActions);
  }

  if (/place order|confirm order|pay now/i.test(actionIntent) && !safeTestMode) {
    actionsTaken.push(
      "Safe test mode disabled; intentionally avoided final order placement click."
    );
  }

  try {
    await retryAction();
    return {
      missingPreconditions,
      actionsTaken,
      retryResult: "recovered",
      investigationFindings,
    };
  } catch {
    return {
      missingPreconditions,
      actionsTaken,
      retryResult: "failed",
      investigationFindings,
    };
  }
}
