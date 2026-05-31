import type { Page } from "playwright-core";
import type { ParsedInstructionData } from "@/types";
import {
  extractQuantityValue,
  focusHeaderSearchField,
  isCartPageUrl,
  isOnPaymentStep,
  isOnShippingStep,
  isProductDetailPage,
  prepareProductPageForAddToCart,
  tryBuyOnceOptional,
  tryClickAddToCart,
  tryClickCheckoutNext,
  tryCloseCheckoutPopup,
  tryProceedToCheckout,
  trySelectDefaultBillingAddress,
  trySelectQuantity,
  buildUsTestAddress,
  ensureCheckoutPaymentStep,
  ensureCheckoutShippingStep,
  isPaymentStepVisible,
  isShippingStepVisible,
  tryClickKeepAsScheduled,
  tryClickMakePayment,
  tryFillCheckoutAddressIfNeeded,
  hasSavedPaymentMethod,
  tryFillPaymentIfNeeded,
  tryUpdateCartQuantity,
  tryRemoveCartItem,
  tryApplyCouponIfAvailable,
  cartHasLineItems,
  cartOrMinicartHasItems,
  isOnCheckoutFlowUrl,
  tryApplyCatalogFilter,
  tryApplyCatalogSort,
  tryGoToListingPage2,
  tryEnsureSecondCartLineItem,
  tryRestoreCartIfEmpty,
  tryAddSecondaryCartLineFromPdp,
  trySelectItemNumberOnPdp,
  dismissCheckoutBlockingModals,
  isCustomerLoggedIn,
  PAYMENT_ROOT,
} from "./pageInteractionHelpers";
import {
  buildSecondaryCartLinePdpUrl,
  getSecondaryCartLineConfig,
} from "./ecommerceCartConfig";
import { markCheckoutCompleteAtMakePayment, markCheckoutPhase, getCheckoutPhase } from "./checkoutSessionStore";
import { markRunCartPopulated, markRunAuthenticated, isRunAuthenticated, syncRunCartPopulatedFromPage } from "./ecommerceSessionStore";
import {
  extractSearchQueryFromMemory,
  pickProductUrlFromMemory,
} from "./ecommerceRegressionIntentResolver";
import type { DomainExecutionMemory } from "./executionMemoryStore";

interface ResolverParams {
  page: Page;
  intentText: string;
  parsedInstructions?: ParsedInstructionData;
  memorySelectors?: string[];
  executionMemory?: DomainExecutionMemory;
  timeoutMs: number;
  runId?: string;
}

export interface ResolverResult {
  matched: boolean;
  action: string;
  usedLocator?: string;
  strategy: string;
  logs: string[];
}

const ACTION_SYNONYMS: Record<string, string[]> = {
  login: ["login", "log in", "sign in", "my account", "account"],
  openSearch: ["click search bar", "open search", "focus search", "search bar"],
  search: ["search", "find", "product search"],
  openProduct: ["open first product", "open product", "first product", "open result"],
  selectQuantity: ["select quantity", "qty", "quantity dropdown", "quantity field", "set quantity"],
  buyOnce: ["buy once", "one time purchase", "one-time"],
  addToCart: ["add to cart", "add to basket", "buy now", "purchase", "add item", "add product"],
  moveToCart: ["move to cart", "go to cart", "view cart", "shopping cart page"],
  proceedToCheckout: ["proceed to checkout", "continue to checkout"],
  checkout: ["checkout", "secure checkout"],
  placeOrder: ["place order", "submit order", "complete order", "confirm order"],
  fillPayment: ["card detail", "card no", "card number", "enter card", "payment info", "cvv", "expiry"],
  selectBillingAddress: ["billing address", "default address as billing", "choose customer"],
};
const LOGIN_ENTRY_TERMS = ["my account", "account", "login", "sign in"];
const LOGIN_SUBMIT_TERMS = ["login", "sign in", "submit"];

function requiresCheckoutContext(intent: string): boolean {
  return /shipping address|proceed to checkout|checkout|payment page|billing address|place order|card detail|next button|payment and billing/i.test(
    intent
  );
}

function isOnCheckoutFlow(url: string): boolean {
  return /checkout|\/cart|shipping|payment|billing|onepage|order/i.test(url.toLowerCase());
}

function validateActionContext(intentText: string, pageUrl: string, logs: string[]): boolean {
  if (!requiresCheckoutContext(intentText)) {
    return true;
  }
  if (isOnCheckoutFlow(pageUrl)) {
    return true;
  }
  logs.push(`Context validation failed: expected checkout/cart flow page, got "${pageUrl}".`);
  return false;
}

function includesAny(source: string, values: string[]): boolean {
  return values.some((value) => source.includes(value));
}

