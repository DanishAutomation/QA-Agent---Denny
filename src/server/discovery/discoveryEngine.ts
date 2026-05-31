import { chromium, type Browser } from "playwright-core";
import type {
  DiscoveryButton,
  DiscoveryCapabilities,
  DiscoveryEngineOptions,
  DiscoveryForm,
  DiscoveryLink,
  DiscoveryPage,
  DiscoveryProgressUpdate,
  DiscoveryResult,
  WebsiteType,
} from "@/types";
import {
  buildDiscoveryCacheKey,
  readCachedDiscovery,
  writeCachedDiscovery,
} from "./discoveryCacheStore";
import { applySiteClassification, operationalStoreUrlPatterns, isStrongCartButtonText } from "./websiteClassification";

const DEFAULT_OPTIONS: DiscoveryEngineOptions = {
  maxDepth: 2,
  maxPages: 20,
  maxLinksPerPage: 60,
};

const DISCOVERY_TIMEOUT_MS = 180_000;
const DISCOVERY_FAST_PATH_TIMEOUT_MS = 25_000;

const FALLBACK_BROWSER_PATHS = [
  process.env.PLAYWRIGHT_BROWSER_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean) as string[];

interface QueueItem {
  url: string;
  depth: number;
}

function cloneDiscoveryResult(result: DiscoveryResult): DiscoveryResult {
  if (typeof structuredClone === "function") {
    return structuredClone(result);
  }
  return JSON.parse(JSON.stringify(result)) as DiscoveryResult;
}

function normalizeUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }
  if (url.username && !url.password && url.hostname.includes(".")) {
    const pathname = url.pathname === "/" ? "" : url.pathname;
    return `${url.protocol}//${url.username}.${url.hostname}${pathname}${url.search}`;
  }
  url.hash = "";
  if (url.pathname.endsWith("/") && url.pathname !== "/") {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}

function initCapabilities(): DiscoveryCapabilities {
  return {
    login: false,
    signup: false,
    search: false,
    categories: false,
    productListing: false,
    productDetail: false,
    addToCart: false,
    cart: false,
    checkout: false,
    contactForm: false,
    newsletterForm: false,
    quoteForm: false,
    staticPages: false,
    blogPages: false,
    brokenLinks: false,
    responsiveRiskAreas: false,
  };
}

async function launchBrowser(): Promise<Browser> {
  const launchOptions = { headless: true, timeout: 30_000 };
  try {
    return await chromium.launch(launchOptions);
  } catch {
    for (const executablePath of FALLBACK_BROWSER_PATHS) {
      try {
        return await chromium.launch({ ...launchOptions, executablePath });
      } catch {
        // Try next browser path.
      }
    }
    throw new Error(
      "Could not launch Playwright browser. Install browsers or set PLAYWRIGHT_BROWSER_PATH."
    );
  }
}

function detectFormType(inputNames: string[], contextText: string): DiscoveryForm["formType"] {
  const combined = `${inputNames.join(" ")} ${contextText}`.toLowerCase();
  const hasPassword = /password|passwd/.test(combined);
  if (hasPassword && /(login|signin|sign in|otp|email)/.test(combined)) {
    return "login";
  }
  if (/(register|create account|signup|sign up)/.test(combined)) {
    return "signup";
  }
  if (/(newsletter|subscribe)/.test(combined)) {
    return "newsletter";
  }
  if (/(quote|estimate|pricing request)/.test(combined)) {
    return "quote";
  }
  if (/(contact|message|subject)/.test(combined)) {
    return "contact";
  }
  return "other";
}

function buildJourneys(capabilities: DiscoveryCapabilities): string[] {
  const journeys: string[] = [];
  if (capabilities.signup && capabilities.login) {
    journeys.push("Visitor -> Signup -> Login");
  }
  if (capabilities.productListing && capabilities.productDetail) {
    journeys.push("Category -> Product Listing -> Product Detail");
  }
  if (capabilities.addToCart && capabilities.cart && capabilities.checkout) {
    journeys.push("Product Detail -> Add to Cart -> Cart -> Checkout");
  }
  if (capabilities.contactForm || capabilities.quoteForm) {
    journeys.push("Landing Page -> Contact/Quote Form Submission");
  }
  if (capabilities.blogPages) {
    journeys.push("Homepage -> Blog Listing -> Blog Detail");
  }
  return journeys;
}

