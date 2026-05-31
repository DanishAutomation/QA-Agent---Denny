import type { Page } from "playwright-core";

const LOGIN_FIELD_PATTERN =
  /login|signin|sign-in|password|username|email|auth/i;
const SEARCH_FIELD_PATTERN =
  /search|query|find|catalog|autocomplete|mini.?search/i;
const PDP_QTY_ROOT =
  ".box-tocart, .product-add-form, form#product_addtocart_form, [data-role='tocart-form']";
const PDP_QTY_INPUT_SELECTORS = [
  "input#qty",
  "input[name='qty']",
  "input[type='number']",
  "input.input-text.qty",
  "input.qty",
  ".field.qty input",
  ".control.qty input",
  ".qty-wrapper input",
  "[role='spinbutton']",
];
const ADD_TO_CART_SELECTORS = [
  "#product-addtocart-button",
  ".box-tocart button[type='submit']",
  ".box-tocart .action.tocart",
  "button[title='Add to Cart']",
  "button[title='Add to Bag']",
];
const HEADER_SEARCH_SELECTORS = [
  "#search",
  "input[name='q']",
  "input[type='search']",
  ".block-search input[type='text']",
  "[data-role='minisearch-input']",
  "input[id*='search' i]:not([type='hidden'])",
];
const GIFT_PROMO_FIELD_PATTERN =
  /gift.?card|promo|coupon|discount|voucher|reward/i;
export const PAYMENT_ROOT =
  "#checkout-payment-method-load, #payment, .checkout-payment-method, .payment-method, .opc-payment";

export function extractQuantityValue(intent: string, fallback = "1"): string {
  const direct = intent.match(/(?:qty|quantity)\s*(?:to|=|:|of)?\s*(\d+)/i);
  if (direct?.[1]) {
    return direct[1];
  }
  const reversed = intent.match(/(\d+)\s*(?:qty|quantity)/i);
  if (reversed?.[1]) {
    return reversed[1];
  }
  return fallback;
}

export async function isCustomerLoggedIn(page: Page): Promise<boolean> {
  const url = page.url().toLowerCase();
  if (url.includes("/customer/account/index") && !url.includes("/login")) {
    return true;
  }
  if (url.includes("is_logged_in=1")) {
    return true;
  }
  const logoutLink = page
    .locator(
      "a[href*='customer/account/logout'], a[href*='/logout'], button:has-text('Sign Out'), button:has-text('Log Out')"
    )
    .first();
  if ((await logoutLink.count()) > 0 && (await logoutLink.isVisible().catch(() => false))) {
    return true;
  }
  const welcome = page.locator(".customer-welcome, .authorization-link .customer-name, .logged-in").first();
  if ((await welcome.count()) > 0 && (await welcome.isVisible().catch(() => false))) {
    return true;
  }
  return false;
}

async function isGuestCheckoutModalVisible(page: Page): Promise<boolean> {
  const modal = page
    .locator(".modal-popup._show, .modal-popup[style*='display: block'], [role='dialog']:visible")
    .first();
  if ((await modal.count()) === 0 || !(await modal.isVisible().catch(() => false))) {
    return false;
  }
  const text = ((await modal.innerText().catch(() => "")) ?? "").toLowerCase();
  return /guest checkout|checkout as guest|continue as guest|without an account|new customer|checkout without/i.test(
    text
  );
}

async function tryLoginInCheckoutModal(
  page: Page,
  email: string,
  password: string,
  timeoutMs: number
): Promise<{ ok: boolean; strategy?: string }> {
  const modal = page.locator(".modal-popup._show, [role='dialog']:visible").first();
  const emailField = modal
    .locator(
      "input[type='email'], input[name='login[username]'], input[name='username'], input#email, input[name='email']"
    )
    .first();
  const passwordField = modal
    .locator("input[type='password'], input[name='login[password]'], input#pass, input[name='password']")
    .first();

  if ((await emailField.count()) === 0 || (await passwordField.count()) === 0) {
    return { ok: false, strategy: "checkout-modal-login-fields-missing" };
  }

  await emailField.fill(email, { timeout: timeoutMs }).catch(() => undefined);
  await passwordField.fill(password, { timeout: timeoutMs }).catch(() => undefined);

  const submit = modal
    .locator(
      "button:has-text('Sign In'), button:has-text('Login'), button:has-text('Log In'), button[type='submit']"
    )
    .first();
  if ((await submit.count()) > 0 && (await submit.isVisible().catch(() => false))) {
    await submit.click({ timeout: timeoutMs }).catch(() => undefined);
  } else {
    await passwordField.press("Enter").catch(() => undefined);
  }

  await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
  await page.waitForTimeout(800);
  if (await isCustomerLoggedIn(page)) {
    return { ok: true, strategy: "checkout-modal-login-submitted" };
  }
  return { ok: false, strategy: "checkout-modal-login-not-authenticated" };
}

async function tryHandleGuestCheckoutModalForAuthenticatedUser(
  page: Page,
  timeoutMs: number,
  options?: { loginEmail?: string; loginPassword?: string }
): Promise<{ ok: boolean; strategy?: string }> {
  if (!(await isGuestCheckoutModalVisible(page))) {
    return { ok: true, strategy: "no-guest-checkout-modal" };
  }

  const modal = page.locator(".modal-popup._show, [role='dialog']:visible").first();
  const signInTab = modal
    .locator(
      "button:has-text('Sign In'), button:has-text('Login'), a:has-text('Sign In'), a:has-text('Login'), [data-role='sign-in']"
    )
    .first();
  if ((await signInTab.count()) > 0 && (await signInTab.isVisible().catch(() => false))) {
    await signInTab.click({ timeout: timeoutMs }).catch(() => undefined);
    await page.waitForTimeout(500);
  }

  const email = options?.loginEmail?.trim() ?? "";
  const password = options?.loginPassword?.trim() ?? "";
  if (email && password) {
    const loggedIn = await tryLoginInCheckoutModal(page, email, password, timeoutMs);
    if (loggedIn.ok) {
      return loggedIn;
    }
  }

  const closeButton = modal
    .locator(".action-close, button[aria-label='Close'], button[title='Close']")
    .first();
  if ((await closeButton.count()) > 0 && (await closeButton.isVisible().catch(() => false))) {
    await closeButton.click({ timeout: timeoutMs }).catch(() => undefined);
    await page.waitForTimeout(400);
  }

  const checkoutUrl = new URL("/checkout/", page.url()).href;
  await page.goto(checkoutUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
  await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
  return { ok: true, strategy: "guest-modal-bypassed-via-checkout-url" };
}

export async function isProductDetailPage(page: Page): Promise<boolean> {
  if (/\/product\//i.test(page.url())) {
    return true;
  }
  const pdpRoot = page.locator(PDP_QTY_ROOT).first();
  return (await pdpRoot.count()) > 0 && (await pdpRoot.isVisible());
}

export function isCartPageUrl(url: string): boolean {
  return /\/checkout\/cart/i.test(url);
}

export function isOnPaymentStep(url: string): boolean {
  const lower = url.toLowerCase();
  return /#payment|checkout\/#payment|\/checkout\/index\/index\/#payment/i.test(lower);
}

export function isOnShippingStep(url: string): boolean {
  const lower = url.toLowerCase();
  if (isCartPageUrl(lower)) {
    return false;
  }
  if (/#shipping/i.test(lower)) {
    return true;
  }
  if (/\/checkout(\/index)?\/?$/i.test(lower) || /\/checkout(\/index)?\/\?/i.test(lower)) {
    return true;
  }
  return false;
}

export function isCheckoutFlowUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return /checkout|\/cart|autoshipconsolidation/i.test(lower);
}

const SHIPPING_STEP_SELECTORS = [
  "#checkout-step-shipping",
  "#shipping",
  ".checkout-shipping-address",
  "#checkout-shipping-method-load",
  "[data-role='opc-shipping-method']",
];

const PAYMENT_STEP_SELECTORS = [
  "#checkout-step-payment",
  "#payment",
  ".checkout-payment-method",
  "#checkout-payment-method-load",
  "[data-role='opc-payment-methods']",
];

export async function isShippingStepVisible(page: Page): Promise<boolean> {
  for (const selector of SHIPPING_STEP_SELECTORS) {
    const target = page.locator(selector).first();
    if ((await target.count()) > 0 && (await target.isVisible())) {
      return true;
    }
  }
  return false;
}

export async function isPaymentStepVisible(page: Page): Promise<boolean> {
  if (isOnPaymentStep(page.url())) {
    return true;
  }
  for (const selector of PAYMENT_STEP_SELECTORS) {
    const target = page.locator(selector).first();
    if ((await target.count()) > 0 && (await target.isVisible())) {
      return true;
    }
  }
  return false;
}

export async function waitForCheckoutShippingStep(
  page: Page,
  timeoutMs: number
): Promise<boolean> {
  try {
    await page.waitForURL(/checkout.*(#shipping|$)|checkout\/index/i, {
      timeout: Math.min(timeoutMs, 20_000),
    });
  } catch {
    // Hash-only navigation may not trigger waitForURL; fall through to DOM wait.
  }

  for (const selector of SHIPPING_STEP_SELECTORS) {
    const visible = await page
      .locator(selector)
      .first()
      .waitFor({ state: "visible", timeout: Math.min(timeoutMs, 15_000) })
      .then(() => true)
      .catch(() => false);
    if (visible) {
      return true;
    }
  }

  if (isOnShippingStep(page.url()) && !isCartPageUrl(page.url())) {
    return true;
  }

  try {
    const shippingUrl = new URL("/checkout/#shipping", page.url()).href;
    await page.goto(shippingUrl, { waitUntil: "domcontentloaded", timeout: Math.min(timeoutMs, 15_000) });
    await page.waitForTimeout(800);
    return (await isShippingStepVisible(page)) || isOnShippingStep(page.url());
  } catch {
    return false;
  }
}