function detectAction(intent: string): ResolverResult["action"] {
  if (/^enter\s+(?:the\s+)?email\b|enter\s+email\s*:|fill\s+email|type\s+email/i.test(intent)) {
    return "enterEmail";
  }
  if (/^enter\s+(?:the\s+)?password\b|enter\s+password\s*:|fill\s+password|type\s+password/i.test(intent)) {
    return "enterPassword";
  }
  if (/hit login|click login button|submit login|press login/i.test(intent)) {
    return "submitLogin";
  }
  if (/wait.*login.*search|wait for login and then click search|click search bar/i.test(intent)) {
    return "openSearch";
  }
  if (
    /go to login|login page|navigate.*login|open login/i.test(intent) &&
    !/enter|fill|hit|click login button|submit/i.test(intent)
  ) {
    return "openLoginPage";
  }
  if (/place order|submit order|complete order|confirm order/i.test(intent)) {
    return "placeOrder";
  }
  if (/card detail|card no|card number|enter card|payment info|\bcvv\b|\bexpiry\b/i.test(intent)) {
    return "fillPayment";
  }
  if (/billing address|default address as billing|choose customer.*billing/i.test(intent)) {
    return "selectBillingAddress";
  }
  if (/keep as scheduled/i.test(intent)) {
    return "clickKeepAsScheduled";
  }
  if (/confirm checkout reached payment|confirm checkout review|verify checkout payment step/i.test(intent)) {
    return "confirmCheckoutStep";
  }
  if (/make payment/i.test(intent)) {
    return "makePayment";
  }
  if (/guest checkout|checkout as guest|proceed to guest checkout/i.test(intent)) {
    return "guestCheckout";
  }
  if (/update quantity.*cart|cart.*update quantity|cart quantity/i.test(intent)) {
    return "updateCartQuantity";
  }
  if (/add second cart line item|5152202 from prophyflex/i.test(intent)) {
    return "addSecondaryCartLine";
  }
  if (/ensure second cart line|second cart line item|add second.*cart/i.test(intent)) {
    return "ensureSecondCartLine";
  }
  if (/restore cart|ensure cart has items|cart is not empty/i.test(intent)) {
    return "restoreCart";
  }
  if (/remove item.*cart|cart.*remove item|remove from cart/i.test(intent)) {
    return "removeCartItem";
  }
  if (/apply coupon|coupon code/i.test(intent)) {
    return "applyCoupon";
  }
  if (/apply first catalog filter|catalog filter if available/i.test(intent)) {
    return "applyCatalogFilter";
  }
  if (/go to page 2|pagination exists|listing page 2/i.test(intent)) {
    return "goToListingPage2";
  }
  if (/apply first sort|sort option if available/i.test(intent)) {
    return "applyCatalogSort";
  }
  if (/login with provided credentials|attempts login flow/i.test(intent)) {
    return "login";
  }
  if (/navigate to customer account create|customer account create page/i.test(intent)) {
    return "navigateSignup";
  }
  if (/navigate to forgot password|forgot password page/i.test(intent)) {
    return "navigateForgotPassword";
  }
  if (/navigate to customer orders|customer orders page/i.test(intent)) {
    return "navigateAccountOrders";
  }
  if (/navigate to customer account profile|customer account profile/i.test(intent)) {
    return "navigateAccountProfile";
  }
  if (/^navigate to https?:\/\//i.test(intent)) {
    return "navigateUrl";
  }
  if (/^navigate to /i.test(intent)) {
    return "navigateUrl";
  }
  if (/validates add to cart|add to cart interaction|user validates add to cart/i.test(intent)) {
    return "addToCart";
  }
  if (/user attempts guest checkout|guest checkout flow/i.test(intent)) {
    return "guestCheckout";
  }
  if (/add\b.*\baddress|fill.*\baddress|test address|biling and shipping/i.test(intent)) {
    return "fillCheckoutAddressIfNeeded";
  }
  if (/close.*(?:popup|modal|window)|dismiss.*(?:popup|modal)/i.test(intent)) {
    return "closePopup";
  }
  if (includesAny(intent, ACTION_SYNONYMS.proceedToCheckout)) {
    return "proceedToCheckout";
  }
  if (
    /shipping address screen|next button|click next|continue to payment|payment and billing/i.test(intent) &&
    !/proceed to checkout|continue to checkout/i.test(intent)
  ) {
    return "clickCheckoutNext";
  }
  if (includesAny(intent, ACTION_SYNONYMS.openSearch) || /\bsearch bar\b/i.test(intent)) {
    if (!/search for|find /i.test(intent)) {
      return "openSearch";
    }
  }
  if (/search for|search use|find product|find '|\bsearch\b.*\bfor\b/i.test(intent)) {
    return "search";
  }
  if (includesAny(intent, ACTION_SYNONYMS.login)) {
    return "login";
  }
  if (includesAny(intent, ACTION_SYNONYMS.openProduct)) {
    return "openProduct";
  }
  if (includesAny(intent, ACTION_SYNONYMS.buyOnce)) {
    return "buyOnce";
  }
  if (includesAny(intent, ACTION_SYNONYMS.selectQuantity)) {
    return "selectQuantity";
  }
  if (includesAny(intent, ACTION_SYNONYMS.addToCart)) {
    return "addToCart";
  }
  if (includesAny(intent, ACTION_SYNONYMS.moveToCart)) {
    return "moveToCart";
  }
  if (includesAny(intent, ACTION_SYNONYMS.checkout)) {
    return "checkout";
  }
  if (/open|navigate|visit|go to/.test(intent)) {
    return "navigate";
  }
  return "generic";
}