export async function runDiscovery(
  websiteUrl: string,
  options: Partial<DiscoveryEngineOptions> = {}
): Promise<DiscoveryResult> {
  const discoveryTimeoutMs =
    options.maxPages && options.maxPages <= 3
      ? DISCOVERY_FAST_PATH_TIMEOUT_MS
      : DISCOVERY_TIMEOUT_MS;
  return Promise.race([
    runDiscoveryInternal(websiteUrl, options),
    new Promise<DiscoveryResult>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Discovery timed out after ${Math.round(discoveryTimeoutMs / 1000)}s.`)),
        discoveryTimeoutMs
      );
    }),
  ]);
}

export function createMinimalDiscoveryResult(websiteUrl: string): DiscoveryResult {
  const baseUrl = normalizeUrl(websiteUrl);
  const now = new Date().toISOString();
  const capabilities: DiscoveryCapabilities = {
    login: true,
    signup: false,
    search: true,
    categories: true,
    productListing: true,
    productDetail: true,
    addToCart: true,
    cart: true,
    checkout: true,
    contactForm: false,
    newsletterForm: false,
    quoteForm: false,
    staticPages: true,
    blogPages: false,
    brokenLinks: false,
    responsiveRiskAreas: false,
  };

  return {
    baseUrl,
    websiteType: "Ecommerce",
    capabilities,
    pagesFound: [
      {
        url: baseUrl,
        title: "Homepage (fast-path discovery)",
        depth: 0,
        status: 200,
      },
    ],
    formsFound: [],
    buttonsFound: [],
    linksFound: [],
    possibleJourneys: [
      "Product Detail -> Add to Cart -> Cart -> Checkout",
    ],
    importantSelectors: ["#search", "input[name='q']", "#product-addtocart-button"],
    detectedEcommerceSignals: ["custom-command-fast-path"],
    detectedFormSignals: [],
    detectedStaticPages: [],
    startedAt: now,
    completedAt: now,
    crawlDepthUsed: 0,
  };
}

async function runDiscoveryInternal(
  websiteUrl: string,
  options: Partial<DiscoveryEngineOptions> = {}
): Promise<DiscoveryResult> {
  const baseUrl = normalizeUrl(websiteUrl);
  const baseOrigin = new URL(baseUrl).origin;
  const resolvedOptions: DiscoveryEngineOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };
  const cacheKey = buildDiscoveryCacheKey(baseUrl, resolvedOptions);
  const cached = readCachedDiscovery(cacheKey);
  if (cached) {
    resolvedOptions.onProgress?.({
      stage: "complete",
      message: `Using cached discovery for ${baseOrigin} (${cached.pagesFound.length} pages, ${cached.linksFound.length} links).`,
      pagesCrawled: cached.pagesFound.length,
      maxPages: resolvedOptions.maxPages,
      currentUrl: baseUrl,
    });
    return cached;
  }

  const pagesFound: DiscoveryPage[] = [];
  const formsFound: DiscoveryForm[] = [];
  const buttonsFound: DiscoveryButton[] = [];
  const linksFound: DiscoveryLink[] = [];
  const importantSelectors = new Set<string>();
  const ecommerceSignals = new Set<string>();
  const formSignals = new Set<string>();
  const staticPages = new Set<string>();
  const pageBodiesSample: string[] = [];
  const capabilities = initCapabilities();
  const startedAt = new Date().toISOString();

  const visited = new Set<string>();
  const queued = new Set<string>();
  const queue: QueueItem[] = [{ url: baseUrl, depth: 0 }];
  queued.add(baseUrl);

  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  let lastProgressAt = Date.now();
  const emitProgress = (update: DiscoveryProgressUpdate) => {
    lastProgressAt = Date.now();
    resolvedOptions.onProgress?.(update);
  };
  const heartbeat = resolvedOptions.onProgress
    ? setInterval(() => {
        if (Date.now() - lastProgressAt < 8000) {
          return;
        }
        emitProgress({
          stage: "crawling",
          message: `Discovery crawl in progress (${pagesFound.length}/${resolvedOptions.maxPages} pages)...`,
          pagesCrawled: pagesFound.length,
          maxPages: resolvedOptions.maxPages,
          currentUrl: pagesFound.at(-1)?.url ?? baseUrl,
        });
      }, 8000)
    : null;

  let result: DiscoveryResult | undefined;

  try {
    while (queue.length > 0 && pagesFound.length < resolvedOptions.maxPages) {
      const current = queue.shift()!;
      queued.delete(current.url);
      if (visited.has(current.url)) {
        continue;
      }

      visited.add(current.url);

      let status = 0;
      try {
        const response = await page.goto(current.url, {
          waitUntil: "domcontentloaded",
          timeout: 15_000,
        });
        status = response?.status() ?? 0;
      } catch {
        pagesFound.push({
          url: current.url,
          title: "Unreachable Page",
          depth: current.depth,
          status: 0,
        });
        continue;
      }

      const snapshot = await page.evaluate((maxLinksPerPage) => {
        const title = document.title || "Untitled Page";

        const links = Array.from(document.querySelectorAll("a[href]"))
          .slice(0, maxLinksPerPage)
          .map((node) => ({
            href: (node as HTMLAnchorElement).href || "",
            text: (node.textContent || "").trim(),
          }));

        const forms = Array.from(document.querySelectorAll("form")).map((form) => {
          const htmlForm = form as HTMLFormElement;
          const inputNames = Array.from(
            form.querySelectorAll("input, textarea, select")
          ).map((field) => {
            const input =
              (field.getAttribute("name") ||
                field.getAttribute("id") ||
                field.getAttribute("placeholder") ||
                field.getAttribute("type") ||
                "") ?? "";
            return input.toLowerCase();
          });
          return {
            action: htmlForm.action || "",
            method: (htmlForm.method || "get").toLowerCase(),
            inputNames,
            contextText: (form.textContent || "").slice(0, 250),
          };
        });

        const buttons = Array.from(document.querySelectorAll("button, input[type='submit']"))
          .slice(0, 80)
          .map((button, index) => {
            const text = (button.textContent || button.getAttribute("value") || "").trim();
            const id = button.getAttribute("id");
            const testId = button.getAttribute("data-testid");
            const className = button.getAttribute("class")?.split(" ").filter(Boolean)[0];
            let selectorHint = button.tagName.toLowerCase();
            if (testId) {
              selectorHint = `[data-testid="${testId}"]`;
            } else if (id) {
              selectorHint = `#${id}`;
            } else if (className) {
              selectorHint = `.${className}`;
            } else {
              selectorHint = `${button.tagName.toLowerCase()}:nth-of-type(${index + 1})`;
            }
            return { text, selectorHint };
          });

        const selectorCandidates = Array.from(
          document.querySelectorAll("[data-testid], [id], input[name], button[id], nav a")
        )
          .slice(0, 120)
          .map((node) => {
            const id = node.getAttribute("id");
            const dataTestId = node.getAttribute("data-testid");
            const name = node.getAttribute("name");
            if (dataTestId) {
              return `[data-testid="${dataTestId}"]`;
            }
            if (id) {
              return `#${id}`;
            }
            if (name && node.tagName.toLowerCase() === "input") {
              return `input[name="${name}"]`;
            }
            return node.tagName.toLowerCase();
          });

        const bodyText = document.body.innerText.toLowerCase();
        return { title, links, forms, buttons, selectorCandidates, bodyText };
      }, resolvedOptions.maxLinksPerPage);

      pagesFound.push({
        url: current.url,
        title: snapshot.title,
        depth: current.depth,
        status,
      });
      emitProgress({
        stage: "crawling",
        message: `Crawled page ${pagesFound.length}/${resolvedOptions.maxPages}: ${snapshot.title || current.url}`,
        pagesCrawled: pagesFound.length,
        maxPages: resolvedOptions.maxPages,
        currentUrl: current.url,
      });

      const lowerUrl = current.url.toLowerCase();
      if (/(about|contact|privacy|terms|faq)/.test(lowerUrl)) {
        staticPages.add(current.url);
      }
      if (/(blog|article|news)/.test(lowerUrl)) {
        capabilities.blogPages = true;
      }
      pageBodiesSample.push(snapshot.bodyText.slice(0, 1200));
      if (/(mobile|viewport|overflow|responsive)/.test(snapshot.bodyText)) {
        capabilities.responsiveRiskAreas = true;
      }

      if (operationalStoreUrlPatterns.some((pattern) => pattern.test(lowerUrl))) {
        ecommerceSignals.add(`operational-url@${current.url}`);
        if (/\/cart|\/basket/i.test(lowerUrl)) {
          capabilities.cart = true;
        }
        if (/\/checkout/i.test(lowerUrl)) {
          capabilities.checkout = true;
        }
        if (/\/product\/|\/catalog\/product\//i.test(lowerUrl)) {
          capabilities.productDetail = true;
        }
        if (/\/catalogsearch|\/search/i.test(lowerUrl)) {
          capabilities.search = true;
        }
        if (/\/customer\/account|\/login|\/signin/i.test(lowerUrl)) {
          capabilities.login = true;
        }
      }

      for (const selector of snapshot.selectorCandidates) {
        importantSelectors.add(selector);
      }

      for (const form of snapshot.forms) {
        const formType = detectFormType(form.inputNames, form.contextText);
        formsFound.push({
          pageUrl: current.url,
          action: form.action,
          method: form.method,
          inputNames: form.inputNames,
          formType,
        });
        formSignals.add(`${formType}@${current.url}`);
        if (formType === "login") {
          capabilities.login = true;
        }
        if (formType === "signup") {
          capabilities.signup = true;
        }
        if (formType === "contact") {
          capabilities.contactForm = true;
        }
        if (formType === "newsletter") {
          capabilities.newsletterForm = true;
        }
        if (formType === "quote") {
          capabilities.quoteForm = true;
        }
      }

      for (const button of snapshot.buttons) {
        buttonsFound.push({
          pageUrl: current.url,
          text: button.text,
          selectorHint: button.selectorHint,
        });
        if (isStrongCartButtonText(button.text)) {
          capabilities.addToCart = true;
          ecommerceSignals.add(`cart-button@${current.url}`);
        }
      }

      for (const link of snapshot.links) {
        if (!link.href) {
          continue;
        }
        let normalized = "";
        try {
          normalized = normalizeUrl(link.href);
        } catch {
          continue;
        }
        const sameOrigin = normalized.startsWith(baseOrigin);
        linksFound.push({
          fromUrl: current.url,
          toUrl: normalized,
          text: link.text || "(no text)",
          isBroken: false,
        });

        const textBlob = `${link.text} ${normalized}`.toLowerCase();
        if (/about|contact|privacy|terms|faq|services|solutions/.test(textBlob)) {
          capabilities.staticPages = true;
        }
        if (/blog|article/.test(textBlob)) {
          capabilities.blogPages = true;
        }

        if (
          sameOrigin &&
          current.depth < resolvedOptions.maxDepth &&
          !visited.has(normalized) &&
          !queued.has(normalized) &&
          queue.length + visited.size < resolvedOptions.maxPages * 2
        ) {
          queue.push({ url: normalized, depth: current.depth + 1 });
          queued.add(normalized);
        }
      }
    }

    // Link health checks run during execution (brokenLinksFormsEngine), not discovery.
    capabilities.brokenLinks = linksFound.some((link) => link.toUrl.startsWith(baseOrigin));

    emitProgress({
      stage: "crawling",
      message: `Analyzing ${pagesFound.length} crawled pages and classifying site capabilities...`,
      pagesCrawled: pagesFound.length,
      maxPages: resolvedOptions.maxPages,
      currentUrl: pagesFound.at(-1)?.url ?? baseUrl,
    });

    const classified = applySiteClassification({
      pages: pagesFound,
      capabilities,
      buttons: buttonsFound,
      forms: formsFound,
      links: linksFound,
      pageBodiesSample: pageBodiesSample.slice(0, 8),
    });

    emitProgress({
      stage: "complete",
      message: `Discovery classified site as ${classified.websiteType} (${classified.classification.suite} suite).`,
      pagesCrawled: pagesFound.length,
      maxPages: resolvedOptions.maxPages,
      currentUrl: baseUrl,
    });

    const websiteType = classified.websiteType;
    const possibleJourneys = buildJourneys(classified.capabilities);
    const completedAt = new Date().toISOString();

    result = {
      baseUrl,
      websiteType,
      capabilities: classified.capabilities,
      pagesFound,
      formsFound,
      buttonsFound,
      linksFound,
      possibleJourneys,
      importantSelectors: [...importantSelectors].slice(0, 150),
      detectedEcommerceSignals: [...ecommerceSignals],
      detectedFormSignals: [...formSignals],
      detectedStaticPages: [...staticPages],
      startedAt,
      completedAt,
      crawlDepthUsed: resolvedOptions.maxDepth,
      siteSuite: classified.classification.suite,
      classificationNotes: classified.classification.rationale,
    };
    writeCachedDiscovery(cacheKey, baseUrl, result);
  } finally {
    if (heartbeat) {
      clearInterval(heartbeat);
    }
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }

  if (!result) {
    throw new Error("Discovery finished without producing a result.");
  }
  return result;
}
