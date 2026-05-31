import type {
  DiscoveryButton,
  DiscoveryCapabilities,
  DiscoveryForm,
  DiscoveryLink,
  DiscoveryPage,
  WebsiteType,
} from "@/types";

export type RegressionSuite = "ecommerce" | "static" | "mixed";

export interface SiteClassification {
  websiteType: WebsiteType;
  suite: RegressionSuite;
  isOperationalStore: boolean;
  rationale: string[];
}

const OPERATIONAL_URL_PATTERNS = [
  /\/checkout(\/|$)/i,
  /\/cart(\/|$)/i,
  /\/customer\/account(\/|$)/i,
  /\/catalogsearch\//i,
  /\/catalog\/product\/view\//i,
  /\/product\/[^/]+\.html/i,
  /\/shop(\/|$)/i,
  /\/basket(\/|$)/i,
  /\/my-account(\/|$)/i,
];

export const operationalStoreUrlPatterns = OPERATIONAL_URL_PATTERNS;

const MARKETING_URL_PATTERNS = [
  /\/services?\//i,
  /\/solutions?\//i,
  /\/development/i,
  /\/consulting/i,
  /\/agency/i,
  /\/portfolio/i,
  /\/case-stud/i,
  /\/about(\/|$)/i,
  /\/contact(\/|$)/i,
  /\/careers?(\/|$)/i,
  /\/blog(\/|$)/i,
  /-demo(\/|$)/i,
  /\/industr/i,
];

const MARKETING_CONTENT_PATTERNS =
  /\b(development company|development services|consulting services|our services|case study|portfolio|we build|agency|solutions for)\b/i;

const STRONG_CART_BUTTON = /^(add to cart|add to bag|buy now|purchase|place order)$/i;

export function isStrongCartButtonText(text: string): boolean {
  return STRONG_CART_BUTTON.test(text.trim());
}

function countMatches(values: string[], patterns: RegExp[]): number {
  let count = 0;
  for (const value of values) {
    if (patterns.some((pattern) => pattern.test(value))) {
      count += 1;
    }
  }
  return count;
}

function sanitizeCapabilitiesForSuite(
  capabilities: DiscoveryCapabilities,
  suite: RegressionSuite,
  pages: DiscoveryPage[],
  links: DiscoveryLink[]
): DiscoveryCapabilities {
  const next: DiscoveryCapabilities = { ...capabilities };

  if (suite === "static") {
    next.productListing = false;
    next.productDetail = false;
    next.addToCart = false;
    next.cart = false;
    next.checkout = false;
    next.categories = false;
    next.search = false;
    next.login = false;
    next.signup = false;
  }

  if (suite === "mixed") {
    if (!capabilities.productListing && !capabilities.productDetail) {
      next.addToCart = false;
    }
    if (!capabilities.cart) {
      next.checkout = false;
    }
  }

  next.staticPages =
    next.staticPages ||
    pages.some((page) => /about|contact|privacy|terms|faq|services|solutions/i.test(page.url));
  next.brokenLinks = next.brokenLinks || links.length > 0;
  next.responsiveRiskAreas = true;

  return next;
}