export async function waitForCheckoutPaymentStep(
  page: Page,
  timeoutMs: number
): Promise<boolean> {
  try {
    await page.waitForURL(/#payment/i, { timeout: Math.min(timeoutMs, 20_000) });
  } catch {
    // Continue with DOM-based detection.
  }

  for (const selector of PAYMENT_STEP_SELECTORS) {
    const visible = await page
      .locator(selector)
      .first()
      .waitFor({ state: "visible", timeout: Math.min(timeoutMs, 15_000) })
      .then(() => true)
      .catch(() => false);
    if (visible) {
      return true;
    }
  }

  if (isOnPaymentStep(page.url())) {
    return true;
  }

  try {
    const paymentUrl = new URL("/checkout/#payment", page.url()).href;
    await page.goto(paymentUrl, { waitUntil: "domcontentloaded", timeout: Math.min(timeoutMs, 15_000) });
    await page.waitForTimeout(800);
    return (await isPaymentStepVisible(page)) || isOnPaymentStep(page.url());
  } catch {
    return false;
  }
}

export async function ensureCheckoutShippingStep(
  page: Page,
  timeoutMs: number
): Promise<boolean> {
  if ((await isPaymentStepVisible(page)) || isOnPaymentStep(page.url())) {
    return true;
  }
  if ((await isShippingStepVisible(page)) || isOnShippingStep(page.url())) {
    await dismissCheckoutBlockingModals(page, Math.min(timeoutMs, 8_000));
    return true;
  }
  if (isCartPageUrl(page.url())) {
    const proceed = await tryProceedToCheckout(page, timeoutMs);
    if (!proceed.ok) {
      return false;
    }
    await dismissCheckoutBlockingModals(page, Math.min(timeoutMs, 10_000));
    return (
      (await waitForCheckoutShippingStep(page, Math.min(timeoutMs, 10_000))) ||
      (await isShippingStepVisible(page)) ||
      isOnShippingStep(page.url())
    );
  }
  if (/checkout/i.test(page.url())) {
    if ((await isPaymentStepVisible(page)) || isOnPaymentStep(page.url())) {
      return true;
    }
    const onShipping = await waitForCheckoutShippingStep(page, timeoutMs);
    if (onShipping) {
      await dismissCheckoutBlockingModals(page, Math.min(timeoutMs, 8_000));
    }
    return onShipping;
  }
  return false;
}

export async function ensureCheckoutPaymentStep(
  page: Page,
  timeoutMs: number
): Promise<boolean> {
  if ((await isPaymentStepVisible(page)) || isOnPaymentStep(page.url())) {
    return true;
  }
  if (isAutoshipInterstitialPage(page.url()) || (await isAutoshipStepActive(page))) {
    const dismissed = await tryDismissAutoshipModal(page, timeoutMs);
    if (dismissed.ok) {
      return waitForCheckoutPaymentStep(page, timeoutMs);
    }
    return false;
  }
  if (isCartPageUrl(page.url()) || (await isShippingStepVisible(page)) || isOnShippingStep(page.url())) {
    const onShipping = await ensureCheckoutShippingStep(page, timeoutMs);
    if (!onShipping) {
      return false;
    }
    const next = await tryClickCheckoutNext(page, timeoutMs, { closePopupAfter: true });
    if (next.ok) {
      return waitForCheckoutPaymentStep(page, timeoutMs);
    }
  }
  if (/checkout/i.test(page.url())) {
    return waitForCheckoutPaymentStep(page, timeoutMs);
  }
  return false;
}

export async function tryCloseCheckoutPopup(
  page: Page,
  timeoutMs: number
): Promise<{ ok: boolean; locator?: string; strategy?: string; skipped?: boolean }> {
  const modal = page
    .locator(".modal-popup._show, .modal-popup[style*='display: block'], [role='dialog']:visible, .popup-autoshow")
    .first();
  const modalVisible = (await modal.count()) > 0 && (await modal.isVisible().catch(() => false));

  const closeSelectors = [
    ".modal-popup._show .action-close",
    ".modal-popup .action-close",
    "button.action-close",
    "[data-role='closeBtn']",
    "button[aria-label='Close']",
    "button[title='Close']",
  ];
  for (const selector of closeSelectors) {
    const target = page.locator(selector).first();
    if ((await target.count()) > 0 && (await target.isVisible())) {
      await target.click({ timeout: timeoutMs }).catch(() => undefined);
      await page.waitForTimeout(400);
      return { ok: true, locator: selector, strategy: "modal-close" };
    }
  }

  for (const label of [/close/i, /no thanks/i, /continue/i, /got it/i, /dismiss/i]) {
    const button = page.getByRole("button", { name: label }).first();
    if ((await button.count()) > 0 && (await button.isVisible())) {
      await button.click({ timeout: timeoutMs }).catch(() => undefined);
      return { ok: true, locator: `role=button[name~=${label.source}]`, strategy: "modal-dismiss" };
    }
  }

  if (!modalVisible) {
    return { ok: true, skipped: true, strategy: "no-popup" };
  }
  return { ok: false };
}

export async function focusHeaderSearchField(
  page: Page,
  timeoutMs: number
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  for (const selector of HEADER_SEARCH_SELECTORS) {
    const target = page.locator(selector).first();
    if ((await target.count()) > 0 && (await target.isVisible()) && (await target.isEnabled())) {
      await target.click({ timeout: timeoutMs }).catch(() => undefined);
      await target.focus().catch(() => undefined);
      return { ok: true, locator: selector, strategy: "header-search-focus" };
    }
  }
  return { ok: false };
}

export async function isVisibleAndEditable(
  page: Page,
  locator: ReturnType<Page["locator"]>
): Promise<boolean> {
  if ((await locator.count()) === 0) {
    return false;
  }
  const target = locator.first();
  if (!(await target.isVisible()) || !(await target.isEnabled())) {
    return false;
  }
  const tag = await target.evaluate((el) => el.tagName.toLowerCase()).catch(() => "");
  return tag === "input" || tag === "select" || tag === "textarea";
}

export async function fillVisibleInputByHeuristics(
  page: Page,
  tokens: string[],
  value: string
): Promise<boolean> {
  const tokenRegex = new RegExp(tokens.join("|"), "i");
  const inputs = page.locator(
    "input:not([type='hidden']):not([type='submit']):not([type='button']), textarea"
  );
  const count = Math.min(await inputs.count(), 80);
  for (let i = 0; i < count; i += 1) {
    const element = inputs.nth(i);
    if (!(await element.isVisible()) || !(await element.isEnabled())) {
      continue;
    }
    const id = (await element.getAttribute("id")) ?? "";
    const name = (await element.getAttribute("name")) ?? "";
    const placeholder = (await element.getAttribute("placeholder")) ?? "";
    const type = (await element.getAttribute("type")) ?? "";
    const descriptor = `${id} ${name} ${placeholder} ${type}`;
    if (LOGIN_FIELD_PATTERN.test(descriptor)) {
      continue;
    }
    if (SEARCH_FIELD_PATTERN.test(descriptor) || type === "search") {
      continue;
    }
    if (GIFT_PROMO_FIELD_PATTERN.test(descriptor)) {
      continue;
    }
    const inHeaderOrSearch = await element
      .evaluate(
        (el) =>
          !!el.closest(
            "header, .header, .page-header, .block-search, .field.search, .minicart, .modal-popup"
          )
      )
      .catch(() => false);
    if (inHeaderOrSearch) {
      continue;
    }
    if (!tokenRegex.test(descriptor)) {
      continue;
    }
    await element.fill(value);
    return true;
  }
  return false;
}

async function setQtyInputValue(
  target: ReturnType<Page["locator"]>,
  quantity: string
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  const tag = await target.evaluate((el) => el.tagName.toLowerCase());
  if (tag === "select") {
    const options = target.locator("option");
    const optionCount = await options.count();
    for (let o = 0; o < optionCount; o += 1) {
      const option = options.nth(o);
      const value = (await option.getAttribute("value")) ?? "";
      if (value === quantity || (quantity === "1" && value && value !== "0")) {
        await target.selectOption(value);
        return { ok: true, strategy: "select-option" };
      }
    }
    for (let o = 0; o < optionCount; o += 1) {
      const option = options.nth(o);
      const value = (await option.getAttribute("value")) ?? "";
      if (value && value !== "0") {
        await target.selectOption(value);
        return { ok: true, strategy: "select-option" };
      }
    }
    return { ok: false };
  }

  await target.click().catch(() => undefined);
  await target.fill(quantity);
  await target.press("Tab").catch(() => undefined);
  const current = await target.inputValue().catch(() => quantity);
  if (current === quantity || (current && current !== "0")) {
    return { ok: true, strategy: "input-fill" };
  }
  return { ok: false };
}

async function tryAdjustQtyWithStepper(
  page: Page,
  quantity: string
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  const targetQty = Math.max(1, parseInt(quantity, 10) || 1);
  const pdpRoot = page.locator(PDP_QTY_ROOT).first();
  const qtyInput = pdpRoot.locator("input#qty, input[name='qty'], input.qty, [role='spinbutton']").first();
  if ((await qtyInput.count()) > 0 && (await qtyInput.isVisible().catch(() => false))) {
    const currentValue = parseInt((await qtyInput.inputValue().catch(() => "1")) || "1", 10) || 1;
    if (currentValue === targetQty) {
      return { ok: true, locator: "qty-input-default", strategy: "qty-already-set" };
    }
    if (await qtyInput.isEditable().catch(() => false)) {
      const filled = await setQtyInputValue(qtyInput, quantity);
      if (filled.ok) {
        return { ok: true, locator: "qty-input", strategy: filled.strategy ?? "input-fill" };
      }
    }
  }

  if (targetQty <= 1) {
    return { ok: true, strategy: "qty-default-one" };
  }

  const plusSelectors = [
    ".qty-increase",
    "button.increase",
    "button.increment",
    ".btn-plus",
    "a.plus",
    "[data-role='increase-qty']",
    ".qty-button-plus",
    ".control.qty .plus",
    ".field.qty .plus",
  ];
  for (const selector of plusSelectors) {
    const plus = pdpRoot.locator(selector).first();
    if ((await plus.count()) === 0 || !(await plus.isVisible().catch(() => false))) {
      continue;
    }
    const current = parseInt((await qtyInput.inputValue().catch(() => "1")) || "1", 10) || 1;
    for (let i = current; i < targetQty; i += 1) {
      await plus.click({ timeout: 5_000 }).catch(() => undefined);
      await page.waitForTimeout(250);
    }
    return { ok: true, locator: selector, strategy: "qty-stepper-plus" };
  }

  if (targetQty === 1) {
    return { ok: true, strategy: "qty-default-one" };
  }
  return { ok: false, strategy: "qty-stepper-not-found" };
}

export async function trySelectQuantity(
  page: Page,
  quantity = "1"
): Promise<{
  ok: boolean;
  locator?: string;
  strategy?: string;
}> {
  if (isCartPageUrl(page.url())) {
    return { ok: false };
  }
  if (!(await isProductDetailPage(page))) {
    return { ok: false };
  }

  const pdpRoot = page.locator(PDP_QTY_ROOT).first();
  for (const relativeSelector of PDP_QTY_INPUT_SELECTORS) {
    const target = pdpRoot.locator(relativeSelector).first();
    if (!(await isVisibleAndEditable(page, target))) {
      continue;
    }
    const inMiniCart = await target
      .evaluate((el) => !!el.closest(".minicart, .block-minicart, [data-block='minicart']"))
      .catch(() => false);
    if (inMiniCart) {
      continue;
    }
    const result = await setQtyInputValue(target, quantity);
    if (result.ok) {
      return { ok: true, locator: `pdp ${relativeSelector}`, strategy: result.strategy ?? "input-fill" };
    }
  }

  const globalQty = page.locator("#qty, input[name='qty']").first();
  if ((await globalQty.count()) > 0 && (await isVisibleAndEditable(page, globalQty))) {
    const inMiniCart = await globalQty
      .evaluate((el) => !!el.closest(".minicart, .block-minicart, [data-block='minicart']"))
      .catch(() => false);
    if (!inMiniCart) {
      const result = await setQtyInputValue(globalQty, quantity);
      if (result.ok) {
        return { ok: true, locator: "#qty", strategy: result.strategy ?? "input-fill" };
      }
    }
  }

  const byLabel = pdpRoot.getByLabel(/qty|quantity/i).first();
  if ((await byLabel.count()) > 0 && (await byLabel.isVisible())) {
    const result = await setQtyInputValue(byLabel, quantity);
    if (result.ok) {
      return { ok: true, locator: "pdp-label~=qty", strategy: result.strategy ?? "label-qty" };
    }
  }

  const boxSelects = pdpRoot.locator("select").or(
    page.locator(".product-options-wrapper select, #product-options-wrapper select")
  );
  const boxCount = Math.min(await boxSelects.count(), 20);
  for (let i = 0; i < boxCount; i += 1) {
    const select = boxSelects.nth(i);
    if (!(await select.isVisible())) {
      continue;
    }
    const descriptor = `${(await select.getAttribute("name")) ?? ""} ${(await select.getAttribute("id")) ?? ""} ${(await select.getAttribute("class")) ?? ""} ${(await select.getAttribute("data-role")) ?? ""}`.toLowerCase();
    if (/limiter|product_list_limit|page-size|show per page/i.test(descriptor)) {
      continue;
    }
    if (!/(^|\b)(qty|quantity)(\b|$)/i.test(descriptor)) {
      continue;
    }
    const result = await setQtyInputValue(select, quantity);
    if (result.ok) {
      return { ok: true, locator: "product-form-select", strategy: result.strategy ?? "product-select" };
    }
  }

  const stepperResult = await tryAdjustQtyWithStepper(page, quantity);
  if (stepperResult.ok) {
    return stepperResult;
  }

  if (quantity === "1") {
    return { ok: true, strategy: "qty-default-one" };
  }

  return { ok: false };
}

export async function prepareProductPageForAddToCart(
  page: Page,
  logs: string[],
  quantity = "1"
): Promise<boolean> {
  if (!(await isProductDetailPage(page))) {
    logs.push("Not on product detail page; skipped PDP preparation.");
    return false;
  }

  let acted = false;
  const optionSelects = page.locator(
    "select.super-attribute-select, .product-options-wrapper select, #product-options-wrapper select, .product-add-form select[required], select[name*='super_attribute' i]"
  );
  const selectCount = Math.min(await optionSelects.count(), 15);
  for (let i = 0; i < selectCount; i += 1) {
    const select = optionSelects.nth(i);
    if (!(await select.isVisible())) {
      continue;
    }
    const current = await select.inputValue().catch(() => "");
    if (current && current !== "0") {
      continue;
    }
    const options = select.locator("option");
    const optionCount = await options.count();
    for (let o = 0; o < optionCount; o += 1) {
      const option = options.nth(o);
      const value = (await option.getAttribute("value")) ?? "";
      if (value && value !== "0") {
        await select.selectOption(value);
        logs.push(`Selected required product option value "${value}".`);
        acted = true;
        await page.waitForTimeout(400);
        break;
      }
    }
  }

  const qtyResult = await trySelectQuantity(page, quantity);
  if (qtyResult.ok) {
    logs.push(`Quantity set to ${quantity} via ${qtyResult.strategy ?? "qty"}.`);
    acted = true;
  } else {
    logs.push("Quantity control not found; continuing with default quantity of 1.");
  }

  const requiredBoxes = page.locator(
    ".product-add-form input[required][type='checkbox']:not(:checked), .box-tocart input[required][type='checkbox']:not(:checked)"
  );
  const boxCount = Math.min(await requiredBoxes.count(), 10);
  for (let i = 0; i < boxCount; i += 1) {
    const box = requiredBoxes.nth(i);
    if (await box.isVisible()) {
      await box.check().catch(() => undefined);
      logs.push("Checked required product checkbox.");
      acted = true;
    }
  }

  return acted;
}

export async function tryBuyOnceOptional(
  page: Page,
  timeoutMs: number
): Promise<{ ok: boolean; skipped?: boolean; locator?: string; strategy?: string }> {
  const byRole = page.getByRole("checkbox", { name: /buy once|one time|one-time/i }).first();
  if ((await byRole.count()) > 0 && (await byRole.isVisible())) {
    await byRole.check({ timeout: timeoutMs }).catch(() => byRole.click({ timeout: timeoutMs }));
    return { ok: true, locator: "role=checkbox[name~=buy once]", strategy: "buy-once-role" };
  }

  const label = page.locator("label").filter({ hasText: /buy once|one time|one-time/i }).first();
  if ((await label.count()) > 0 && (await label.isVisible())) {
    const nested = label.locator("input[type='checkbox']").first();
    if ((await nested.count()) > 0) {
      await nested.check({ timeout: timeoutMs }).catch(() => label.click({ timeout: timeoutMs }));
    } else {
      await label.click({ timeout: timeoutMs });
    }
    return { ok: true, locator: "label:has-text('buy once')", strategy: "buy-once-label" };
  }

  const buySelectors = [
    "input[type='checkbox'][name*='buy' i]",
    "input[type='checkbox'][id*='buy' i]",
  ];
  for (const selector of buySelectors) {
    const target = page.locator(selector).first();
    if ((await target.count()) > 0 && (await target.isVisible())) {
      await target.check({ timeout: timeoutMs }).catch(() => target.click({ timeout: timeoutMs }));
      return { ok: true, locator: selector, strategy: "buy-once-css" };
    }
  }

  return { ok: false, skipped: true };
}

export async function tryClickAddToCart(
  page: Page,
  timeoutMs: number
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  if (!(await isProductDetailPage(page))) {
    return { ok: false };
  }

  for (const selector of ADD_TO_CART_SELECTORS) {
    const target = page.locator(selector).first();
    if ((await target.count()) > 0 && (await target.isVisible()) && (await target.isEnabled())) {
      await target.click({ timeout: timeoutMs });
      await page
        .locator(".message-success, .success.message, [data-ui-id='message-success']")
        .first()
        .waitFor({ state: "visible", timeout: Math.min(timeoutMs, 8_000) })
        .catch(() => undefined);
      return { ok: true, locator: selector, strategy: "pdp-add-to-cart" };
    }
  }

  const byRole = page.getByRole("button", { name: /add to cart|add to bag/i }).first();
  if ((await byRole.count()) > 0 && (await byRole.isVisible()) && (await byRole.isEnabled())) {
    const inPdp = await byRole
      .evaluate(
        (el) =>
          !!el.closest(
            ".box-tocart, .product-add-form, form#product_addtocart_form, [data-role='tocart-form']"
          )
      )
      .catch(() => false);
    if (inPdp) {
      await byRole.click({ timeout: timeoutMs });
      return { ok: true, locator: "role=button[name~=add to cart]", strategy: "pdp-add-to-cart-role" };
    }
  }

  return { ok: false };
}

export async function tryProceedToCheckout(
  page: Page,
  timeoutMs: number,
  options?: {
    preferAuthenticated?: boolean;
    loginEmail?: string;
    loginPassword?: string;
  }
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  if ((await isPaymentStepVisible(page)) || isOnPaymentStep(page.url())) {
    return { ok: true, strategy: "already-on-payment" };
  }
  if ((await isShippingStepVisible(page)) || isOnShippingStep(page.url())) {
    return { ok: true, strategy: "already-on-shipping" };
  }

  const preferAuthenticated =
    options?.preferAuthenticated === true || (await isCustomerLoggedIn(page));

  if (preferAuthenticated) {
    const checkoutUrl = new URL("/checkout/", page.url()).href;
    await page
      .goto(checkoutUrl, { waitUntil: "domcontentloaded", timeout: Math.min(timeoutMs, 20_000) })
      .catch(() => undefined);
    await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
    if (await waitForCheckoutShippingStep(page, Math.min(timeoutMs, 18_000))) {
      await dismissCheckoutBlockingModals(page, Math.min(timeoutMs, 10_000));
      return { ok: true, strategy: "authenticated-direct-checkout" };
    }
  }

  const url = page.url();
  if (!isCartPageUrl(url)) {
    const cartUrl = new URL("/checkout/cart", url).href;
    await page.goto(cartUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
  }

  await clearBlockingCartModals(page, timeoutMs);
  await dismissCheckoutBlockingModals(page, Math.min(timeoutMs, 8_000));

  let clicked: { ok: boolean; locator?: string; strategy?: string } = { ok: false };
  const selectors = [
    "button[data-role='proceed-to-checkout']",
    ".action.primary.checkout",
    "button.checkout",
    "a.action.primary.checkout",
  ];
  for (const selector of selectors) {
    const target = page.locator(selector).first();
    if ((await target.count()) > 0 && (await target.isVisible()) && (await target.isEnabled())) {
      await Promise.all([
        page
          .waitForURL(/checkout(?!\/cart)/i, { timeout: Math.min(timeoutMs, 20_000) })
          .catch(() => undefined),
        target.click({ timeout: timeoutMs }).catch(() => target.click({ timeout: timeoutMs, force: true })),
      ]);
      clicked = { ok: true, locator: selector, strategy: "proceed-to-checkout-css" };
      break;
    }
  }

  if (!clicked.ok) {
    const byRole = page.getByRole("button", { name: /proceed to checkout/i }).first();
    if ((await byRole.count()) > 0 && (await byRole.isVisible()) && (await byRole.isEnabled())) {
      await Promise.all([
        page
          .waitForURL(/checkout(?!\/cart)/i, { timeout: Math.min(timeoutMs, 20_000) })
          .catch(() => undefined),
        byRole.click({ timeout: timeoutMs }),
      ]);
      clicked = {
        ok: true,
        locator: "role=button[name~=proceed to checkout]",
        strategy: "proceed-to-checkout-role",
      };
    }
  }

  if (!clicked.ok) {
    await dismissCheckoutBlockingModals(page, Math.min(timeoutMs, 8_000));
    const checkoutUrl = new URL("/checkout/#shipping", page.url()).href;
    await page.goto(checkoutUrl, { waitUntil: "domcontentloaded", timeout: Math.min(timeoutMs, 12_000) }).catch(() => undefined);
    if (await waitForCheckoutShippingStep(page, Math.min(timeoutMs, 10_000))) {
      await dismissCheckoutBlockingModals(page, Math.min(timeoutMs, 10_000));
      return { ok: true, strategy: "direct-shipping-url-fallback" };
    }
    return { ok: false };
  }

  await page.waitForTimeout(400);
  if (preferAuthenticated && (await isGuestCheckoutModalVisible(page))) {
    await tryHandleGuestCheckoutModalForAuthenticatedUser(page, timeoutMs, {
      loginEmail: options?.loginEmail,
      loginPassword: options?.loginPassword,
    });
  }

  let arrived = await waitForCheckoutShippingStep(page, Math.min(timeoutMs, 12_000));
  if (!arrived && isCartPageUrl(page.url())) {
    await dismissCheckoutBlockingModals(page, Math.min(timeoutMs, 8_000));
    const checkoutUrl = new URL("/checkout/#shipping", page.url()).href;
    await page.goto(checkoutUrl, { waitUntil: "domcontentloaded", timeout: Math.min(timeoutMs, 12_000) }).catch(() => undefined);
    arrived = await waitForCheckoutShippingStep(page, Math.min(timeoutMs, 10_000));
  }
  if (arrived) {
    await dismissCheckoutBlockingModals(page, Math.min(timeoutMs, 10_000));
  }

  return {
    ok: arrived,
    locator: clicked.locator,
    strategy: arrived ? clicked.strategy : "proceed-click-no-navigation",
  };
}

export async function tryClickCheckoutNext(
  page: Page,
  timeoutMs: number,
  options: { closePopupAfter?: boolean } = {}
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  const { closePopupAfter = true } = options;
  if ((await isPaymentStepVisible(page)) || isOnPaymentStep(page.url())) {
    return { ok: true, strategy: "already-on-payment" };
  }

  const ready = await ensureCheckoutShippingStep(page, Math.min(timeoutMs, 15_000));
  if (!ready) {
    return { ok: false, strategy: "shipping-step-not-ready" };
  }

  await page
    .locator(
      "button.action.continue.primary, .button.action.continue.primary, #shipping-method-buttons-container .action.continue, button[data-role='opc-continue']"
    )
    .first()
    .waitFor({ state: "visible", timeout: Math.min(timeoutMs, 20_000) })
    .catch(() => undefined);

  const shippingNextSelectors = [
    "#shipping button.action.continue.primary",
    "#checkout-step-shipping button.action.continue",
    "#shipping-method-buttons-container .action.continue",
    "#shipping-method-buttons-container button",
    ".checkout-shipping-method .action.continue",
    "#checkout-shipping-method-load .action.continue",
    "button[data-role='opc-continue']",
    "button.action.continue.primary",
    ".button.action.continue.primary",
    ".button.action.continue",
  ];

  const clickShippingContinue = async (
    target: ReturnType<Page["locator"]>,
    locatorLabel: string,
    strategy: string
  ): Promise<{ ok: boolean; locator?: string; strategy?: string }> => {
    await dismissCheckoutBlockingModals(page, Math.min(timeoutMs, 8_000));
    await target.scrollIntoViewIfNeeded().catch(() => undefined);
    try {
      await target.click({ timeout: Math.min(timeoutMs, 10_000) });
    } catch {
      await target.click({ timeout: Math.min(timeoutMs, 10_000), force: true }).catch(() => undefined);
    }

    await page
      .locator(`${AUTOSHIP_MODAL_FOOTER_KEEP}, ${AUTOSHIP_IFRAME_SELECTOR}`)
      .first()
      .waitFor({ state: "visible", timeout: Math.min(timeoutMs, 15_000) })
      .catch(() => undefined);
    await page
      .waitForURL(/#payment|checkout\/index\/index/i, {
        timeout: 2_000,
        waitUntil: "domcontentloaded",
      })
      .catch(() => undefined);

    const autoshipDismiss = await tryDismissAutoshipModal(page, Math.min(timeoutMs, 15_000));
    if (!autoshipDismiss.ok && !autoshipDismiss.skipped) {
      return { ok: false, locator: locatorLabel, strategy: "autoship-modal-not-dismissed" };
    }

    const paymentDeadline = Date.now() + Math.min(timeoutMs, 15_000);
    while (Date.now() < paymentDeadline) {
      if ((await isAutoshipStepActive(page)) || (await isKeepAsScheduledButtonVisible(page))) {
        const retry = await tryDismissAutoshipModal(page, 5_000);
        if (!retry.ok && !retry.skipped) {
          return { ok: false, locator: locatorLabel, strategy: "autoship-step-not-completed" };
        }
      }
      if ((await isPaymentStepVisible(page)) || isOnPaymentStep(page.url())) {
        break;
      }
      await page.waitForTimeout(AUTOSHIP_POLL_MS);
    }

    await waitForCheckoutPaymentStep(page, Math.min(timeoutMs, 8_000)).catch(() => undefined);
    if (closePopupAfter) {
      await tryCloseCheckoutPopup(page, Math.min(timeoutMs, 5_000));
    }
    if ((await isPaymentStepVisible(page)) || isOnPaymentStep(page.url())) {
      return { ok: true, locator: locatorLabel, strategy };
    }
    return { ok: false, locator: locatorLabel, strategy: "checkout-next-no-payment" };
  };

  for (const selector of shippingNextSelectors) {
    const target = page.locator(selector).first();
    if ((await target.count()) > 0 && (await target.isVisible()) && (await target.isEnabled())) {
      return clickShippingContinue(target, selector, "checkout-next-css");
    }
  }

  const nextTerms = ["next", "continue"];
  for (const term of nextTerms) {
    const button = page.getByRole("button", { name: new RegExp(`^${term}$`, "i") }).first();
    if ((await button.count()) > 0 && (await button.isVisible()) && (await button.isEnabled())) {
      return clickShippingContinue(button, `role=button[name~=${term}]`, "checkout-next-role");
    }
  }

  return { ok: false, strategy: "checkout-next-button-not-found" };
}

export async function trySelectDefaultBillingAddress(
  page: Page,
  timeoutMs: number
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  const ready = await ensureCheckoutPaymentStep(page, timeoutMs);
  if (!ready) {
    return { ok: false };
  }

  const sameAsShipping = page.locator(
    "input[name='billing-address-same-as-shipping'], #billing-address-same-as-shipping, input[id*='same-as-shipping' i]"
  );
  if ((await sameAsShipping.count()) > 0 && (await sameAsShipping.first().isVisible())) {
    await sameAsShipping.first().check({ timeout: timeoutMs }).catch(() => undefined);
    return { ok: true, locator: "billing-same-as-shipping", strategy: "billing-checkbox" };
  }

  const billingRadios = page.locator(
    "input[type='radio'][name*='billing' i], input[type='radio'][id*='billing' i], .billing-address-item input[type='radio']"
  );
  const radioCount = Math.min(await billingRadios.count(), 10);
  for (let i = 0; i < radioCount; i += 1) {
    const radio = billingRadios.nth(i);
    if (await radio.isVisible()) {
      await radio.check({ timeout: timeoutMs }).catch(() => undefined);
      return { ok: true, locator: "billing-address-radio", strategy: "billing-radio" };
    }
  }

  const byText = page.getByText(/same as shipping|use default|default address|my billing/i).first();
  if ((await byText.count()) > 0 && (await byText.isVisible())) {
    await byText.click({ timeout: timeoutMs });
    return { ok: true, locator: "text~=default billing", strategy: "billing-text" };
  }

  return { ok: false };
}

export async function hasSelectedShippingAddress(page: Page): Promise<boolean> {
  const selected = page.locator(
    ".shipping-address-item.selected-item, .shipping-address-items .selected, input[name='shipping_address_id']:checked, [data-bind*='selectedAddress']"
  );
  if ((await selected.count()) > 0) {
    return true;
  }
  const body = (await page.locator("body").innerText()).toLowerCase();
  return /shipping address|deliver to|ship to/i.test(body);
}

export interface CheckoutAddressData {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export function buildUsTestAddress(parsed?: {
  address?: Partial<CheckoutAddressData>;
}): CheckoutAddressData {
  return {
    name: parsed?.address?.name ?? "QA Test User",
    street: parsed?.address?.street ?? "123 Main Street",
    city: parsed?.address?.city ?? "New York",
    state: parsed?.address?.state ?? "NY",
    zip: parsed?.address?.zip ?? "10001",
    country: parsed?.address?.country ?? "United States",
    phone: parsed?.address?.phone ?? "+12125551234",
  };
}

export async function hasCheckoutAddressOnFile(page: Page): Promise<boolean> {
  if (await hasSelectedShippingAddress(page)) {
    return true;
  }

  const savedAddresses = page.locator(
    ".shipping-address-item:not(.new-address), .billing-address-item:not(.new-address), .address-item.selected-item"
  );
  const savedCount = Math.min(await savedAddresses.count(), 10);
  for (let i = 0; i < savedCount; i += 1) {
    const item = savedAddresses.nth(i);
    if (!(await item.isVisible())) {
      continue;
    }
    const text = (await item.innerText()).trim();
    if (text.length > 10 && !/new address|add address|add new/i.test(text)) {
      return true;
    }
  }

  const checkoutInputs = page.locator(
    "#checkout-step-shipping input, #payment input, .checkout-shipping-address input, .billing-address-form input, .payment-method input"
  );
  const inputCount = Math.min(await checkoutInputs.count(), 40);
  for (let i = 0; i < inputCount; i += 1) {
    const input = checkoutInputs.nth(i);
    if (!(await input.isVisible())) {
      continue;
    }
    const descriptor = `${(await input.getAttribute("name")) ?? ""} ${(await input.getAttribute("id")) ?? ""} ${(await input.getAttribute("placeholder")) ?? ""}`.toLowerCase();
    if (!/(street|address|line1|city|postcode|zip|region|state)/i.test(descriptor)) {
      continue;
    }
    const value = (await input.inputValue()).trim();
    if (value.length > 3) {
      return true;
    }
  }

  return false;
}

async function fillCheckoutAddressFields(
  page: Page,
  data: CheckoutAddressData
): Promise<number> {
  const mappings: Array<[string[], string]> = [
    [["firstname", "fullname", "customername"], data.name],
    [["street", "address", "line1"], data.street],
    [["city"], data.city],
    [["region", "state", "province"], data.state],
    [["postcode", "zip", "postal"], data.zip],
    [["country"], data.country],
    [["telephone", "phone"], data.phone],
  ];

  let filled = 0;
  for (const [tokens, value] of mappings) {
    const didFill = await fillVisibleInputByHeuristics(page, tokens, value);
    if (didFill) {
      filled += 1;
    }
  }
  return filled;
}

export async function tryFillCheckoutAddressIfNeeded(
  page: Page,
  data: CheckoutAddressData,
  timeoutMs: number
): Promise<{ ok: boolean; skipped?: boolean; strategy?: string; logs: string[] }> {
  const logs: string[] = [];
  if (
    !(await isPaymentStepVisible(page)) &&
    !isOnPaymentStep(page.url()) &&
    !(await isShippingStepVisible(page))
  ) {
    await ensureCheckoutPaymentStep(page, timeoutMs).catch(() => undefined);
  }

  if (await hasCheckoutAddressOnFile(page)) {
    logs.push("Checkout address already on file; skipped optional address entry.");
    return { ok: true, skipped: true, strategy: "optional-skipped", logs };
  }

  logs.push("No checkout address detected; filling US test address into empty fields.");
  const filled = await fillCheckoutAddressFields(page, data);
  if (filled > 0) {
    logs.push(`Filled ${filled} checkout address field group(s).`);
    return { ok: true, strategy: "address-filled", logs };
  }

  logs.push("No empty checkout address fields found; treating step as not required.");
  return { ok: true, skipped: true, strategy: "optional-skipped", logs };
}

export async function tryClickKeepAsScheduled(
  page: Page,
  timeoutMs: number
): Promise<{ ok: boolean; skipped?: boolean; locator?: string; strategy?: string }> {
  const locator = AUTOSHIP_MODAL_FOOTER_KEEP_LABEL;
  const onPayment = (await isPaymentStepVisible(page)) || isOnPaymentStep(page.url());
  const modalOpen = (await isAutoshipStepActive(page)) || (await isKeepAsScheduledButtonVisible(page));

  if (!modalOpen && onPayment) {
    return { ok: true, skipped: true, strategy: "autoship-already-past-payment", locator };
  }

  const result = await tryDismissAutoshipModal(page, Math.max(timeoutMs, 10_000));
  if (result.ok && !result.skipped) {
    return {
      ok: true,
      locator,
      strategy: result.strategy ?? "keep-as-scheduled-autoship",
    };
  }

  if (result.skipped && !modalOpen) {
    return { ok: true, skipped: true, strategy: result.strategy, locator };
  }

  const stillOpen = (await isAutoshipStepActive(page)) || (await isKeepAsScheduledButtonVisible(page));
  if (!result.ok || stillOpen) {
    return {
      ok: false,
      strategy: result.strategy ?? "autoship-keep-as-scheduled-not-closed",
      locator,
    };
  }

  return { ok: true, skipped: true, strategy: result.strategy, locator };
}

export async function hasSavedPaymentMethod(page: Page): Promise<boolean> {
  if (!(await isPaymentStepVisible(page)) && !isOnPaymentStep(page.url())) {
    return false;
  }

  const paymentRoot = page.locator(PAYMENT_ROOT).first();
  const scopeLocator =
    (await paymentRoot.count()) > 0 ? paymentRoot : page.locator("#checkout, body").first();
  let paymentText = "";
  try {
    paymentText = (await scopeLocator.innerText()).toLowerCase();
  } catch {
    paymentText = "";
  }
  if (
    /ending in \d{4}|saved card|stored card|card on file|use saved|vault|•{4}|\*{4}\d{4}/i.test(
      paymentText
    )
  ) {
    return true;
  }

  const savedMethodItems = scopeLocator.locator(
    ".payment-method._active, .payment-method._active .payment-method-title, .stored-card, .saved-payment, [data-bind*='storedCards']"
  );
  const savedCount = Math.min(await savedMethodItems.count(), 8);
  for (let i = 0; i < savedCount; i += 1) {
    const item = savedMethodItems.nth(i);
    if (!(await item.isVisible())) {
      continue;
    }
    const text = (await item.innerText()).trim().toLowerCase();
    if (text.length > 4 && !/new card|add card|credit card form/i.test(text)) {
      if (/ending|saved|vault|visa|mastercard|amex|discover|\d{4}/i.test(text)) {
        return true;
      }
    }
  }

  const selectedPaymentRadio = scopeLocator.locator(
    "input[type='radio'][name*='payment' i]:checked, input[type='radio'][name*='payment_method' i]:checked"
  );
  if ((await selectedPaymentRadio.count()) > 0) {
    const labelText = await selectedPaymentRadio
      .first()
      .evaluate((node) => {
        const id = node.getAttribute("id");
        if (id) {
          const label = document.querySelector(`label[for='${id}']`);
          if (label?.textContent) {
            return label.textContent;
          }
        }
        const parent = node.closest(".payment-method, .payment-method-title, li");
        return parent?.textContent ?? "";
      })
      .catch(() => "");
    if (
      labelText &&
      /ending|saved|vault|\d{4}/i.test(labelText) &&
      !/new card|add card/i.test(labelText)
    ) {
      return true;
    }
  }

  const placeOrderButton = page
    .locator("button.action.primary.checkout, button[title='Place Order'], #place-order-trigger")
    .first();
  const cardInputs = scopeLocator.locator(
    "input[name*='card' i]:visible, input[id*='card' i]:visible, input[autocomplete='cc-number']:visible"
  );
  const visibleCardInputs = Math.min(await cardInputs.count(), 6);
  let hasEmptyCardField = false;
  for (let i = 0; i < visibleCardInputs; i += 1) {
    const input = cardInputs.nth(i);
    if (!(await input.isVisible())) {
      continue;
    }
    const value = (await input.inputValue()).trim();
    if (value.length === 0) {
      hasEmptyCardField = true;
      break;
    }
  }

  if (
    (await placeOrderButton.count()) > 0 &&
    (await placeOrderButton.isVisible()) &&
    !hasEmptyCardField &&
    visibleCardInputs === 0
  ) {
    return true;
  }

  return false;
}

export async function tryFillPaymentIfNeeded(
  page: Page,
  fillPayment: () => Promise<{ ok: boolean; logs: string[] }>
): Promise<{ ok: boolean; skipped?: boolean; strategy?: string; logs: string[] }> {
  const logs: string[] = [];
  if (await hasSavedPaymentMethod(page)) {
    logs.push("Saved payment method detected; skipped optional card entry.");
    return { ok: true, skipped: true, strategy: "optional-skipped", logs };
  }

  const result = await fillPayment();
  logs.push(...result.logs);
  if (result.ok) {
    return { ok: true, strategy: "payment-filled", logs };
  }
  return { ok: false, logs };
}

export async function tryClickMakePayment(
  page: Page,
  timeoutMs: number
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  const byRole = page.getByRole("button", { name: /make payment/i }).first();
  if ((await byRole.count()) > 0 && (await byRole.isVisible()) && (await byRole.isEnabled())) {
    await byRole.click({ timeout: timeoutMs });
    return { ok: true, locator: "role=button[name~=make payment]", strategy: "make-payment" };
  }
  const byText = page.locator("button:has-text('MAKE PAYMENT'), button:has-text('Make Payment')").first();
  if ((await byText.count()) > 0 && (await byText.isVisible()) && (await byText.isEnabled())) {
    await byText.click({ timeout: timeoutMs });
    return { ok: true, locator: "button:has-text('MAKE PAYMENT')", strategy: "make-payment-text" };
  }
  return { ok: false };
}

export async function minicartItemCount(page: Page): Promise<number> {
  const counter = page
    .locator(
      ".minicart-wrapper .counter-number, .showcart .counter.qty, .minicart .items-total, span.counter-number"
    )
    .first();
  if ((await counter.count()) === 0) {
    return 0;
  }
  const text = ((await counter.innerText().catch(() => "")) ?? "").replace(/\D/g, "");
  const value = parseInt(text, 10);
  return Number.isFinite(value) ? value : 0;
}

export async function cartOrMinicartHasItems(page: Page): Promise<boolean> {
  if (await cartHasLineItems(page)) {
    return true;
  }
  return (await minicartItemCount(page)) > 0;
}

export async function cartHasLineItems(page: Page): Promise<boolean> {
  return (await countCartLineItems(page)) > 0;
}

export function isOnCheckoutFlowUrl(url: string): boolean {
  return (
    isOnShippingStep(url) ||
    isOnPaymentStep(url) ||
    (/\/checkout(?:\/|$|[?#])/i.test(url) && !isCartPageUrl(url))
  );
}

export async function countCartLineItems(page: Page): Promise<number> {
  if (!isCartPageUrl(page.url())) {
    return 0;
  }
  const emptyMarkers = page.locator(
    ".cart-empty, .empty-cart, .cart-empty-message, :text-matches('you have no items', 'i'), :text-matches('shopping cart is empty', 'i')"
  );
  if ((await emptyMarkers.count()) > 0 && (await emptyMarkers.first().isVisible())) {
    return 0;
  }
  const cartItemRows = page.locator(
    "#shopping-cart-table tbody tr.cart.item, .cart.item[data-role='cart-item'], tbody tr[data-role='cart-item'], .cart.table-wrapper .cart.item"
  );
  const cartItemCount = await cartItemRows.count();
  if (cartItemCount > 0) {
    return cartItemCount;
  }
  const itemInfoRows = page.locator("#shopping-cart-table tbody tr.item-info");
  const itemInfoCount = await itemInfoRows.count();
  if (itemInfoCount > 0) {
    return itemInfoCount;
  }
  const skuRows = page.locator("#shopping-cart-table tbody tr").filter({
    has: page.locator(".product-item-name, .product-item-photo, .col.item"),
  });
  const skuCount = await skuRows.count();
  if (skuCount > 0) {
    return skuCount;
  }
  return 0;
}

async function tryDismissCartPromotionalPopups(page: Page, timeoutMs: number): Promise<void> {
  const blockingModal = page
    .locator(".modal-popup._show, .modal-popup[style*='display: block'], [role='dialog']:visible")
    .filter({ hasNotText: /remove all items|are you sure you want to remove/i })
    .first();

  if ((await blockingModal.count()) === 0 || !(await blockingModal.isVisible().catch(() => false))) {
    return;
  }

  const modalText = ((await blockingModal.innerText().catch(() => "")) ?? "").toLowerCase();
  const isGuestCheckoutModal = /guest checkout|checkout as guest|continue as guest|without an account/i.test(
    modalText
  );

  const closeButton = blockingModal
    .locator(".action-close, button[aria-label='Close'], button[title='Close']")
    .first();
  if ((await closeButton.count()) > 0 && (await closeButton.isVisible().catch(() => false))) {
    await closeButton.click({ timeout: timeoutMs }).catch(() => undefined);
    await page.waitForTimeout(400);
    return;
  }

  if (isGuestCheckoutModal) {
    return;
  }

  const nextButton = blockingModal.locator("button:has-text('Next')").first();
  if ((await nextButton.count()) > 0 && (await nextButton.isVisible().catch(() => false))) {
    await nextButton.click({ timeout: timeoutMs }).catch(() => undefined);
    await page.waitForTimeout(400);
  }
}

export async function isCartRemoveConfirmModalVisible(page: Page): Promise<boolean> {
  const modal = page.locator(".modal-popup._show, .modal-popup.confirm._show, .modals-wrapper .modal-popup").first();
  if ((await modal.count()) > 0 && (await modal.isVisible().catch(() => false))) {
    const text = (await modal.innerText().catch(() => "")) ?? "";
    if (/remove all items|are you sure you want to remove/i.test(text)) {
      return true;
    }
  }

  if (await page.locator(".modals-overlay").isVisible().catch(() => false)) {
    const overlayText =
      (await page.locator(".modals-wrapper, .modal-popup").first().innerText().catch(() => "")) ?? "";
    if (/remove all items|are you sure you want to remove/i.test(overlayText)) {
      return true;
    }
  }

  return false;
}

async function waitForCartRemoveConfirmModal(
  page: Page,
  timeoutMs: number
): Promise<ReturnType<Page["locator"]> | null> {
  const deadline = Date.now() + Math.min(timeoutMs, 8_000);
  while (Date.now() < deadline) {
    if (await isCartRemoveConfirmModalVisible(page)) {
      return page.locator(".modal-popup._show, .modal-popup.confirm._show").first();
    }
    await page.waitForTimeout(200);
  }
  return null;
}

async function waitForCartModalToClose(page: Page, timeoutMs: number): Promise<boolean> {
  try {
    await page.locator(".modal-popup._show").waitFor({ state: "hidden", timeout: timeoutMs });
    return true;
  } catch {
    return !(await isCartRemoveConfirmModalVisible(page));
  }
}

async function clickCartRemoveConfirmButton(
  page: Page,
  modal: ReturnType<Page["locator"]>,
  useCancel: boolean,
  timeoutMs: number
): Promise<boolean> {
  const buttonSelectors = useCancel
    ? [
        "button.action-dismiss",
        "button.action-secondary.action-dismiss",
        "button.action-secondary",
        "button[data-role='action'][data-action='close']",
        "button:has-text('CANCEL')",
        "button:has-text('Cancel')",
        "button:has-text('No')",
        "button:has-text('Keep Item')",
        "button:has-text('Keep in Cart')",
        "button:has-text('Close')",
        "button:has-text(\"Don't Remove\")",
        "button:has-text('Do not remove')",
        "span:has-text('CANCEL')",
      ]
    : [
        "button.action-accept",
        "button.action-primary.action-accept",
        "button.action-primary",
        "button[data-role='action'][data-action='accept']",
        "button:has-text('OK')",
        "button:has-text('Yes')",
        "button:has-text('Remove')",
        "button:has-text('Delete')",
        "button:has-text('Confirm')",
        "button:has-text('Remove Item')",
      ];

  for (const selector of buttonSelectors) {
    const button = modal.locator(selector).first();
    if ((await button.count()) === 0 || !(await button.isVisible().catch(() => false))) {
      continue;
    }
    try {
      await button.click({ timeout: timeoutMs });
    } catch {
      await button.click({ timeout: timeoutMs, force: true }).catch(() => undefined);
    }
    if (await waitForCartModalToClose(page, timeoutMs)) {
      return true;
    }
  }

  const pageLevelButton = page
    .locator(".modal-popup._show button, .modals-wrapper button")
    .filter({ hasText: useCancel ? /^CANCEL$|^Cancel$/i : /^OK$/i })
    .first();
  if ((await pageLevelButton.count()) > 0 && (await pageLevelButton.isVisible().catch(() => false))) {
    try {
      await pageLevelButton.click({ timeout: timeoutMs, force: true });
    } catch {
      await pageLevelButton.click({ timeout: timeoutMs, force: true }).catch(() => undefined);
    }
    if (await waitForCartModalToClose(page, timeoutMs)) {
      return true;
    }
  }

  const clickedViaScript = await page.evaluate((cancel) => {
    const root =
      document.querySelector(".modal-popup._show") ??
      document.querySelector(".modals-wrapper .modal-popup") ??
      document.querySelector("[role='dialog']");
    if (!root) {
      return false;
    }
    const candidates = root.querySelectorAll("button, a.action, span");
    for (const node of candidates) {
      const text = (node.textContent ?? "").trim();
      if (cancel ? /^cancel$/i.test(text) : /^ok$/i.test(text)) {
        (node as HTMLElement).click();
        return true;
      }
    }
    return false;
  }, useCancel);
  if (clickedViaScript) {
    await page.waitForTimeout(500);
    return waitForCartModalToClose(page, timeoutMs);
  }

  return false;
}

export async function tryHandleCartRemoveConfirmation(
  page: Page,
  lineItemCount: number,
  timeoutMs: number
): Promise<{ ok: boolean; action?: "cancel" | "ok"; strategy?: string }> {
  const modal =
    (await waitForCartRemoveConfirmModal(page, timeoutMs)) ??
    ((await isCartRemoveConfirmModalVisible(page))
      ? page.locator(".modal-popup._show").first()
      : null);

  if (!modal) {
    return { ok: true, strategy: "no-confirm-modal" };
  }

  const modalText = (await modal.innerText().catch(() => "")) ?? "";
  const useCancel =
    lineItemCount <= 1 || /remove all items from your shopping cart/i.test(modalText);
  const clicked = await clickCartRemoveConfirmButton(page, modal, useCancel, timeoutMs);

  if (!clicked) {
    return { ok: false, strategy: "cart-remove-confirm-unresolved" };
  }

  await page.locator(".modals-overlay").waitFor({ state: "hidden", timeout: timeoutMs }).catch(() => undefined);

  return {
    ok: true,
    action: useCancel ? "cancel" : "ok",
    strategy: useCancel ? "cart-remove-confirm-cancel" : "cart-remove-confirm-ok",
  };
}

async function clearBlockingCartModals(page: Page, timeoutMs: number): Promise<void> {
  if (await isCartRemoveConfirmModalVisible(page)) {
    const lineItemCount = Math.max(await countCartLineItems(page), 1);
    await tryHandleCartRemoveConfirmation(page, lineItemCount, timeoutMs);
    if (await isCartRemoveConfirmModalVisible(page)) {
      await tryHandleCartRemoveConfirmation(page, 1, timeoutMs);
    }
  }
  await tryDismissCartPromotionalPopups(page, timeoutMs);
}

export async function trySelectItemNumberOnPdp(
  page: Page,
  itemNumber: string,
  timeoutMs: number
): Promise<{ ok: boolean; strategy?: string }> {
  if (!(await isProductDetailPage(page))) {
    return { ok: false, strategy: "not-on-pdp" };
  }

  const itemPattern = new RegExp(itemNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const selectLocators = page.locator(
    "select.super-attribute-select, select[id*='attribute'], .super-attribute-select select, select[name*='super_attribute']"
  );
  const selectCount = await selectLocators.count();
  for (let i = 0; i < Math.min(selectCount, 6); i += 1) {
    const select = selectLocators.nth(i);
    if (!(await select.isVisible().catch(() => false))) {
      continue;
    }
    const options = select.locator("option");
    const optionCount = await options.count();
    for (let j = 0; j < optionCount; j += 1) {
      const text = ((await options.nth(j).innerText().catch(() => "")) ?? "").trim();
      const value = (await options.nth(j).getAttribute("value")) ?? "";
      if (itemPattern.test(text) || itemPattern.test(value)) {
        await select.selectOption({ index: j }).catch(() => select.selectOption(value));
        await page.waitForTimeout(600);
        return { ok: true, strategy: "pdp-select-option" };
      }
    }
  }

  const clickableCandidates = [
    page.locator(`[data-sku*='${itemNumber}'], [data-option-sku*='${itemNumber}']`).first(),
    page.locator("label").filter({ hasText: itemPattern }).first(),
    page.getByRole("radio", { name: itemPattern }).first(),
    page.locator(`input[type='radio'][value*='${itemNumber}']`).first(),
    page.getByText(itemPattern).first(),
    page.locator(".swatch-option, .swatch-option-link").filter({ hasText: itemPattern }).first(),
    page.locator("tr, .product-item, .choice").filter({ hasText: itemPattern }).first(),
  ];

  for (const candidate of clickableCandidates) {
    if ((await candidate.count()) === 0 || !(await candidate.isVisible().catch(() => false))) {
      continue;
    }
    await candidate.scrollIntoViewIfNeeded().catch(() => undefined);
    await candidate.click({ timeout: Math.min(timeoutMs, 10_000) }).catch(() => undefined);
    await page.waitForTimeout(600);
    return { ok: true, strategy: "pdp-item-number-click" };
  }

  return { ok: false, strategy: "pdp-item-number-not-found" };
}

export async function tryAddSecondaryCartLineFromPdp(
  page: Page,
  pdpUrl: string,
  itemNumber: string,
  timeoutMs: number
): Promise<{ ok: boolean; strategy?: string; lineItemsAfter?: number }> {
  await page.goto(pdpUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
  await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);

  const selected = await trySelectItemNumberOnPdp(page, itemNumber, timeoutMs);
  if (!selected.ok) {
    return { ok: false, strategy: selected.strategy ?? "secondary-item-select-failed" };
  }

  await tryBuyOnceOptional(page, timeoutMs);
  await prepareProductPageForAddToCart(page, []);
  const addResult = await tryClickAddToCart(page, timeoutMs);
  if (!addResult.ok) {
    return { ok: false, strategy: "secondary-line-add-to-cart-failed" };
  }

  const cartUrl = new URL("/checkout/cart", page.url()).href;
  await page.goto(cartUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
  const lineItemsAfter = await countCartLineItems(page);
  if (lineItemsAfter >= 2) {
    return { ok: true, strategy: "secondary-line-added", lineItemsAfter };
  }
  return { ok: false, strategy: "secondary-line-not-created", lineItemsAfter };
}

function cartTableLineRows(page: Page): ReturnType<Page["locator"]> {
  return page.locator(
    "#shopping-cart-table tbody tr.cart.item, .cart.item[data-role='cart-item'], tbody tr[data-role='cart-item'], .cart.table-wrapper .cart.item"
  );
}

function cartLineItemLocator(
  page: Page,
  options?: { itemNumber?: string; lineIndex?: number }
): ReturnType<Page["locator"]> {
  if (options?.itemNumber) {
    const pattern = options.itemNumber;
    return cartTableLineRows(page).filter({ hasText: new RegExp(pattern, "i") }).first();
  }
  const index = options?.lineIndex ?? 0;
  return cartTableLineRows(page).nth(index);
}

export function resolveCartMutationTarget(options?: {
  itemNumber?: string;
  lineIndex?: number;
  preferSecondaryLine?: boolean;
  secondaryItemNumber?: string;
}): { itemNumber?: string; lineIndex?: number } {
  if (options?.itemNumber) {
    return { itemNumber: options.itemNumber };
  }
  if (typeof options?.lineIndex === "number") {
    return { lineIndex: options.lineIndex };
  }
  if (options?.preferSecondaryLine && options.secondaryItemNumber) {
    return { itemNumber: options.secondaryItemNumber };
  }
  if (options?.preferSecondaryLine) {
    return { lineIndex: 1 };
  }
  return { lineIndex: 0 };
}

export async function tryUpdateCartQuantity(
  page: Page,
  quantity: string,
  timeoutMs: number,
  options?: {
    itemNumber?: string;
    lineIndex?: number;
    preferSecondaryLine?: boolean;
    secondaryItemNumber?: string;
  }
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  if (!isCartPageUrl(page.url())) {
    const cartUrl = new URL("/checkout/cart", page.url()).href;
    await page.goto(cartUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
  }

  await clearBlockingCartModals(page, timeoutMs);

  const target = resolveCartMutationTarget(options);
  let lineScope = cartLineItemLocator(page, target);
  if ((await lineScope.count()) === 0 && options?.preferSecondaryLine) {
    lineScope = cartLineItemLocator(page, { lineIndex: 0 });
  }
  let qtyInput = lineScope
    .locator("input.qty, input[name*='qty' i], input[data-role='cart-item-qty']")
    .first();

  if ((await qtyInput.count()) === 0 || !(await qtyInput.isVisible().catch(() => false))) {
    qtyInput = page
      .locator(
        ".cart.item input.qty, #shopping-cart-table input.qty, input[name*='cart'][name*='qty' i], input[data-role='cart-item-qty']"
      )
      .nth(options?.preferSecondaryLine ? 1 : 0);
  }

  if ((await qtyInput.count()) === 0 || !(await qtyInput.isVisible().catch(() => false))) {
    return { ok: false, strategy: "cart-qty-input-not-found" };
  }

  await qtyInput.click({ timeout: timeoutMs }).catch(() => undefined);
  await qtyInput.fill(quantity);
  await qtyInput.blur().catch(() => undefined);

  const updateButtonSelectors = [
    "button[name='update_cart_action']",
    "button.action.update",
    "button.update",
    "button:has-text('UPDATE SHOPPING CART')",
    "button:has-text('Update Shopping Cart')",
    "button:has-text('Update Cart')",
  ];

  for (const selector of updateButtonSelectors) {
    const updateButton = page.locator(selector).first();
    if ((await updateButton.count()) === 0 || !(await updateButton.isVisible().catch(() => false))) {
      continue;
    }
    await updateButton.scrollIntoViewIfNeeded().catch(() => undefined);
    try {
      await updateButton.click({ timeout: timeoutMs });
    } catch {
      await updateButton.click({ timeout: timeoutMs, force: true });
    }
    await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
    await page.waitForTimeout(800);
    await clearBlockingCartModals(page, Math.min(timeoutMs, 8_000));
    await dismissCheckoutBlockingModals(page, Math.min(timeoutMs, 6_000));
    return { ok: true, locator: selector, strategy: "cart-qty-update-submit" };
  }

  return { ok: false, strategy: "cart-update-button-not-found" };
}

async function clickCartRemoveViaScript(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const root =
      document.querySelector("#shopping-cart-table") ??
      document.querySelector(".cart.table-wrapper") ??
      document.body;
    const candidates = root.querySelectorAll("a, button, span");
    for (const node of candidates) {
      const element = node as HTMLElement;
      const href = element.getAttribute("href") ?? "";
      const title = element.getAttribute("title") ?? "";
      const aria = element.getAttribute("aria-label") ?? "";
      const text = (element.textContent ?? "").trim();
      const combined = `${text} ${title} ${aria} ${href}`.toLowerCase();
      if (
        /checkout\/cart\/delete|action-delete|remove item|remove from cart/.test(combined) ||
        (/^remove$/i.test(text) && !/cancel|coupon|update/i.test(combined))
      ) {
        element.click();
        return true;
      }
    }
    return false;
  });
}

async function findAndClickCartRemoveLink(
  page: Page,
  timeoutMs: number,
  lineScope?: ReturnType<Page["locator"]>
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  const root = lineScope ?? page;
  const removeSelectors = [
    "a[href*='checkout/cart/delete']",
    ".cart.item .action.action-delete",
    ".cart.item a.action.delete",
    "tr.item-info .action.action-delete",
    "a.action.action-delete[title*='Remove' i]",
    "[title='Remove item']",
    "[data-role='remove-item']",
    ".action.action-delete",
    "a.action.delete",
    "button.action-delete",
    ".cart.table-wrapper a.action.delete",
    ".cart.table-wrapper .action-delete",
    "td.col .action-delete",
    ".cart.item .actions-toolbar a.action",
    "a[data-post*='cart/delete']",
  ];

  for (const selector of removeSelectors) {
    const removeLink = root.locator(selector).first();
    if ((await removeLink.count()) === 0 || !(await removeLink.isVisible().catch(() => false))) {
      continue;
    }
    await removeLink.scrollIntoViewIfNeeded().catch(() => undefined);
    try {
      await removeLink.click({ timeout: timeoutMs });
    } catch {
      await removeLink.click({ timeout: timeoutMs, force: true });
    }
    return { ok: true, locator: selector, strategy: "cart-remove-click" };
  }

  const clickedViaScript = await clickCartRemoveViaScript(page);
  if (clickedViaScript) {
    await page.waitForTimeout(500);
    return { ok: true, locator: "cart remove script", strategy: "cart-remove-script" };
  }

  return { ok: false, strategy: "cart-remove-not-found" };
}

export interface CartRemovalResult {
  ok: boolean;
  locator?: string;
  strategy?: string;
  action?: "cancel" | "ok";
  lineItemsBefore?: number;
  lineItemsAfter?: number;
  secondItemAdded?: boolean;
  modalAppeared?: boolean;
  decisionReason?: string;
}

export async function tryEnsureSecondCartLineItem(
  page: Page,
  timeoutMs: number,
  options?: {
    productUrl?: string;
    searchQuery?: string;
    secondaryPdpUrl?: string;
    secondaryItemNumber?: string;
  }
): Promise<{ ok: boolean; strategy?: string; lineItemsAfter?: number; mergedQuantity?: boolean }> {
  if (!isCartPageUrl(page.url())) {
    const cartUrl = new URL("/checkout/cart", page.url()).href;
    await page.goto(cartUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
  }
  const before = await countCartLineItems(page);
  if (before >= 2) {
    return { ok: true, strategy: "cart-already-has-multiple-lines", lineItemsAfter: before };
  }
  if (before === 0) {
    return { ok: false, strategy: "cart-empty-cannot-add-second" };
  }

  if (options?.secondaryPdpUrl && options?.secondaryItemNumber) {
    const added = await tryAddSecondaryCartLineFromPdp(
      page,
      options.secondaryPdpUrl,
      options.secondaryItemNumber,
      timeoutMs
    );
    if (added.ok && (added.lineItemsAfter ?? 0) >= 2) {
      return { ok: true, strategy: added.strategy ?? "secondary-line-added", lineItemsAfter: added.lineItemsAfter };
    }
  }

  const productUrl = options?.productUrl;
  const searchQuery = options?.searchQuery ?? "powder";
  if (productUrl) {
    await page.goto(productUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
  } else {
    const searchInput = page.locator("#search, input[name='q']").first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill(searchQuery);
      await searchInput.press("Enter");
      await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
      const firstProduct = page.locator(".product-item-link, a.product-item-link").first();
      if ((await firstProduct.count()) > 0) {
        await firstProduct.click({ timeout: timeoutMs });
        await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
      }
    }
  }

  await tryBuyOnceOptional(page, timeoutMs);
  await trySelectQuantity(page, "1");
  const addResult = await tryClickAddToCart(page, timeoutMs);
  if (!addResult.ok) {
    return { ok: false, strategy: "second-line-add-to-cart-failed" };
  }

  const cartUrl = new URL("/checkout/cart", page.url()).href;
  await page.goto(cartUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
  const after = await countCartLineItems(page);
  if (after >= 2) {
    return { ok: true, strategy: "second-line-item-created", lineItemsAfter: after };
  }
  if (after === 1) {
    return { ok: true, strategy: "second-add-merged-quantity", lineItemsAfter: 1, mergedQuantity: true };
  }
  return { ok: false, strategy: "second-line-not-created", lineItemsAfter: after };
}

export async function tryRestoreCartIfEmpty(
  page: Page,
  timeoutMs: number,
  options?: { productUrl?: string; searchQuery?: string }
): Promise<{ ok: boolean; strategy?: string }> {
  if (await cartHasLineItems(page)) {
    return { ok: true, strategy: "cart-already-has-items" };
  }
  const productUrl = options?.productUrl;
  const searchQuery = options?.searchQuery ?? "powder";
  if (productUrl) {
    await page.goto(productUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
  } else {
    const searchInput = page.locator("#search, input[name='q']").first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill(searchQuery);
      await searchInput.press("Enter");
      await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
      const firstProduct = page.locator(".product-item-link").first();
      if ((await firstProduct.count()) > 0) {
        await firstProduct.click({ timeout: timeoutMs });
      }
    }
  }
  await tryBuyOnceOptional(page, timeoutMs);
  await tryClickAddToCart(page, timeoutMs);
  const cartUrl = new URL("/checkout/cart", page.url()).href;
  await page.goto(cartUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
  if (await cartHasLineItems(page)) {
    return { ok: true, strategy: "cart-restored-from-pdp" };
  }
  return { ok: false, strategy: "cart-restore-failed" };
}

export async function tryRemoveCartItem(
  page: Page,
  timeoutMs: number,
  options?: {
    productUrl?: string;
    searchQuery?: string;
    prepareSecondLine?: boolean;
    secondaryPdpUrl?: string;
    secondaryItemNumber?: string;
  }
): Promise<CartRemovalResult> {
  if (!isCartPageUrl(page.url())) {
    const cartUrl = new URL("/checkout/cart", page.url()).href;
    await page.goto(cartUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
  }

  await tryDismissCartPromotionalPopups(page, timeoutMs);

  let lineItemCount = await countCartLineItems(page);
  if (lineItemCount === 0) {
    return { ok: false, strategy: "cart-empty", lineItemsBefore: 0, lineItemsAfter: 0 };
  }

  let secondItemAdded = false;
  if (options?.prepareSecondLine !== false && lineItemCount === 1) {
    const second = await tryEnsureSecondCartLineItem(page, timeoutMs, options);
    secondItemAdded =
      second.strategy === "second-line-item-created" ||
      second.strategy === "secondary-line-added" ||
      second.strategy === "cart-already-has-multiple-lines";
    lineItemCount = second.lineItemsAfter ?? (await countCartLineItems(page));
  }

  const lineItemsBefore = lineItemCount;
  const mutationTarget =
    lineItemsBefore >= 2
      ? resolveCartMutationTarget({
          preferSecondaryLine: true,
          secondaryItemNumber: options?.secondaryItemNumber,
        })
      : { lineIndex: 0 };
  const targetLine = cartLineItemLocator(page, mutationTarget);

  if (await isCartRemoveConfirmModalVisible(page)) {
    const existingConfirm = await tryHandleCartRemoveConfirmation(page, lineItemsBefore, timeoutMs);
    const lineItemsAfter = await countCartLineItems(page);
    if (!existingConfirm.ok || (await isCartRemoveConfirmModalVisible(page))) {
      return {
        ok: false,
        strategy: existingConfirm.strategy ?? "cart-remove-confirm-stuck",
        lineItemsBefore,
        lineItemsAfter,
        secondItemAdded,
        modalAppeared: true,
      };
    }
    if (lineItemsBefore <= 1 && lineItemsAfter === 0) {
      return {
        ok: false,
        strategy: "cart-item-removed-instead-of-cancel",
        lineItemsBefore,
        lineItemsAfter,
        modalAppeared: true,
      };
    }
    const decisionReason =
      existingConfirm.action === "cancel"
        ? "Cart had only one line item, so removal confirmation was cancelled to preserve checkout prerequisites."
        : "Cart had multiple line items, so one item was removed safely.";
    return {
      ok: true,
      locator: "cart remove confirmation",
      strategy: existingConfirm.strategy,
      action: existingConfirm.action,
      lineItemsBefore,
      lineItemsAfter,
      secondItemAdded,
      modalAppeared: true,
      decisionReason,
    };
  }

  const removeClick = await findAndClickCartRemoveLink(
    page,
    Math.min(timeoutMs, 15_000),
    lineItemsBefore >= 2 ? targetLine : undefined
  );
  if (!removeClick.ok) {
    return {
      ok: false,
      strategy: removeClick.strategy ?? "cart-remove-not-found",
      lineItemsBefore,
      lineItemsAfter: lineItemsBefore,
      secondItemAdded,
    };
  }

  const confirmResult = await tryHandleCartRemoveConfirmation(page, lineItemsBefore, Math.min(timeoutMs, 12_000));
  let lineItemsAfter = await countCartLineItems(page);
  const modalAppeared = confirmResult.action !== undefined || confirmResult.strategy !== "no-confirm-modal";

  if (!confirmResult.ok || (await isCartRemoveConfirmModalVisible(page))) {
    return {
      ok: false,
      strategy: confirmResult.strategy ?? "cart-remove-confirm-failed",
      lineItemsBefore,
      lineItemsAfter,
      secondItemAdded,
      modalAppeared,
    };
  }

  if (lineItemsBefore <= 1 && confirmResult.strategy === "no-confirm-modal") {
    if (lineItemsAfter === 0) {
      return {
        ok: false,
        strategy: "cart-item-removed-without-modal",
        lineItemsBefore,
        lineItemsAfter,
        secondItemAdded,
      };
    }
    return {
      ok: true,
      strategy: "cart-remove-no-modal-single-item-kept",
      lineItemsBefore,
      lineItemsAfter,
      secondItemAdded,
      decisionReason: "Single cart line kept — no confirmation modal appeared.",
    };
  }

  if (lineItemsBefore <= 1 && lineItemsAfter === 0) {
    return {
      ok: false,
      strategy: "cart-item-removed-instead-of-cancel",
      lineItemsBefore,
      lineItemsAfter,
      secondItemAdded,
      modalAppeared,
    };
  }

  if (lineItemsBefore > 1 && lineItemsAfter === 0) {
    return {
      ok: false,
      strategy: "cart-emptied-unexpectedly",
      lineItemsBefore,
      lineItemsAfter,
      secondItemAdded,
      modalAppeared,
      decisionReason: "Removal emptied the entire cart instead of deleting one line item.",
    };
  }

  if (lineItemsBefore > 1 && lineItemsAfter >= lineItemsBefore) {
    return {
      ok: false,
      strategy: "cart-remove-had-no-effect",
      lineItemsBefore,
      lineItemsAfter,
      secondItemAdded,
      modalAppeared,
    };
  }

  const decisionReason =
    confirmResult.action === "cancel" || lineItemsBefore <= 1
      ? "Cart had only one line item, so removal confirmation was cancelled to preserve checkout prerequisites."
      : "Cart had multiple line items, so one item was removed safely.";

  await dismissCheckoutBlockingModals(page, Math.min(timeoutMs, 8_000));

  return {
    ok: true,
    locator: removeClick.locator ?? "cart remove action",
    strategy: confirmResult.strategy ?? removeClick.strategy ?? "cart-remove",
    action: confirmResult.action,
    lineItemsBefore,
    lineItemsAfter,
    secondItemAdded,
    modalAppeared,
    decisionReason,
  };
}

export async function tryApplyCouponIfAvailable(
  page: Page,
  timeoutMs: number
): Promise<{ ok: boolean; locator?: string; strategy?: string; skipped?: boolean }> {
  if (!isCartPageUrl(page.url())) {
    const cartUrl = new URL("/checkout/cart", page.url()).href;
    await page.goto(cartUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
  }
  const couponField = page
    .locator("#coupon_code, input[name='coupon_code'], input[placeholder*='coupon' i]")
    .first();
  if ((await couponField.count()) === 0 || !(await couponField.isVisible())) {
    return { ok: true, skipped: true, strategy: "coupon-unavailable" };
  }
  await couponField.fill("TEST10").catch(() => undefined);
  const applyButton = page.locator("button.action.apply, button:has-text('Apply')").first();
  if ((await applyButton.count()) > 0 && (await applyButton.isVisible())) {
    await applyButton.click({ timeout: timeoutMs }).catch(() => undefined);
    return { ok: true, locator: "coupon apply", strategy: "coupon-apply" };
  }
  return { ok: true, skipped: true, strategy: "coupon-field-only" };
}

async function tryApplyPriceLayeredFilter(
  page: Page,
  timeoutMs: number
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  await page
    .locator(".sidebar-main, .block.filter, .filter-options")
    .first()
    .scrollIntoViewIfNeeded()
    .catch(() => undefined);

  const priceSection = page
    .locator(".filter-options-item, .filter-options .item")
    .filter({
      has: page.locator(".filter-options-title, [data-role='title']").filter({ hasText: /^\s*price\s*$/i }),
    })
    .first();

  if ((await priceSection.count()) === 0) {
    const loosePriceTitle = page
      .locator(".filter-options-title, [data-role='title']")
      .filter({ hasText: /^\s*price\s*$/i })
      .first();
    if ((await loosePriceTitle.count()) > 0) {
      await loosePriceTitle.scrollIntoViewIfNeeded().catch(() => undefined);
    }
  }

  const resolvedSection =
    (await priceSection.count()) > 0
      ? priceSection
      : page
          .locator(".filter-options-item")
          .filter({
            has: page.locator(".filter-options-title, [data-role='title']").filter({ hasText: /price/i }),
          })
          .first();

  if ((await resolvedSection.count()) === 0) {
    const directUrl = buildPriceFilterUrl(page.url());
    if (directUrl) {
      await page.goto(directUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
      if (/price=/i.test(page.url())) {
        return { ok: true, locator: directUrl, strategy: "catalog-price-filter-direct-url" };
      }
    }
    return { ok: false, strategy: "price-filter-section-not-found" };
  }

  const title = resolvedSection.locator(".filter-options-title, [data-role='title']").first();
  const content = resolvedSection.locator(".filter-options-content, [data-role='content']").first();
  const expanded = await content.isVisible().catch(() => false);
  if (!expanded) {
    await title.click({ timeout: timeoutMs }).catch(() => undefined);
    await page.waitForTimeout(500);
  }

  const preferredPriceLink = resolvedSection
    .locator("a[href*='price=0-10'], ol.items li.item a[href*='price=']")
    .first();
  const priceLink =
    (await preferredPriceLink.count()) > 0 && (await preferredPriceLink.isVisible().catch(() => false))
      ? preferredPriceLink
      : resolvedSection.locator("ol.items a[href*='price='], .filter-options-content a[href*='price=']").first();

  if ((await priceLink.count()) === 0 || !(await priceLink.isVisible().catch(() => false))) {
    const directUrl = buildPriceFilterUrl(page.url());
    if (directUrl) {
      await page.goto(directUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
      if (/price=/i.test(page.url())) {
        return { ok: true, locator: directUrl, strategy: "catalog-price-filter-direct-url" };
      }
    }
    return { ok: false, strategy: "price-filter-link-not-found" };
  }

  const href = (await priceLink.getAttribute("href")) ?? "";
  const urlBefore = page.url();
  await priceLink.scrollIntoViewIfNeeded().catch(() => undefined);
  await Promise.all([
    page.waitForURL(/price=/i, { timeout: Math.min(timeoutMs, 12_000) }).catch(() => undefined),
    priceLink.click({ timeout: timeoutMs }),
  ]);
  await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
  await page.waitForTimeout(600);

  if (/price=/i.test(page.url())) {
    return { ok: true, locator: href || page.url(), strategy: "catalog-price-filter" };
  }

  const directUrl = buildPriceFilterUrl(urlBefore);
  if (directUrl && directUrl !== page.url()) {
    await page.goto(directUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
    if (/price=/i.test(page.url())) {
      return { ok: true, locator: directUrl, strategy: "catalog-price-filter-direct-url" };
    }
  }

  const activeFilter =
    (await page.locator(".filter-current, .filter-current-subtitle, .block-subtitle.filter-current").count()) > 0;
  if (activeFilter) {
    return { ok: true, locator: href || "price filter link", strategy: "catalog-price-filter-active-ui" };
  }

  return { ok: false, strategy: "catalog-price-filter-not-applied" };
}

function buildPriceFilterUrl(pageUrl: string, priceBand = "0-10"): string | undefined {
  try {
    const url = new URL(pageUrl);
    if (!/\.html/i.test(url.pathname) || /catalogsearch/i.test(url.href)) {
      return undefined;
    }
    url.searchParams.set("price", priceBand);
    return url.href;
  } catch {
    return undefined;
  }
}

export async function tryApplyCatalogFilter(
  page: Page,
  timeoutMs: number
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  if (/catalogsearch\/result/i.test(page.url())) {
    return { ok: false, strategy: "filter-needs-category-listing" };
  }

  const onCategoryListing =
    /\.html/i.test(page.url()) &&
    !/\/product\//i.test(page.url()) &&
    !/\/customer\//i.test(page.url()) &&
    !/\/checkout/i.test(page.url());
  if (!onCategoryListing) {
    const glovesUrl = new URL("/gloves.html", page.url()).href;
    await page.goto(glovesUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
    await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
  }

  const priceFilter = await tryApplyPriceLayeredFilter(page, timeoutMs);
  if (priceFilter.ok) {
    return priceFilter;
  }

  const expandFilter = page
    .locator(
      ".filter-options-title, .block-filter .filter-title, .filter-options .item .title, .narrow-by-list .block-subtitle"
    )
    .first();
  if ((await expandFilter.count()) > 0 && (await expandFilter.isVisible().catch(() => false))) {
    await expandFilter.click({ timeout: timeoutMs }).catch(() => undefined);
    await page.waitForTimeout(400);
  }

  const filterCheckbox = page
    .locator(
      ".filter-options-content input[type='checkbox'], .filter-options input[type='checkbox'], .amshopby-option input[type='checkbox']"
    )
    .first();
  if ((await filterCheckbox.count()) > 0 && (await filterCheckbox.isVisible().catch(() => false))) {
    await filterCheckbox.check({ timeout: timeoutMs }).catch(() => filterCheckbox.click({ timeout: timeoutMs }));
    await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
    await page.waitForTimeout(800);
    return { ok: true, locator: "catalog filter checkbox", strategy: "catalog-filter-checkbox" };
  }

  const filterLinks = page
    .locator(
      ".filter-options-content a, .filter-options a, .block-filter a, .amshopby-link, .narrow-by-list a, .filter-content a, [data-role='filter-item'] a"
    )
    .filter({ hasNotText: /clear|reset|remove all|shop now/i });
  const linkCount = Math.min(await filterLinks.count(), 12);
  for (let i = 0; i < linkCount; i += 1) {
    const filterLink = filterLinks.nth(i);
    if (!(await filterLink.isVisible().catch(() => false))) {
      continue;
    }
    const href = (await filterLink.getAttribute("href")) ?? "";
    if (/\.html(?:$|[?#])/i.test(href) && !/amshopby|filter=|price=|cat=/i.test(href)) {
      continue;
    }
    await filterLink.scrollIntoViewIfNeeded().catch(() => undefined);
    await filterLink.click({ timeout: timeoutMs });
    await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
    await page.waitForTimeout(800);
    return { ok: true, locator: "catalog filter link", strategy: "catalog-filter-click" };
  }

  const categoryFilterLink = page
    .locator(".filter-options-content a, .filter-options a, .amshopby-link")
    .filter({ hasNotText: /clear|reset|remove all|shop now/i })
    .first();
  if ((await categoryFilterLink.count()) > 0 && (await categoryFilterLink.isVisible().catch(() => false))) {
    await categoryFilterLink.scrollIntoViewIfNeeded().catch(() => undefined);
    await categoryFilterLink.click({ timeout: timeoutMs });
    await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
    await page.waitForTimeout(800);
    return { ok: true, locator: "catalog category filter link", strategy: "catalog-filter-category-nav" };
  }

  return { ok: false, strategy: "catalog-filter-not-found" };
}

const LISTING_PRODUCT_SELECTOR =
  ".product-item, .products.list .item, li.product-item, ol.products li.item, .product-items .product-item";

export interface PaginationValidationResult {
  ok: boolean;
  locator?: string;
  strategy?: string;
  productCountBefore?: number;
  productCountAfter?: number;
  emptyStateDetected?: boolean;
  pageUrl?: string;
  failureReason?: string;
  bugSummary?: string;
}

export async function countListingProducts(page: Page): Promise<number> {
  const products = page.locator(LISTING_PRODUCT_SELECTOR);
  const total = await products.count();
  if (total === 0) {
    return 0;
  }
  let visible = 0;
  for (let i = 0; i < Math.min(total, 40); i += 1) {
    if (await products.nth(i).isVisible().catch(() => false)) {
      visible += 1;
    }
  }
  return visible;
}

async function hasListingEmptyStateMessage(page: Page): Promise<boolean> {
  const cssEmpty = page.locator(".message.info.empty, .empty-catalog, .no-products-found").first();
  if ((await cssEmpty.count()) > 0 && (await cssEmpty.isVisible().catch(() => false))) {
    return true;
  }
  const textEmpty = page.getByText(
    /no products|no items|0 items|0 products|we can't find|nothing found/i
  ).first();
  return (await textEmpty.count()) > 0 && (await textEmpty.isVisible().catch(() => false));
}

/** PureLife checkout AutoShip — Magento modal with iframe + footer actions:
 *  .modal-popup._show > iframe.checkout-autoship-iframe
 *  .modal-footer > button.footer-btn-keep-autoship-as-schedule  ← click this (parent page)
 *  iframe inner fallback: #btn-keep-autoship-as-schedule
 */
const AUTOSHIP_MODAL_FOOTER_KEEP =
  ".modal-popup._show .footer-btn-keep-autoship-as-schedule, .modals-wrapper .modal-popup._show .footer-btn-keep-autoship-as-schedule, button.footer-btn-keep-autoship-as-schedule";
const AUTOSHIP_MODAL_FOOTER_KEEP_LABEL = ".footer-btn-keep-autoship-as-schedule";
const AUTOSHIP_IFRAME_SELECTOR = "iframe.checkout-autoship-iframe, .checkout-autoship-iframe";
const AUTOSHIP_IFRAME_INNER_KEEP = "#btn-keep-autoship-as-schedule, .btn-keep-autoship-as-schedule";
const AUTOSHIP_INTERSTITIAL_URL = /\/autoshipconsolidation\//i;
const AUTOSHIP_CLICK_BUDGET_MS = 2_000;
const AUTOSHIP_MODAL_CLOSE_WAIT_MS = 8_000;
const AUTOSHIP_POLL_MS = 75;

export function isAutoshipInterstitialPage(url: string): boolean {
  return AUTOSHIP_INTERSTITIAL_URL.test(url);
}

async function isAutoshipCheckoutModalVisible(page: Page): Promise<boolean> {
  const modalWithIframe = page
    .locator(".modal-popup._show, .modals-wrapper .modal-popup._show")
    .filter({ has: page.locator(AUTOSHIP_IFRAME_SELECTOR) })
    .first();
  if ((await modalWithIframe.count()) > 0 && (await modalWithIframe.isVisible().catch(() => false))) {
    return true;
  }
  const footerInModal = page.locator(AUTOSHIP_MODAL_FOOTER_KEEP).first();
  return (await footerInModal.count()) > 0 && (await footerInModal.isVisible().catch(() => false));
}

export async function isKeepAsScheduledButtonVisible(page: Page): Promise<boolean> {
  const footerButton = page.locator(AUTOSHIP_MODAL_FOOTER_KEEP).first();
  if ((await footerButton.count()) > 0 && (await footerButton.isVisible().catch(() => false))) {
    return true;
  }
  const footerByRole = page
    .locator(".modal-popup._show, .modals-wrapper .modal-popup._show")
    .getByRole("button", { name: /keep as scheduled/i })
    .first();
  if ((await footerByRole.count()) > 0 && (await footerByRole.isVisible().catch(() => false))) {
    return true;
  }
  const iframe = page.locator(AUTOSHIP_IFRAME_SELECTOR).first();
  if ((await iframe.count()) === 0 || !(await iframe.isVisible().catch(() => false))) {
    return false;
  }
  try {
    const innerButton = page.frameLocator(AUTOSHIP_IFRAME_SELECTOR).locator(AUTOSHIP_IFRAME_INNER_KEEP).first();
    return (await innerButton.count()) > 0 && (await innerButton.isVisible().catch(() => false));
  } catch {
    return false;
  }
}

export async function isAutoshipStepActive(page: Page): Promise<boolean> {
  if (await isAutoshipCheckoutModalVisible(page)) {
    return true;
  }
  if (await isKeepAsScheduledButtonVisible(page)) {
    return true;
  }
  if (isAutoshipInterstitialPage(page.url())) {
    return true;
  }
  const autoshipFrame = page.locator(AUTOSHIP_IFRAME_SELECTOR).first();
  return (await autoshipFrame.count()) > 0 && (await autoshipFrame.isVisible().catch(() => false));
}

/** @deprecated Use isAutoshipStepActive — kept for existing call sites. */
export async function isAutoshipModalOpen(page: Page): Promise<boolean> {
  return isAutoshipStepActive(page);
}

/** @deprecated Use isAutoshipStepActive — kept for existing call sites. */
export async function isAutoshipModalPresent(page: Page): Promise<boolean> {
  return isAutoshipStepActive(page);
}

async function waitForAutoshipModalReady(page: Page, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isKeepAsScheduledButtonVisible(page)) {
      return true;
    }
    if (await isAutoshipCheckoutModalVisible(page)) {
      return true;
    }
    await page.waitForTimeout(AUTOSHIP_POLL_MS);
  }
  return (await isKeepAsScheduledButtonVisible(page)) || (await isAutoshipCheckoutModalVisible(page));
}

async function clickKeepAsScheduledButton(
  page: Page
): Promise<{ clicked: boolean; method?: string }> {
  await page
    .locator(`${AUTOSHIP_MODAL_FOOTER_KEEP}, ${AUTOSHIP_IFRAME_SELECTOR}`)
    .first()
    .waitFor({ state: "visible", timeout: 8_000 })
    .catch(() => undefined);

  const viaDom = await page.evaluate(() => {
    const selectors = [
      ".modal-popup._show .footer-btn-keep-autoship-as-schedule",
      ".footer-btn-keep-autoship-as-schedule",
      "#btn-keep-autoship-as-schedule",
      ".btn-keep-autoship-as-schedule",
    ];
    for (const selector of selectors) {
      const button = document.querySelector(selector) as HTMLElement | null;
      if (!button) {
        continue;
      }
      const rect = button.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        continue;
      }
      button.scrollIntoView({ block: "center", inline: "center" });
      const jQuery = (
        window as unknown as { jQuery?: (el: Element) => { trigger: (event: string) => void } }
      ).jQuery;
      if (jQuery) {
        jQuery(button).trigger("click");
        return `jquery:${selector}`;
      }
      button.focus();
      button.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
      button.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true }));
      button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      button.click();
      return `dom:${selector}`;
    }
    return null;
  });

  if (viaDom) {
    return { clicked: true, method: viaDom };
  }

  const footerCandidates = [
    page.locator(AUTOSHIP_MODAL_FOOTER_KEEP).first(),
    page
      .locator(".modal-popup._show .modal-footer, .modals-wrapper .modal-popup._show .modal-footer")
      .getByRole("button", { name: /keep as scheduled/i })
      .first(),
    page.locator("button.footer-btn-keep-autoship-as-schedule").first(),
  ];

  for (const candidate of footerCandidates) {
    if ((await candidate.count()) === 0 || !(await candidate.isVisible().catch(() => false))) {
      continue;
    }
    await candidate.scrollIntoViewIfNeeded().catch(() => undefined);
    try {
      await candidate.click({ timeout: AUTOSHIP_CLICK_BUDGET_MS });
      return { clicked: true, method: "playwright-footer-click" };
    } catch {
      await candidate.click({ timeout: AUTOSHIP_CLICK_BUDGET_MS, force: true }).catch(() => undefined);
      return { clicked: true, method: "playwright-footer-force-click" };
    }
  }

  const iframe = page.locator(AUTOSHIP_IFRAME_SELECTOR).first();
  if ((await iframe.count()) > 0 && (await iframe.isVisible().catch(() => false))) {
    const innerButton = page.frameLocator(AUTOSHIP_IFRAME_SELECTOR).locator(AUTOSHIP_IFRAME_INNER_KEEP).first();
    if ((await innerButton.count()) > 0) {
      await innerButton.scrollIntoViewIfNeeded().catch(() => undefined);
      try {
        await innerButton.click({ timeout: AUTOSHIP_CLICK_BUDGET_MS });
        return { clicked: true, method: "iframe-inner-click" };
      } catch {
        await innerButton.click({ timeout: AUTOSHIP_CLICK_BUDGET_MS, force: true }).catch(() => undefined);
        return { clicked: true, method: "iframe-inner-force-click" };
      }
    }
  }

  return { clicked: false };
}

async function waitForAutoshipModalClosed(page: Page, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((await isPaymentStepVisible(page)) || isOnPaymentStep(page.url())) {
      return true;
    }
    const modalOpen = await isAutoshipCheckoutModalVisible(page);
    const keepVisible = await isKeepAsScheduledButtonVisible(page);
    if (!modalOpen && !keepVisible) {
      return true;
    }
    const overlay = page.locator(".modals-overlay").first();
    if (!modalOpen && (await overlay.count()) > 0 && !(await overlay.isVisible().catch(() => false))) {
      return true;
    }
    await page.waitForTimeout(AUTOSHIP_POLL_MS);
  }

  return (
    (await isPaymentStepVisible(page)) ||
    isOnPaymentStep(page.url()) ||
    (!(await isAutoshipCheckoutModalVisible(page)) && !(await isKeepAsScheduledButtonVisible(page)))
  );
}

export async function tryDismissAutoshipModal(
  page: Page,
  timeoutMs: number
): Promise<{ ok: boolean; skipped?: boolean; strategy?: string; closedWithinMs?: number }> {
  const budgetMs = Math.min(timeoutMs, 15_000);
  const deadline = Date.now() + budgetMs;

  while (Date.now() < deadline) {
    if ((await isAutoshipStepActive(page)) || (await isKeepAsScheduledButtonVisible(page))) {
      break;
    }
    if ((await isPaymentStepVisible(page)) || isOnPaymentStep(page.url())) {
      return { ok: true, skipped: true, strategy: "autoship-already-past-payment" };
    }
    await page.waitForTimeout(AUTOSHIP_POLL_MS);
  }

  const stepActive = (await isAutoshipStepActive(page)) || (await isKeepAsScheduledButtonVisible(page));
  if (!stepActive) {
    return { ok: true, skipped: true, strategy: "autoship-not-present" };
  }

  await waitForAutoshipModalReady(page, Math.min(budgetMs, 8_000));

  const closeStart = Date.now();
  while (Date.now() < deadline) {
    if (await isKeepAsScheduledButtonVisible(page)) {
      const clickResult = await clickKeepAsScheduledButton(page);
      if (clickResult.clicked) {
        const closed = await waitForAutoshipModalClosed(
          page,
          Math.min(AUTOSHIP_MODAL_CLOSE_WAIT_MS, deadline - Date.now())
        );
        if (closed) {
          return {
            ok: true,
            strategy: clickResult.method ?? "footer-keep-as-scheduled",
            closedWithinMs: Date.now() - closeStart,
          };
        }
      }
    } else if (!(await isAutoshipStepActive(page))) {
      return { ok: true, strategy: "autoship-modal-closed" };
    }

    await page.waitForTimeout(AUTOSHIP_POLL_MS);
  }

  const stillActive = (await isAutoshipStepActive(page)) || (await isKeepAsScheduledButtonVisible(page));
  if (stillActive) {
    return { ok: false, strategy: "autoship-keep-as-scheduled-not-closed" };
  }
  return { ok: true, strategy: "autoship-modal-closed-late" };
}

export async function dismissCheckoutBlockingModals(page: Page, timeoutMs: number): Promise<void> {
  await clearBlockingCartModals(page, timeoutMs);
  if ((await isAutoshipStepActive(page)) || (await isKeepAsScheduledButtonVisible(page))) {
    await tryDismissAutoshipModal(page, Math.min(timeoutMs, 15_000));
  }
  if (await isGuestCheckoutModalVisible(page)) {
    await tryHandleGuestCheckoutModalForAuthenticatedUser(page, Math.min(timeoutMs, 8_000));
  }
}

export async function waitForListingProductsOrEmptyState(
  page: Page,
  timeoutMs: number
): Promise<{ productCount: number; emptyStateDetected: boolean }> {
  const waitBudget = Math.min(timeoutMs, 20_000);
  const deadline = Date.now() + waitBudget;
  while (Date.now() < deadline) {
    const productCount = await countListingProducts(page);
    if (productCount > 0) {
      return { productCount, emptyStateDetected: false };
    }
    if (await hasListingEmptyStateMessage(page)) {
      return { productCount: 0, emptyStateDetected: true };
    }
    const loading = page.locator(".loading-mask, .loader, [data-role='loader'], .infinite-scroll-loader").first();
    if ((await loading.count()) > 0 && (await loading.isVisible().catch(() => false))) {
      await page.waitForTimeout(350);
      continue;
    }
    await page.waitForTimeout(350);
  }
  return {
    productCount: await countListingProducts(page),
    emptyStateDetected: await hasListingEmptyStateMessage(page),
  };
}

function isOnListingPage2(url: string): boolean {
  return (
    /[?&]p=2(?:&|$)/i.test(url) ||
    /\/page\/2(?:\/|$|[?#])/i.test(url)
  );
}

export async function validateListingPaginationPage2(
  page: Page,
  timeoutMs: number,
  productCountBefore: number
): Promise<PaginationValidationResult> {
  const pageUrl = page.url();
  if (!isOnListingPage2(pageUrl)) {
    return {
      ok: false,
      strategy: "catalog-pagination-page2-not-reached",
      pageUrl,
      productCountBefore,
      failureReason: "Pagination did not reach page 2 of the listing.",
    };
  }

  const { productCount, emptyStateDetected } = await waitForListingProductsOrEmptyState(
    page,
    timeoutMs
  );

  if (productCount > 0) {
    return {
      ok: true,
      strategy: "catalog-pagination-validated",
      pageUrl,
      productCountBefore,
      productCountAfter: productCount,
      emptyStateDetected,
    };
  }

  if (emptyStateDetected) {
    return {
      ok: true,
      strategy: "catalog-pagination-empty-state",
      pageUrl,
      productCountBefore,
      productCountAfter: 0,
      emptyStateDetected: true,
    };
  }

  return {
    ok: false,
    strategy: "catalog-pagination-empty-listing",
    pageUrl,
    productCountBefore,
    productCountAfter: 0,
    emptyStateDetected: false,
    failureReason:
      "Pagination opens empty product listing page — page 2 loaded but no product cards were visible and no clear empty-state message appeared.",
    bugSummary: "Pagination opens empty product listing page",
  };
}

export async function tryGoToListingPage2(
  page: Page,
  timeoutMs: number
): Promise<PaginationValidationResult> {
  const overallDeadline = Date.now() + Math.min(timeoutMs, 15_000);

  if (/catalogsearch\/result/i.test(page.url())) {
    return { ok: false, strategy: "pagination-needs-category-listing" };
  }

  const onCategoryListing =
    /\.html/i.test(page.url()) &&
    !/\/product\//i.test(page.url()) &&
    !/\/customer\//i.test(page.url()) &&
    !/\/checkout/i.test(page.url());
  if (!onCategoryListing) {
    const glovesUrl = new URL("/gloves.html", page.url()).href;
    await page
      .goto(glovesUrl, { waitUntil: "domcontentloaded", timeout: Math.min(timeoutMs, 8_000) })
      .catch(() => undefined);
  }

  const productCountBefore = await countListingProducts(page);
  const remainingMs = () => Math.max(2_000, overallDeadline - Date.now());

  if (!isOnListingPage2(page.url())) {
    try {
      const current = new URL(page.url());
      current.searchParams.delete("price");
      current.searchParams.set("p", "2");
      await page.goto(current.href, {
        waitUntil: "domcontentloaded",
        timeout: Math.min(remainingMs(), 8_000),
      });
    } catch {
      return { ok: false, strategy: "catalog-pagination-not-found", productCountBefore };
    }
  }

  await page.waitForURL(/[?&]p=2(?:&|$)|page\/2/i, { timeout: Math.min(remainingMs(), 5_000) }).catch(() => undefined);
  const validation = await validateListingPaginationPage2(page, Math.min(remainingMs(), 6_000), productCountBefore);
  return {
    ...validation,
    locator: "pagination direct p=2",
    strategy: validation.ok ? "catalog-pagination-direct-url" : validation.strategy ?? "catalog-pagination-failed",
  };
}

export async function tryApplyCatalogSort(
  page: Page,
  timeoutMs: number
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  if (/catalogsearch\/result/i.test(page.url())) {
    return { ok: false, strategy: "sort-needs-category-listing" };
  }

  const sortSelect = page.locator("select[name='product_list_order'], select.sorter, .toolbar-sorter select").first();
  if ((await sortSelect.count()) > 0 && (await sortSelect.isVisible().catch(() => false))) {
    const options = sortSelect.locator("option");
    const optionCount = await options.count();
    for (let i = 1; i < optionCount; i += 1) {
      const value = (await options.nth(i).getAttribute("value")) ?? "";
      if (value) {
        await sortSelect.selectOption(value);
        await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
        await page.waitForTimeout(800);
        return { ok: true, locator: "catalog sort select", strategy: "catalog-sort-select" };
      }
    }
  }
  return { ok: false, strategy: "catalog-sort-not-found" };
}