async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url().toLowerCase();

  if (url.includes("/customer/account/login") || /\/login(?:\/|$|[?#])/.test(url)) {
    if (await hasVisibleLoginForm(page)) {
      return false;
    }
  }

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
  if ((await logoutLink.count()) > 0 && (await logoutLink.isVisible())) {
    return true;
  }

  if (await hasVisibleLoginForm(page)) {
    return false;
  }

  const signInLink = page.getByRole("link", { name: /sign in|log in|login/i }).first();
  if ((await signInLink.count()) > 0 && (await signInLink.isVisible())) {
    return false;
  }

  return false;
}

function extractSearchQuery(intentText: string, parsedInstructions?: ParsedInstructionData): string {
  const commandPool = [
    intentText,
    ...(parsedInstructions?.bulletPoints ?? []),
    ...(parsedInstructions?.naturalLanguageCommands ?? []),
  ];
  for (const command of commandPool) {
    if (!/search|find/i.test(command)) {
      continue;
    }
    const quotedInCommand = command.match(/["']([^"']{2,120})["']/);
    if (quotedInCommand?.[1]) {
      return quotedInCommand[1].trim();
    }
    const looseQuoted = command.match(/search(?:\s+for|\s+use)?\s+['"]?([a-z0-9 _-]{2,40})['"]?/i);
    if (looseQuoted?.[1]) {
      return looseQuoted[1].trim();
    }
    const useForm = command.match(/search\s+use\s+([a-z0-9 _-]{2,40})/i);
    if (useForm?.[1]) {
      return useForm[1].trim();
    }
  }
  const quoted = intentText.match(/search(?:\s+for)?\s+["']([^"']+)["']/i);
  if (quoted?.[1]) {
    return quoted[1].trim();
  }
  const plain = intentText.match(/search(?:\s+for)?\s+([a-z0-9 _-]{2,40})/i);
  if (plain?.[1]) {
    return plain[1].trim();
  }
  return "";
}

async function clickByRoleOrText(
  page: Page,
  terms: string[],
  timeoutMs: number
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  for (const term of terms) {
    const byRole = page.getByRole("button", { name: new RegExp(term, "i") }).first();
    if ((await byRole.count()) > 0 && (await byRole.isVisible())) {
      await byRole.click({ timeout: timeoutMs });
      return { ok: true, locator: `role=button[name~=${term}]`, strategy: "role" };
    }
    const byLinkRole = page.getByRole("link", { name: new RegExp(term, "i") }).first();
    if ((await byLinkRole.count()) > 0 && (await byLinkRole.isVisible())) {
      await byLinkRole.click({ timeout: timeoutMs });
      return { ok: true, locator: `role=link[name~=${term}]`, strategy: "role" };
    }
    const byText = page.getByText(new RegExp(term, "i")).first();
    if ((await byText.count()) > 0 && (await byText.isVisible())) {
      await byText.click({ timeout: timeoutMs });
      return { ok: true, locator: `text~=${term}`, strategy: "visible-text" };
    }
  }
  return { ok: false };
}

async function fillByLabelOrPlaceholder(
  page: Page,
  terms: string[],
  value: string
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  for (const term of terms) {
    const byLabel = page.getByLabel(new RegExp(term, "i")).first();
    if ((await byLabel.count()) > 0 && (await byLabel.isVisible())) {
      await byLabel.fill(value);
      return { ok: true, locator: `label~=${term}`, strategy: "label" };
    }
    const byPlaceholder = page.getByPlaceholder(new RegExp(term, "i")).first();
    if ((await byPlaceholder.count()) > 0 && (await byPlaceholder.isVisible())) {
      await byPlaceholder.fill(value);
      return { ok: true, locator: `placeholder~=${term}`, strategy: "placeholder" };
    }
  }
  return { ok: false };
}

async function fillByInputSelector(
  page: Page,
  selectors: string[],
  value: string
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  for (const selector of selectors) {
    try {
      const target = page.locator(selector).first();
      if ((await target.count()) > 0 && (await target.isVisible())) {
        await target.fill(value);
        return { ok: true, locator: selector, strategy: "input-selector" };
      }
    } catch {
      // Continue fallbacks.
    }
  }
  return { ok: false };
}


function loginForm(page: Page) {
  return page.locator("form#login-form, form.form-login").first();
}

function loginEmailField(page: Page) {
  return loginForm(page).locator("#email, input[name='login[username]']").first();
}

function loginPasswordField(page: Page) {
  return loginForm(page).locator("#pass, input[name='login[password]']").first();
}

function parsePasswordFromIntent(intentText: string): string {
  const match = intentText.match(/enter\s+password\s*:\s*(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

function parseEmailFromIntent(intentText: string): string {
  const match = intentText.match(/enter\s+email\s*:\s*(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

async function readFieldValue(field: ReturnType<Page["locator"]>): Promise<string> {
  return (await field.inputValue().catch(() => "")) ?? "";
}

async function writeInputValue(
  field: ReturnType<Page["locator"]>,
  value: string
): Promise<boolean> {
  await field.scrollIntoViewIfNeeded().catch(() => undefined);
  await field.click({ timeout: 5000 }).catch(() => undefined);
  await field.fill("");
  await field.fill(value);
  if ((await readFieldValue(field)) === value) {
    return true;
  }
  await field.click({ clickCount: 3, timeout: 5000 }).catch(() => undefined);
  await field.press("Backspace").catch(() => undefined);
  await field.pressSequentially(value, { delay: 50 });
  if ((await readFieldValue(field)) === value) {
    return true;
  }
  await field.evaluate((el, nextValue) => {
    const input = el as HTMLInputElement;
    input.focus();
    input.value = nextValue;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  return (await readFieldValue(field)) === value;
}

async function hasVisibleLoginForm(page: Page): Promise<boolean> {
  const form = loginForm(page);
  if ((await form.count()) === 0 || !(await form.isVisible().catch(() => false))) {
    return false;
  }
  const emailField = loginEmailField(page);
  const passwordField = loginPasswordField(page);
  const emailVisible =
    (await emailField.count()) > 0 && (await emailField.isVisible().catch(() => false));
  const passwordVisible =
    (await passwordField.count()) > 0 && (await passwordField.isVisible().catch(() => false));
  return emailVisible && passwordVisible;
}

async function fillLoginFields(
  page: Page,
  email: string,
  password: string,
  logs: string[],
  options?: { emailOnly?: boolean; passwordOnly?: boolean }
) {
  let emailOk = false;
  let passOk = false;

  if (!options?.passwordOnly && email.trim()) {
    const emailField = loginEmailField(page);
    if ((await emailField.count()) > 0 && (await emailField.isVisible().catch(() => false))) {
      emailOk = await writeInputValue(emailField, email);
    }
  }

  if (!options?.emailOnly && password.trim()) {
    const passwordField = loginPasswordField(page);
    if ((await passwordField.count()) > 0 && (await passwordField.isVisible().catch(() => false))) {
      passOk = await writeInputValue(passwordField, password);
    }
  }

  if (!emailOk && !options?.passwordOnly && email.trim()) {
    const onLoginUrl = /\/customer\/account\/login|\/login(?:\/|$|[?#])/i.test(page.url());
    if (onLoginUrl) {
      const emailField = loginEmailField(page);
      if ((await emailField.count()) > 0) {
        emailOk = await writeInputValue(emailField, email);
      }
      if (!emailOk) {
        const emailFill = await fillByLabelOrPlaceholder(page, ["email", "user", "login"], email);
        emailOk = emailFill.ok;
      }
    }
  }

  if (!passOk && !options?.emailOnly && password.trim()) {
    const onLoginUrl = /\/customer\/account\/login|\/login(?:\/|$|[?#])/i.test(page.url());
    if (onLoginUrl) {
      const passwordField = loginPasswordField(page);
      if ((await passwordField.count()) > 0) {
        passOk = await writeInputValue(passwordField, password);
      }
      if (!passOk) {
        const passFill = await fillByLabelOrPlaceholder(page, ["password", "pass"], password);
        if (passFill.ok) {
          passOk = (await readFieldValue(loginPasswordField(page))) === password;
        }
      }
    }
  }

  const emailStatus = options?.passwordOnly ? "n/a" : String(emailOk);
  const passwordStatus = options?.emailOnly ? "n/a" : String(passOk);
  logs.push(`Login field fill: email=${emailStatus} password=${passwordStatus}`);
  return { emailOk, passOk };
}

async function submitLoginForm(page: Page, timeoutMs: number): Promise<boolean> {
  const form = loginForm(page);
  const submitSelectors = [
    "#send2",
    "button.action.login",
    "button.login",
    "button[type='submit'][title*='Sign' i]",
    "button[type='submit']",
  ];
  for (const selector of submitSelectors) {
    const submit = form.locator(selector).first();
    if ((await submit.count()) === 0 || !(await submit.isVisible().catch(() => false))) {
      continue;
    }
    try {
      await submit.click({ timeout: timeoutMs });
      return true;
    } catch {
      await submit.click({ timeout: timeoutMs, force: true }).catch(() => undefined);
      return true;
    }
  }
  const byRole = page.getByRole("button", { name: /sign in|log in|login/i }).first();
  if ((await byRole.count()) > 0 && (await byRole.isVisible().catch(() => false))) {
    await byRole.click({ timeout: timeoutMs }).catch(() => undefined);
    return true;
  }
  return false;
}

async function ensureLoginPage(page: Page, timeoutMs: number, logs: string[]): Promise<void> {
  await tryCloseCheckoutPopup(page, Math.min(timeoutMs, 5_000)).catch(() => undefined);
  await dismissCheckoutBlockingModals(page, Math.min(timeoutMs, 5_000));

  const onLoginUrl = /\/customer\/account\/login|\/login(?:\/|$|[?#])/i.test(page.url());
  const passwordReady = onLoginUrl && (await hasVisibleLoginForm(page));

  if (!passwordReady) {
    const loginUrl = new URL("/customer/account/login", page.url()).href;
    await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => undefined);
    logs.push("Navigated to customer login page.");
  }

  const formWaitMs = Math.min(timeoutMs, 6_000);
  await loginForm(page).waitFor({
    state: "visible",
    timeout: formWaitMs,
  }).catch(() => undefined);
  await loginPasswordField(page).waitFor({
    state: "visible",
    timeout: formWaitMs,
  }).catch(() => undefined);
  await loginEmailField(page).waitFor({
    state: "visible",
    timeout: formWaitMs,
  }).catch(() => undefined);
}

async function trySelectorList(
  page: Page,
  selectors: string[],
  timeoutMs: number
): Promise<{ ok: boolean; locator?: string; strategy?: string }> {
  for (const selector of selectors) {
    try {
      const locator = selector.startsWith("//") ? page.locator(`xpath=${selector}`) : page.locator(selector);
      const target = locator.first();
      if ((await target.count()) > 0 && (await target.isVisible())) {
        await target.click({ timeout: timeoutMs });
        return {
          ok: true,
          locator: selector,
          strategy: selector.startsWith("//") ? "xpath" : "css",
        };
      }
    } catch {
      // Keep trying alternatives.
    }
  }
  return { ok: false };
}

function isSameOriginHref(pageUrl: string, href: string | null): boolean {
  if (!href) {
    return false;
  }
  try {
    const target = new URL(href, pageUrl);
    const current = new URL(pageUrl);
    return target.origin === current.origin;
  } catch {
    return false;
  }
}

async function tryOpenFirstProduct(page: Page, timeoutMs: number) {
  const pageUrl = page.url();
  const listingProductSelectors = [
    ".product-item-link",
    ".product-item a.product-item-link",
    "[data-role='product-item-link']",
    ".product-item a[href*='/product/']",
    ".products-grid a[href*='/product/']",
    ".products-list a[href*='/product/']",
    "a[href*='/product/']",
  ];

  for (const selector of listingProductSelectors) {
    const items = page.locator(selector);
    const count = Math.min(await items.count(), 12);
    for (let i = 0; i < count; i += 1) {
      const item = items.nth(i);
      if (!(await item.isVisible().catch(() => false))) {
        continue;
      }
      const href = await item.getAttribute("href");
      if (!isSameOriginHref(pageUrl, href)) {
        continue;
      }
      await item.click({ timeout: timeoutMs });
      await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
      const origin = new URL(pageUrl).origin;
      if (new URL(page.url()).origin === origin && /\/product\//i.test(page.url())) {
        return { ok: true, locator: selector, strategy: "product-listing-same-origin" };
      }
    }
  }
  return { ok: false };
}

async function tryNavigateToCart(page: Page, timeoutMs: number) {
  const url = page.url();
  if (isCartPageUrl(url)) {
    return { ok: true, strategy: "already-on-cart" as const };
  }
  if (isOnCheckoutFlowUrl(url)) {
    return { ok: true, strategy: "already-on-checkout-flow" as const };
  }

  try {
    const cartUrl = new URL("/checkout/cart", url).href;
    await page.goto(cartUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    return { ok: true, strategy: "direct-cart-navigation" as const };
  } catch {
    // Fall back to explicit cart links below.
  }

  const viewCartLink = page.getByRole("link", { name: /view cart|shopping cart|go to cart/i }).first();
  if ((await viewCartLink.count()) > 0 && (await viewCartLink.isVisible())) {
    await viewCartLink.click({ timeout: timeoutMs });
    return { ok: true, locator: "role=link[name~=view cart]", strategy: "view-cart-link" as const };
  }

  return trySelectorList(page, ["a[href*='/checkout/cart']"], timeoutMs);
}

async function tryFillPaymentFields(
  page: Page,
  parsedInstructions?: ParsedInstructionData
): Promise<{ ok: boolean; logs: string[] }> {
  const logs: string[] = [];
  if (!(await isPaymentStepVisible(page)) && !isOnPaymentStep(page.url())) {
    logs.push("Not on checkout payment step; skipped payment autofill.");
    return { ok: false, logs };
  }
  const payment = parsedInstructions?.payment;
  if (!payment?.cardNumber) {
    return { ok: false, logs };
  }
  const paymentRoot = page.locator(PAYMENT_ROOT).first();
  const scope = (await paymentRoot.count()) > 0 ? paymentRoot : page;
  const cardFill = await fillByLabelOrPlaceholder(
    page,
    ["card number", "card no", "credit card", "cc number"],
    payment.cardNumber
  );
  if (cardFill.ok) {
    logs.push("Filled card number field.");
  } else {
    const cardInput = await fillByInputSelector(
      page,
      [
        "input[name*='card' i]",
        "input[id*='card' i]",
        "input[autocomplete='cc-number']",
        "input[name*='cc' i]",
      ],
      payment.cardNumber
    );
    if (!cardInput.ok) {
      return { ok: false, logs };
    }
    logs.push("Filled card number via input selector.");
  }
  if (payment.expiry) {
    await fillByLabelOrPlaceholder(page, ["expiry", "exp", "valid"], payment.expiry);
    await fillByInputSelector(
      page,
      ["input[name*='exp' i]", "input[id*='exp' i]", "input[autocomplete='cc-exp']"],
      payment.expiry
    );
    logs.push("Filled expiry field.");
  }
  if (payment.cvv) {
    await fillByLabelOrPlaceholder(page, ["cvv", "cvc", "security code"], payment.cvv);
    await fillByInputSelector(
      page,
      ["input[name*='cvv' i]", "input[name*='cvc' i]", "input[autocomplete='cc-csc']"],
      payment.cvv
    );
    logs.push("Filled CVV field.");
  }
  return { ok: true, logs };
}

function buildResolverSuccess(
  params: ResolverParams,
  result: Omit<ResolverResult, "matched"> & { matched?: boolean }
): ResolverResult {
  const logs = result.logs ?? [];
  if (!validateActionContext(params.intentText, params.page.url(), logs)) {
    return { matched: false, action: result.action, strategy: "context-mismatch", logs };
  }
  return { matched: true, ...result, logs };
}

export async function resolveAndExecuteIntent(
  params: ResolverParams
): Promise<ResolverResult> {
  const { page, timeoutMs, parsedInstructions } = params;
  const logs: string[] = [];
  const intent = params.intentText.toLowerCase();
  const action = detectAction(intent);
  logs.push(`Detected action: ${action}`);

  if (action === "enterEmail") {
    const email =
      parsedInstructions?.login.email?.trim() ?? parseEmailFromIntent(params.intentText) ?? "";
    if (!email) {
      logs.push("No email found in parsed instructions.");
      return { matched: false, action, strategy: "none", logs };
    }
    await ensureLoginPage(page, timeoutMs, logs);
    const filled = await fillLoginFields(page, email, "", logs, { emailOnly: true });
    if (filled.emailOk) {
      return buildResolverSuccess(params, { action, strategy: "email-filled", logs });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "enterPassword") {
    const password =
      parsedInstructions?.login.password?.trim() ??
      parsePasswordFromIntent(params.intentText) ??
      "";
    if (!password) {
      logs.push("No password found in parsed instructions.");
      return { matched: false, action, strategy: "none", logs };
    }
    await ensureLoginPage(page, timeoutMs, logs);
    const filled = await fillLoginFields(page, "", password, logs, { passwordOnly: true });
    if (filled.passOk) {
      return buildResolverSuccess(params, { action, strategy: "password-filled", logs });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "submitLogin") {
    await ensureLoginPage(page, timeoutMs, logs);
    const email = parsedInstructions?.login.email?.trim() ?? "";
    const password = parsedInstructions?.login.password?.trim() ?? "";
    if (email && password) {
      const filled = await fillLoginFields(page, email, password, logs);
      if (!filled.emailOk || !filled.passOk) {
        logs.push("Login credentials could not be entered before submit.");
        return { matched: false, action, strategy: "login-fields-not-filled", logs };
      }
    } else if (await isLoggedIn(page)) {
      logs.push("Already authenticated after credential entry.");
      return buildResolverSuccess(params, {
        action,
        strategy: "already-authenticated",
        logs,
      });
    }
    const submitted = await submitLoginForm(page, timeoutMs);
    if (!submitted) {
      const passwordField = loginPasswordField(page);
      await passwordField.press("Enter").catch(() => undefined);
    }
    await page
      .waitForURL(/customer\/account\/(index|dashboard)|is_logged_in=1/i, {
        timeout: Math.min(timeoutMs, 20_000),
      })
      .catch(() => undefined);
    if (!(await isLoggedIn(page))) {
      logs.push(`Login submit completed but session was not established (url=${page.url()}).`);
      return { matched: false, action, strategy: "login-not-authenticated", logs };
    }
    return buildResolverSuccess(params, {
      action,
      strategy: "login-form-submitted",
      logs: [...logs, "Authenticated session established after login submit."],
    });
  }

  if (action === "openLoginPage") {
    if (await isLoggedIn(page)) {
      logs.push("Already authenticated; login page navigation skipped.");
      return buildResolverSuccess(params, {
        action,
        strategy: "already-authenticated",
        logs,
      });
    }
    const openLogin = await clickByRoleOrText(page, LOGIN_ENTRY_TERMS, timeoutMs);
    if (openLogin.ok) {
      logs.push(`Opened login entry via ${openLogin.strategy}`);
    }
    const loginPaths = ["/customer/account/login", "/login", "/account/login"];
    for (const loginPath of loginPaths) {
      try {
        const base = new URL(page.url());
        await page.goto(`${base.origin}${loginPath}`, {
          waitUntil: "domcontentloaded",
          timeout: timeoutMs,
        });
        if (await hasVisibleLoginForm(page)) {
          logs.push(`Navigated to login path ${loginPath}`);
          break;
        }
      } catch {
        // Try next known login path.
      }
    }
    if (await hasVisibleLoginForm(page)) {
      return buildResolverSuccess(params, { action, strategy: "login-form-visible", logs });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "login") {
    const email = parsedInstructions?.login.email?.trim() ?? "";
    const password = parsedInstructions?.login.password?.trim() ?? "";
    if (!email || !password) {
      logs.push("Missing login credentials in parsed test data.");
      return { matched: false, action, strategy: "missing-credentials", logs };
    }

    if (await isLoggedIn(page) || (await isCustomerLoggedIn(page))) {
      if (params.runId) {
        markRunAuthenticated(params.runId);
      }
      logs.push("Authenticated session already active; login step skipped.");
      return buildResolverSuccess(params, {
        action,
        strategy: "already-authenticated",
        logs,
      });
    }

    await dismissCheckoutBlockingModals(page, Math.min(timeoutMs, 6_000));
    await ensureLoginPage(page, Math.min(timeoutMs, 12_000), logs);
    const filled = await fillLoginFields(page, email, password, logs);
    if (!filled.emailOk || !filled.passOk) {
      logs.push("Login credentials could not be entered on the visible login form.");
      return { matched: false, action, strategy: "login-fields-not-filled", logs };
    }

    const submitted = await submitLoginForm(page, timeoutMs);
    if (!submitted) {
      const passwordField = loginPasswordField(page);
      await passwordField.press("Enter").catch(() => undefined);
    }

    await page
      .waitForURL(/customer\/account\/(index|dashboard)|is_logged_in=1/i, {
        timeout: Math.min(timeoutMs, 20_000),
      })
      .catch(() => undefined);
    await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);

    if (!(await isLoggedIn(page))) {
      logs.push(`Login submit completed but session was not established (url=${page.url()}).`);
      return { matched: false, action, strategy: "login-not-authenticated", logs };
    }

    if (params.runId) {
      markRunAuthenticated(params.runId);
    }

    return buildResolverSuccess(params, {
      action,
      strategy: "login-credentials-submitted",
      logs: [...logs, "Authenticated session established after credential login."],
    });
  }

  if (action === "openSearch") {
    const searchFocus = await focusHeaderSearchField(page, timeoutMs);
    if (searchFocus.ok) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: searchFocus.locator,
        strategy: searchFocus.strategy ?? "header-search-focus",
        logs,
      });
    }
    const openSearch = await clickByRoleOrText(page, ["search", "search bar"], timeoutMs);
    if (openSearch.ok) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: openSearch.locator,
        strategy: openSearch.strategy ?? "role",
        logs,
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "search") {
    let searchQuery = extractSearchQuery(params.intentText, parsedInstructions);
    if (!searchQuery && params.executionMemory) {
      searchQuery = extractSearchQueryFromMemory(params.executionMemory);
    }
    if (!searchQuery) {
      logs.push("No explicit search query found; refusing to use fallback search text.");
      return { matched: false, action, strategy: "none", logs };
    }
    await focusHeaderSearchField(page, timeoutMs);
    const searchField = page
      .locator(
        "#search, input[name='q'], input[type='search'], .block-search input[type='text'], input[placeholder*='search' i]"
      )
      .first();
    if ((await searchField.count()) > 0 && (await searchField.isVisible())) {
      await searchField.fill(searchQuery);
      await searchField.press("Enter").catch(() => undefined);
      return buildResolverSuccess(params, {
        action,
        usedLocator: "input[type='search']",
        strategy: "search-input",
        logs: [...logs, `Search submitted with query "${searchQuery}".`],
      });
    }
    const searchFill = await fillByLabelOrPlaceholder(page, ["search", "find"], searchQuery);
    if (searchFill.ok) {
      const filledField = page.locator("input[type='search'], input[name*='search' i]").first();
      await filledField.press("Enter").catch(() => undefined);
      return buildResolverSuccess(params, {
        action,
        usedLocator: searchFill.locator,
        strategy: searchFill.strategy ?? "placeholder",
        logs: [...logs, `Search submitted with query "${searchQuery}".`],
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "openProduct") {
    const openResult = await tryOpenFirstProduct(page, timeoutMs);
    if (openResult.ok) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: openResult.locator,
        strategy: openResult.strategy ?? "product-listing",
        logs,
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "buyOnce") {
    const buyOnceResult = await tryBuyOnceOptional(page, timeoutMs);
    if (buyOnceResult.ok) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: buyOnceResult.locator,
        strategy: buyOnceResult.strategy ?? "buy-once",
        logs: [...logs, "Buy once option selected."],
      });
    }
    logs.push("Buy once option not available on this product; skipped.");
    return buildResolverSuccess(params, {
      action,
      strategy: "optional-skipped",
      logs,
    });
  }

  if (action === "selectQuantity") {
    const quantity = extractQuantityValue(params.intentText, "1");
    if (!(await isProductDetailPage(page))) {
      logs.push("Quantity must be set on the product page; current page is not a PDP.");
      return { matched: false, action, strategy: "wrong-page", logs };
    }
    await prepareProductPageForAddToCart(page, logs, quantity);
    const quantityResult = await trySelectQuantity(page, quantity);
    if (quantityResult.ok) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: quantityResult.locator,
        strategy: quantityResult.strategy ?? "input-fill",
        logs: [...logs, `Quantity set to ${quantity} on product page.`],
      });
    }
    logs.push("No quantity dropdown found; default quantity of 1 is acceptable for this product.");
    return buildResolverSuccess(params, {
      action,
      strategy: "qty-default-skipped",
      logs,
    });
  }

  if (action === "moveToCart") {
    const cartResult = await tryNavigateToCart(page, timeoutMs);
    if (cartResult.ok) {
      await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
      const hasItems = await cartHasLineItems(page);
      if (params.runId) {
        await syncRunCartPopulatedFromPage(params.runId, hasItems);
      }
      return buildResolverSuccess(params, {
        action,
        usedLocator: cartResult.locator,
        strategy: cartResult.strategy ?? "role",
        logs,
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "clickCheckoutNext") {
    if ((await isPaymentStepVisible(page)) || isOnPaymentStep(page.url())) {
      if (params.runId) {
        markCheckoutPhase(params.runId, "payment");
      }
      return buildResolverSuccess(params, {
        action,
        strategy: "already-on-payment",
        logs: [...logs, "Already on payment step; shipping Next skipped."],
      });
    }
    const ready = await ensureCheckoutShippingStep(page, timeoutMs);
    if (!ready && !(await isPaymentStepVisible(page)) && !isOnPaymentStep(page.url())) {
      logs.push("Could not reach checkout shipping step before clicking Next.");
      return { matched: false, action, strategy: "wrong-page", logs };
    }
    const nextResult = await tryClickCheckoutNext(page, timeoutMs, { closePopupAfter: true });
    if (nextResult.ok) {
      await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
      if (params.runId) {
        if ((await isPaymentStepVisible(page)) || isOnPaymentStep(page.url())) {
          markCheckoutPhase(params.runId, "payment");
        } else if (isOnShippingStep(page.url())) {
          markCheckoutPhase(params.runId, "shipping");
        }
      }
      return buildResolverSuccess(params, {
        action,
        usedLocator: nextResult.locator,
        strategy: nextResult.strategy ?? "checkout-next",
        logs: [
          ...logs,
          nextResult.strategy === "already-on-payment"
            ? "Already on payment step; shipping Next skipped."
            : "Clicked shipping Next, dismissed AutoShip modal if present, and advanced toward payment.",
        ],
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "proceedToCheckout") {
    const preferAuthenticated = Boolean(
      (params.runId && isRunAuthenticated(params.runId)) || (await isLoggedIn(page))
    );
    const proceedResult = await tryProceedToCheckout(page, timeoutMs, {
      preferAuthenticated,
      loginEmail: params.parsedInstructions?.login.email,
      loginPassword: params.parsedInstructions?.login.password,
    });
    if (proceedResult.ok) {
      await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
      if (params.runId) {
        if ((await isPaymentStepVisible(page)) || isOnPaymentStep(page.url())) {
          markCheckoutPhase(params.runId, "payment");
        } else if (isOnShippingStep(page.url()) || (await isShippingStepVisible(page))) {
          markCheckoutPhase(params.runId, "shipping");
        }
      }
      return buildResolverSuccess(params, {
        action,
        usedLocator: proceedResult.locator,
        strategy: proceedResult.strategy ?? "proceed-to-checkout",
        logs: [...logs, "Reached checkout shipping step after Proceed to Checkout."],
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "navigateUrl") {
    const absoluteMatch = params.intentText.match(/https?:\/\/[^\s"'<>]+/i);
    const relativeMatch = params.intentText.match(
      /navigate to\s+(\/[^\s"'<>]+|[a-z0-9][^\s"'<>]*\.html(?:\?[^\s"'<>]*)?)/i
    );
    let targetUrl = absoluteMatch?.[0];
    if (!targetUrl && relativeMatch?.[1]) {
      try {
        targetUrl = new URL(relativeMatch[1], page.url()).href;
      } catch {
        targetUrl = undefined;
      }
    }
    if (targetUrl) {
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
      await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
      return buildResolverSuccess(params, {
        action,
        usedLocator: targetUrl,
        strategy: "memory-url",
        logs: [...logs, `Navigated to ${targetUrl}.`],
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "navigateSignup") {
    const signupUrl = new URL("/customer/account/create/", page.url()).href;
    await page.goto(signupUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    return buildResolverSuccess(params, {
      action,
      strategy: "account-create-url",
      logs: [...logs, "Opened signup page."],
    });
  }

  if (action === "navigateForgotPassword") {
    const forgotUrl = new URL("/customer/account/forgotpassword/", page.url()).href;
    await page.goto(forgotUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    return buildResolverSuccess(params, {
      action,
      strategy: "forgot-password-url",
      logs: [...logs, "Opened forgot password page."],
    });
  }

  if (action === "navigateAccountOrders") {
    const ordersUrl = new URL("/customer/account/order/history/", page.url()).href;
    await page.goto(ordersUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    return buildResolverSuccess(params, {
      action,
      strategy: "account-orders-url",
      logs: [...logs, "Opened account orders page."],
    });
  }

  if (action === "navigateAccountProfile") {
    const profileUrl = new URL("/customer/account/", page.url()).href;
    await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    return buildResolverSuccess(params, {
      action,
      strategy: "account-profile-url",
      logs: [...logs, "Opened account profile page."],
    });
  }

  if (action === "updateCartQuantity") {
    const quantity = extractQuantityValue(params.intentText, "2");
    const cartConfig = getSecondaryCartLineConfig(page.url());
    const updateResult = await tryUpdateCartQuantity(page, quantity, timeoutMs, {
      preferSecondaryLine: Boolean(cartConfig),
      secondaryItemNumber: cartConfig?.itemNumber,
    });
    if (updateResult.ok) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: updateResult.locator,
        strategy: updateResult.strategy ?? "cart-qty-update",
        logs: [
          ...logs,
          updateResult.strategy === "cart-qty-update-submit"
            ? `Updated cart quantity to ${quantity} and clicked Update Shopping Cart.`
            : `Updated cart quantity to ${quantity}.`,
        ],
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "addSecondaryCartLine") {
    const config = getSecondaryCartLineConfig(page.url());
    if (!config) {
      logs.push("No secondary cart line configuration for this site.");
      return { matched: false, action, strategy: "none", logs };
    }
    const pdpUrl = buildSecondaryCartLinePdpUrl(page.url(), config);
    const added = await tryAddSecondaryCartLineFromPdp(page, pdpUrl, config.itemNumber, timeoutMs);
    if (added.ok) {
      if (params.runId) {
        markRunCartPopulated(params.runId);
      }
      return buildResolverSuccess(params, {
        action,
        strategy: added.strategy ?? "secondary-line-added",
        logs: [
          ...logs,
          `Added second cart line item ${config.itemNumber} from PROPHYflex page (lines=${added.lineItemsAfter ?? "?"}).`,
        ],
      });
    }
    logs.push(
      `Failed to add second cart line item ${config.itemNumber} (strategy=${added.strategy}, lines=${added.lineItemsAfter ?? "?"}).`
    );
    return { matched: false, action, strategy: added.strategy ?? "none", logs };
  }

  if (action === "ensureSecondCartLine") {
    const memory = params.executionMemory;
    const config = getSecondaryCartLineConfig(page.url());
    const second = await tryEnsureSecondCartLineItem(page, timeoutMs, {
      productUrl: memory ? pickProductUrlFromMemory(memory) : undefined,
      searchQuery: memory ? extractSearchQueryFromMemory(memory) : undefined,
      secondaryPdpUrl: config ? buildSecondaryCartLinePdpUrl(page.url(), config) : undefined,
      secondaryItemNumber: config?.itemNumber,
    });
    const detail = `Cart line items after second-item attempt: ${second.lineItemsAfter ?? "unknown"} (${second.strategy}).`;
    if (second.ok) {
      if (params.runId && (await cartHasLineItems(page))) {
        markRunCartPopulated(params.runId);
      }
      return buildResolverSuccess(params, {
        action,
        strategy: second.strategy ?? "second-cart-line",
        logs: [...logs, detail],
      });
    }
    logs.push(detail);
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "restoreCart") {
    const memory = params.executionMemory;
    const restored = await tryRestoreCartIfEmpty(page, timeoutMs, {
      productUrl: memory ? pickProductUrlFromMemory(memory) : undefined,
      searchQuery: memory ? extractSearchQueryFromMemory(memory) : undefined,
    });
    if (restored.ok) {
      if (params.runId) {
        markRunCartPopulated(params.runId);
      }
      return buildResolverSuccess(params, {
        action,
        strategy: restored.strategy ?? "cart-restored",
        logs: [...logs, "Cart restored with at least one line item for downstream checkout."],
      });
    }
    logs.push("Checkout blocked because cart is empty and product could not be restored.");
    return { matched: false, action, strategy: "cart-restore-failed", logs };
  }

  if (action === "removeCartItem") {
    const memory = params.executionMemory;
    const cartConfig = getSecondaryCartLineConfig(page.url());
    const removeResult = await tryRemoveCartItem(page, timeoutMs, {
      productUrl: memory ? pickProductUrlFromMemory(memory) : undefined,
      searchQuery: memory ? extractSearchQueryFromMemory(memory) : undefined,
      prepareSecondLine: true,
      secondaryPdpUrl: cartConfig ? buildSecondaryCartLinePdpUrl(page.url(), cartConfig) : undefined,
      secondaryItemNumber: cartConfig?.itemNumber,
    });
    const metaLogs = [
      `Cart removal: before=${removeResult.lineItemsBefore ?? "?"} after=${removeResult.lineItemsAfter ?? "?"} secondItemAdded=${removeResult.secondItemAdded ? "yes" : "no"} modal=${removeResult.modalAppeared ? "yes" : "no"}.`,
      removeResult.decisionReason ?? "",
    ].filter(Boolean);
    if (removeResult.ok) {
      if (params.runId) {
        await syncRunCartPopulatedFromPage(params.runId, await cartHasLineItems(page));
      }
      return buildResolverSuccess(params, {
        action,
        usedLocator: removeResult.locator,
        strategy: removeResult.strategy ?? "cart-remove",
        logs: [...logs, ...metaLogs],
      });
    }
    return { matched: false, action, strategy: removeResult.strategy ?? "none", logs: [...logs, ...metaLogs] };
  }

  if (action === "applyCoupon") {
    const couponResult = await tryApplyCouponIfAvailable(page, timeoutMs);
    if (couponResult.ok) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: couponResult.locator,
        strategy: couponResult.strategy ?? "coupon",
        logs: [
          ...logs,
          couponResult.skipped ? "Coupon field not available; step skipped." : "Coupon apply attempted.",
        ],
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "applyCatalogFilter") {
    const filterResult = await tryApplyCatalogFilter(page, timeoutMs);
    if (filterResult.ok) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: filterResult.locator,
        strategy: filterResult.strategy ?? "catalog-filter",
        logs: [
          ...logs,
          filterResult.strategy === "catalog-price-filter" ||
          filterResult.strategy === "catalog-price-filter-clicked"
            ? "Applied Price layered filter (e.g. $0.00–$9.99) on category listing."
            : "Applied first available catalog filter.",
        ],
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "applyCatalogSort") {
    const sortResult = await tryApplyCatalogSort(page, timeoutMs);
    if (sortResult.ok) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: sortResult.locator,
        strategy: sortResult.strategy ?? "catalog-sort",
        logs: [...logs, "Applied first available sort option."],
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "goToListingPage2") {
    const pageResult = await tryGoToListingPage2(page, timeoutMs);
    const paginationLogs = [
      `Pagination: products before=${pageResult.productCountBefore ?? "?"} after=${pageResult.productCountAfter ?? "?"} emptyState=${pageResult.emptyStateDetected ? "yes" : "no"} url=${pageResult.pageUrl ?? page.url()}.`,
    ];
    if (pageResult.ok) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: pageResult.locator,
        strategy: pageResult.strategy ?? "catalog-pagination",
        logs: [...logs, ...paginationLogs, "Listing pagination validated on page 2."],
      });
    }
    if (pageResult.bugSummary) {
      paginationLogs.push(
        `BUG: ${pageResult.bugSummary} — ${pageResult.failureReason ?? "empty listing on page 2."}`
      );
    }
    return {
      matched: false,
      action,
      strategy: pageResult.strategy ?? "catalog-pagination-failed",
      logs: [...logs, ...paginationLogs],
    };
  }

  if (action === "guestCheckout") {
    if (!(await cartHasLineItems(page))) {
      logs.push("Guest checkout requires items in cart first.");
      return { matched: false, action, strategy: "empty-cart", logs };
    }
    const preferAuthenticated = Boolean(
      (params.runId && isRunAuthenticated(params.runId)) || (await isLoggedIn(page))
    );
    const proceedResult = await tryProceedToCheckout(page, timeoutMs, {
      preferAuthenticated,
      loginEmail: params.parsedInstructions?.login.email,
      loginPassword: params.parsedInstructions?.login.password,
    });
    if (proceedResult.ok) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: proceedResult.locator,
        strategy: proceedResult.strategy ?? "guest-checkout-proceed",
        logs: [...logs, "Reached checkout for guest checkout validation."],
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "closePopup") {
    const popupResult = await tryCloseCheckoutPopup(page, timeoutMs);
    if (popupResult.ok) {
      const onPayment = await ensureCheckoutPaymentStep(page, timeoutMs);
      return buildResolverSuccess(params, {
        action,
        usedLocator: popupResult.locator,
        strategy: popupResult.strategy ?? "modal-close",
        logs: [
          ...logs,
          popupResult.skipped ? "No popup visible; continued." : "Closed checkout popup/modal.",
          onPayment ? "Payment step is ready." : "Payment step not confirmed after popup handling.",
        ],
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "confirmCheckoutStep") {
    const phase = params.runId ? getCheckoutPhase(params.runId) : "none";
    const paymentUrl = new URL("/checkout/#payment", page.url()).href;

    if (!isOnPaymentStep(page.url()) && !(await isPaymentStepVisible(page))) {
      if (phase === "payment" || phase === "complete") {
        await page
          .goto(paymentUrl, { waitUntil: "domcontentloaded", timeout: Math.min(timeoutMs, 20_000) })
          .catch(() => undefined);
      } else {
        await ensureCheckoutPaymentStep(page, timeoutMs).catch(() => undefined);
      }
    }

    const onPayment =
      (await isPaymentStepVisible(page)) ||
      isOnPaymentStep(page.url()) ||
      phase === "complete";
    if (onPayment) {
      if (params.runId && phase !== "complete") {
        markCheckoutPhase(params.runId, "payment");
      }
      return buildResolverSuccess(params, {
        action,
        strategy: "checkout-step-confirmed",
        logs: [
          ...logs,
          /review/.test(params.intentText)
            ? "Checkout review step confirmed on payment page."
            : "Checkout payment step confirmed after shipping.",
        ],
      });
    }
    logs.push(`Checkout step confirmation failed (url=${page.url()}, phase=${phase}).`);
    return { matched: false, action, strategy: "checkout-step-not-ready", logs };
  }

  if (action === "clickKeepAsScheduled") {
    const keepResult = await tryClickKeepAsScheduled(page, timeoutMs);
    if (keepResult.ok && !keepResult.skipped) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: keepResult.locator ?? ".footer-btn-keep-autoship-as-schedule",
        strategy: keepResult.strategy ?? "keep-as-scheduled-autoship",
        logs: [
          ...logs,
          `Clicked KEEP AS SCHEDULED (.footer-btn-keep-autoship-as-schedule) and closed AutoShip modal.`,
        ],
      });
    }
    if (keepResult.ok && keepResult.skipped) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: keepResult.locator,
        strategy: keepResult.strategy ?? "autoship-not-required",
        logs: [
          ...logs,
          "AutoShip modal was not shown — checkout already past shipping or modal not required.",
        ],
      });
    }
    logs.push("AutoShip modal stayed open — KEEP AS SCHEDULED was not dismissed in time.");
    return { matched: false, action, strategy: keepResult.strategy ?? "autoship-dismiss-failed", logs };
  }

  if (action === "makePayment") {
    if (!(await isPaymentStepVisible(page)) && !isOnPaymentStep(page.url())) {
      await ensureCheckoutPaymentStep(page, timeoutMs).catch(() => undefined);
    }
    const payResult = await tryClickMakePayment(page, timeoutMs);
    if (payResult.ok) {
      if (params.runId) {
        markCheckoutCompleteAtMakePayment(params.runId);
      }
      const savedPayment = await hasSavedPaymentMethod(page);
      return buildResolverSuccess(params, {
        action,
        usedLocator: payResult.locator,
        strategy: payResult.strategy ?? "make-payment",
        logs: [
          ...logs,
          "Clicked MAKE PAYMENT on checkout payment step.",
          savedPayment
            ? "Saved payment credentials on file; checkout marked complete at Make Payment."
            : "Checkout marked complete after Make Payment click.",
        ],
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "fillCheckoutAddressIfNeeded") {
    const addressData = buildUsTestAddress(parsedInstructions);
    const addressResult = await tryFillCheckoutAddressIfNeeded(page, addressData, timeoutMs);
    logs.push(...addressResult.logs);
    if (addressResult.ok) {
      return buildResolverSuccess(params, {
        action,
        strategy: addressResult.strategy ?? "address-filled",
        logs,
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "fillPayment") {
    const paymentReady = await ensureCheckoutPaymentStep(page, timeoutMs);
    if (!paymentReady && !(await isPaymentStepVisible(page))) {
      logs.push("Could not reach checkout payment step before filling card details.");
      return { matched: false, action, strategy: "wrong-page", logs };
    }
    const paymentResult = await tryFillPaymentIfNeeded(page, () =>
      tryFillPaymentFields(page, parsedInstructions)
    );
    logs.push(...paymentResult.logs);
    if (paymentResult.ok) {
      return buildResolverSuccess(params, {
        action,
        strategy: paymentResult.strategy ?? "payment-filled",
        logs,
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "selectBillingAddress") {
    const billingResult = await trySelectDefaultBillingAddress(page, timeoutMs);
    if (billingResult.ok) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: billingResult.locator,
        strategy: billingResult.strategy ?? "billing-default",
        logs: [...logs, "Selected default/same-as-shipping billing address."],
      });
    }
    const billingClick = await clickByRoleOrText(
      page,
      ["use default", "default address", "same as shipping", "billing address"],
      timeoutMs
    );
    if (billingClick.ok) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: billingClick.locator,
        strategy: billingClick.strategy ?? "role",
        logs,
      });
    }
    const radio = page.locator("input[type='radio'][name*='billing' i], input[type='radio'][id*='billing' i]").first();
    if ((await radio.count()) > 0 && (await radio.isVisible())) {
      await radio.check().catch(() => undefined);
      return buildResolverSuccess(params, {
        action,
        usedLocator: "input[type='radio'][name*=billing]",
        strategy: "radio-check",
        logs,
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "placeOrder") {
    if (!(await isPaymentStepVisible(page)) && !isOnPaymentStep(page.url())) {
      await ensureCheckoutPaymentStep(page, timeoutMs);
    }
    if (await hasSavedPaymentMethod(page)) {
      logs.push("Saved payment on file; place order step skipped (flow stops at Make Payment).");
      return buildResolverSuccess(params, {
        action,
        strategy: "optional-skipped",
        logs,
      });
    }
    const orderClick = await clickByRoleOrText(
      page,
      ACTION_SYNONYMS.placeOrder,
      timeoutMs
    );
    if (orderClick.ok) {
      return buildResolverSuccess(params, {
        action,
        usedLocator: orderClick.locator,
        strategy: orderClick.strategy ?? "role",
        logs,
      });
    }
    const placeOrderButton = page
      .locator("button.action.primary.checkout, button[title='Place Order'], #place-order-trigger")
      .first();
    if ((await placeOrderButton.count()) > 0 && (await placeOrderButton.isVisible())) {
      await placeOrderButton.click({ timeout: timeoutMs });
      return buildResolverSuccess(params, {
        action,
        usedLocator: "button.place-order",
        strategy: "place-order-css",
        logs,
      });
    }
    return { matched: false, action, strategy: "none", logs };
  }

  if (action === "addToCart") {
    if (!(await isProductDetailPage(page))) {
      const memoryProduct = params.executionMemory
        ? pickProductUrlFromMemory(params.executionMemory)
        : undefined;
      if (memoryProduct) {
        await page.goto(memoryProduct, {
          waitUntil: "domcontentloaded",
          timeout: timeoutMs,
        });
        await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs }).catch(() => undefined);
        logs.push(`Navigated to known product URL from memory: ${memoryProduct}`);
      } else {
        const searchQuery = params.executionMemory
          ? extractSearchQueryFromMemory(params.executionMemory)
          : "";
        if (searchQuery) {
          const searchResult = await resolveAndExecuteIntent({
            ...params,
            intentText: `Search for '${searchQuery}'`,
          });
          logs.push(...searchResult.logs);
          if (searchResult.matched) {
            const openResult = await resolveAndExecuteIntent({
              ...params,
              intentText: "Open first product from the results",
            });
            logs.push(...openResult.logs);
          }
        }
      }
    }

    const quantity = extractQuantityValue(params.intentText, "1");
    await tryBuyOnceOptional(page, timeoutMs);
    await prepareProductPageForAddToCart(page, logs, quantity);
    const addResult = await tryClickAddToCart(page, timeoutMs);
    if (addResult.ok) {
      await page.waitForTimeout(500);
      if (params.runId && (await cartOrMinicartHasItems(page))) {
        markRunCartPopulated(params.runId);
      }
      return buildResolverSuccess(params, {
        action,
        usedLocator: addResult.locator,
        strategy: addResult.strategy ?? "pdp-add-to-cart",
        logs: [...logs, "Added product to cart from PDP."],
      });
    }
    logs.push("Scoped PDP add-to-cart click failed; trying semantic fallback.");
  }

  const semanticTerms =
    action === "addToCart"
      ? ACTION_SYNONYMS.addToCart
      : action === "checkout" || action === "proceedToCheckout"
        ? ACTION_SYNONYMS.proceedToCheckout
        : [intent];
  const semanticClick = await clickByRoleOrText(page, semanticTerms, timeoutMs);
  if (semanticClick.ok) {
    return buildResolverSuccess(params, {
      action,
      usedLocator: semanticClick.locator,
      strategy: semanticClick.strategy ?? "role",
      logs,
    });
  }

  const selectorPool = [
    ...(parsedInstructions?.selectors.cssSelectors ?? []),
    ...(parsedInstructions?.selectors.xpaths ?? []),
    ...(parsedInstructions?.selectors.playwrightLocators ?? []),
    ...((action === "generic" || action === "navigate") ? (params.memorySelectors ?? []) : []),
  ];
  const selectorResult = await trySelectorList(page, selectorPool, timeoutMs);
  if (selectorResult.ok) {
    return buildResolverSuccess(params, {
      action,
      usedLocator: selectorResult.locator,
      strategy: selectorResult.strategy ?? "css",
      logs,
    });
  }

  return {
    matched: false,
    action,
    strategy: "none",
    logs,
  };
}