export function classifyDiscoveredSite(input: {
  pages: DiscoveryPage[];
  capabilities: DiscoveryCapabilities;
  buttons: DiscoveryButton[];
  forms: DiscoveryForm[];
  links: DiscoveryLink[];
  pageBodiesSample?: string[];
}): SiteClassification {
  const rationale: string[] = [];
  const urls = input.pages.map((page) => page.url);
  const titles = input.pages.map((page) => page.title);

  const operationalUrlHits = countMatches(urls, OPERATIONAL_URL_PATTERNS);
  const marketingUrlHits = countMatches(urls, MARKETING_URL_PATTERNS);
  const strongCartButtons = input.buttons.filter((button) =>
    STRONG_CART_BUTTON.test(button.text.trim())
  ).length;
  const checkoutForms = input.forms.some((form) =>
    /card|cvv|payment|billing|shipping/.test(form.inputNames.join(" ").toLowerCase())
  );
  const marketingCopyHits = (input.pageBodiesSample ?? []).filter((body) =>
    MARKETING_CONTENT_PATTERNS.test(body)
  ).length;

  let operationalScore = 0;
  if (operationalUrlHits > 0) {
    operationalScore += 2;
    rationale.push(`Found ${operationalUrlHits} operational storefront URL pattern(s).`);
  }
  if (strongCartButtons > 0) {
    operationalScore += 2;
    rationale.push(`Found ${strongCartButtons} actionable cart/checkout button(s) in page UI.`);
  }
  if (input.capabilities.addToCart && input.capabilities.cart) {
    operationalScore += 1;
  }
  if (input.capabilities.checkout || checkoutForms) {
    operationalScore += 1;
    rationale.push("Checkout or payment form signals detected.");
  }

  let marketingScore = 0;
  if (marketingUrlHits >= 3) {
    marketingScore += 2;
    rationale.push(`Found ${marketingUrlHits} marketing/service content URL(s).`);
  }
  if (marketingCopyHits >= 2) {
    marketingScore += 1;
    rationale.push("Page copy indicates agency/marketing site rather than storefront.");
  }
  if (titles.some((title) => /development company|agency|consulting|services/i.test(title))) {
    marketingScore += 1;
    rationale.push("Page titles indicate services/marketing website.");
  }

  const isOperationalStore = operationalScore >= 3 && operationalScore > marketingScore;
  const hasPartialStore =
    !isOperationalStore &&
    operationalScore >= 1 &&
    (strongCartButtons > 0 ||
      input.capabilities.addToCart ||
      input.capabilities.cart ||
      operationalUrlHits > 0);

  let websiteType: WebsiteType = "Mixed";
  let suite: RegressionSuite = "static";

  if (isOperationalStore) {
    suite = "ecommerce";
    websiteType = urls.some((url) => /marketplace|vendor|seller/i.test(url))
      ? "Marketplace"
      : "Ecommerce";
    rationale.push("Classified as operational ecommerce storefront.");
  } else if (hasPartialStore && marketingScore >= 1) {
    suite = "mixed";
    websiteType = "Mixed";
    rationale.push(
      "Partial ecommerce signals with marketing content — mixed suite (ecommerce tests only where detected)."
    );
  } else if (marketingUrlHits >= 2 || marketingScore >= 2) {
    websiteType = "Corporate";
    rationale.push("Classified as corporate/marketing website — static regression suite selected.");
  } else if (input.pages.length <= 3) {
    websiteType = "Static";
    rationale.push("Small surface area — static regression suite selected.");
  } else if (input.capabilities.blogPages) {
    websiteType = "Blog";
  } else {
    websiteType = "Mixed";
    rationale.push("No operational storefront detected — static regression suite selected.");
  }

  return {
    websiteType,
    suite,
    isOperationalStore,
    rationale,
  };
}

export function applySiteClassification(input: {
  pages: DiscoveryPage[];
  capabilities: DiscoveryCapabilities;
  buttons: DiscoveryButton[];
  forms: DiscoveryForm[];
  links: DiscoveryLink[];
  pageBodiesSample?: string[];
}): {
  classification: SiteClassification;
  capabilities: DiscoveryCapabilities;
  websiteType: WebsiteType;
} {
  const classification = classifyDiscoveredSite(input);
  const capabilities = sanitizeCapabilitiesForSuite(
    input.capabilities,
    classification.suite,
    input.pages,
    input.links
  );

  return {
    classification,
    capabilities,
    websiteType: classification.websiteType,
  };
}

export function shouldGenerateEcommerceSuite(input: {
  websiteType: WebsiteType;
  capabilities: DiscoveryCapabilities;
  siteSuite?: RegressionSuite;
  classification?: SiteClassification;
}): boolean {
  if (input.siteSuite === "static") {
    return false;
  }
  if (input.siteSuite === "ecommerce" || input.siteSuite === "mixed") {
    return true;
  }
  if (input.classification) {
    return (
      input.classification.suite === "ecommerce" || input.classification.suite === "mixed"
    );
  }
  if (input.websiteType === "Ecommerce" || input.websiteType === "Marketplace") {
    return true;
  }
  return false;
}
