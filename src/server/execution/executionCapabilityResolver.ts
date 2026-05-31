import type { DiscoveryCapabilities, DiscoveryResult } from "@/types";
import type { DomainExecutionMemory } from "./executionMemoryStore";

function mergeCapabilityFlags(
  base: DiscoveryCapabilities,
  ...patches: Array<Partial<DiscoveryCapabilities> | undefined>
): DiscoveryCapabilities {
  const merged = { ...base };
  for (const patch of patches) {
    if (!patch) {
      continue;
    }
    for (const [key, value] of Object.entries(patch)) {
      if (typeof value === "boolean" && value) {
        merged[key as keyof DiscoveryCapabilities] = true;
      }
    }
  }
  return merged;
}

export function inferCapabilitiesFromDiscovery(
  discovery: DiscoveryResult
): Partial<DiscoveryCapabilities> {
  const inferred: Partial<DiscoveryCapabilities> = {};
  const pageUrls = discovery.pagesFound.map((page) => page.url.toLowerCase());
  const formActions = discovery.formsFound.map((form) => form.action.toLowerCase());
  const combined = `${pageUrls.join("|")}|${formActions.join("|")}`;

  if (
    /catalogsearch|\/search\b|[?&]q=/.test(combined) ||
    discovery.formsFound.some((form) => form.inputNames.some((name) => /^q$/i.test(name)))
  ) {
    inferred.search = true;
  }

  const listingPages = pageUrls.filter(
    (url) =>
      /\.html(?:$|[?#])/.test(url) &&
      !/\/product\//.test(url) &&
      !url.includes("/customer/") &&
      !url.includes("/checkout")
  );
  if (listingPages.length >= 2) {
    inferred.productListing = true;
    inferred.categories = true;
  }

  if (
    pageUrls.some((url) => /\/product\//.test(url)) ||
    discovery.detectedEcommerceSignals?.some((signal) => /product|pdp|sku/i.test(signal))
  ) {
    inferred.productDetail = true;
  }

  if (
    formActions.some((action) => /checkout\/cart\/add|cart\/add/i.test(action)) ||
    discovery.buttonsFound?.some((button) => /add to cart|buy now/i.test(button.text))
  ) {
    inferred.addToCart = true;
  }

  if (pageUrls.some((url) => /\/checkout\/cart|\/cart(?:\/|$|[?#])/.test(url))) {
    inferred.cart = true;
  }

  if (pageUrls.some((url) => /\/checkout(?:\/|$|[?#])/.test(url))) {
    inferred.checkout = true;
  }

  if (pageUrls.some((url) => /\/customer\/account\/login|loginpost/i.test(url))) {
    inferred.login = true;
  }

  return inferred;
}

export function buildCapabilityMapFromMemory(
  memory: DomainExecutionMemory
): Partial<DiscoveryCapabilities> & Record<string, boolean | undefined> {
  const paths = memory.successfulFlowPaths.join("|").toLowerCase();
  const selectors = memory.successfulSelectors.join("|").toLowerCase();
  const commands = memory.customCommandMappings
    .filter((entry) => entry.success)
    .map((entry) => `${entry.command}|${entry.mappedAction}`)
    .join("|")
    .toLowerCase();
  const combined = `${paths}|${selectors}|${commands}`;
  const caps: Partial<DiscoveryCapabilities> & Record<string, boolean | undefined> = {};

  if (/catalogsearch|[?&]q=|placeholder~=\s*search|input\[type=['"]search['"]\]|name=['"]q['"]/.test(combined)) {
    caps.search = true;
  }
  if (/\/product\/|product-item|pdp |\.product-item-link|product-addtocart/.test(combined)) {
    caps.productDetail = true;
    caps.productListing = true;
  }
  if (/add to cart|addtocart|product-addtocart|checkout\/cart\/add/.test(combined)) {
    caps.addToCart = true;
  }
  if (/buy once|buy-once|sku=/.test(combined)) {
    caps.pdpChildSkus = true;
  }
  if (/checkout\/cart|href\*=['"]\/checkout\/cart|\/cart(?:\/|$|[?#])/.test(combined)) {
    caps.cart = true;
  }
  if (/\/checkout(?:\/|$|[?#])|proceed-to-checkout|place-order/.test(combined)) {
    caps.checkout = true;
  }
  if (/is_logged_in=1|customer\/account(?!\/login)/.test(combined)) {
    caps.login = true;
  }
  if (/\.html|category|gloves|purelife-collection/.test(paths)) {
    caps.categories = true;
    caps.productListing = true;
  }

  return caps;
}

export function inferSiteSpecificCapabilities(
  discovery: DiscoveryResult,
  memoryCaps?: Partial<DiscoveryCapabilities> & Record<string, boolean | undefined>
): Record<string, boolean> {
  const links = (discovery.linksFound ?? []).join("|").toLowerCase();
  const pages = discovery.pagesFound.map((page) => page.url).join("|").toLowerCase();
  const buttons = (discovery.buttonsFound ?? []).map((button) => button.text).join("|").toLowerCase();
  const combined = `${links}|${pages}|${buttons}`;
  const memoryText = memoryCaps
    ? Object.entries(memoryCaps)
        .filter(([, value]) => value)
        .map(([key]) => key)
        .join("|")
    : "";

  const caps: Record<string, boolean> = {};

  const categoryListingPages = discovery.pagesFound.filter(
    (page) =>
      /\.html(?:$|[?#])/i.test(page.url) &&
      !/\/product\//i.test(page.url) &&
      !/\/customer\//i.test(page.url) &&
      !/\/checkout/i.test(page.url) &&
      !/catalogsearch/i.test(page.url)
  );
  if (categoryListingPages.length > 0) {
    caps.filters = true;
    caps.pagination = true;
    caps.sorting = caps.sorting || categoryListingPages.length > 0;
  }

  caps.filters =
    caps.filters ||
    /layered|amshopby|shopby|filter=|\/filter\/|facet|narrow-by|block-filter|filter-options/.test(
      combined
    );
  caps.pagination =
    caps.pagination ||
    /[?&]p=\d|[?&]page=\d|pages-item|pages-items|pager|pagination|toolbar-amount/.test(combined);
  caps.sorting = /product_list_order|sort=|sorter|sort by|data-role=['"]sorter/.test(combined);

  caps.pdpColor = /super_attribute.*color|color swatch|swatch-option-color|attribute.*\bcolor\b/.test(
    combined
  );
  caps.pdpSize = /super_attribute.*size|size swatch|attribute.*\bsize\b|configurable.*size/.test(
    combined
  );
  caps.pdpVariants =
    caps.pdpColor ||
    caps.pdpSize ||
    (/super_attribute|configurable|swatch-option/.test(combined) &&
      !/product-options-wrapper/.test(combined));
  caps.pdpChildSkus =
    Boolean(memoryCaps?.pdpChildSkus) ||
    (/buy once|buy-once|sku=|child sku|item number|simple product/.test(combined + memoryText) &&
      !caps.pdpColor &&
      !caps.pdpSize);

  if (caps.pdpChildSkus) {
    caps.pdpColor = false;
    caps.pdpSize = false;
    caps.pdpVariants = false;
  }

  caps.pdpQuantity = true;
  caps.pdpImage = true;
  caps.pdpInventory = true;

  return caps;
}

export function resolveExecutionCapabilities(
  discovery: DiscoveryResult,
  memoryCaps?: Partial<DiscoveryCapabilities>,
  allowsEcommerce = true
): DiscoveryCapabilities {
  const inferred = inferCapabilitiesFromDiscovery(discovery);
  const merged = mergeCapabilityFlags(discovery.capabilities, inferred, memoryCaps);

  if (!allowsEcommerce) {
    return discovery.capabilities;
  }

  merged.productListing =
    merged.productListing ||
    merged.productDetail ||
    merged.categories ||
    merged.search;
  merged.categories = merged.categories || merged.productListing || merged.productDetail;
  merged.search = merged.search || merged.productListing || merged.productDetail;
  merged.productDetail =
    merged.productDetail || merged.productListing || merged.addToCart;
  merged.addToCart =
    merged.addToCart || (merged.productDetail && merged.cart) || merged.productListing;

  return merged;
}
