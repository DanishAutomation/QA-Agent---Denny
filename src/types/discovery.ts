export type WebsiteType =
  | "Ecommerce"
  | "Marketplace"
  | "SaaS"
  | "Static"
  | "Corporate"
  | "Blog"
  | "Educational"
  | "Healthcare"
  | "Financial"
  | "Mixed";

export interface DiscoveryCapabilities {
  login: boolean;
  signup: boolean;
  search: boolean;
  categories: boolean;
  productListing: boolean;
  productDetail: boolean;
  addToCart: boolean;
  cart: boolean;
  checkout: boolean;
  contactForm: boolean;
  newsletterForm: boolean;
  quoteForm: boolean;
  staticPages: boolean;
  blogPages: boolean;
  brokenLinks: boolean;
  responsiveRiskAreas: boolean;
}

export interface DiscoveryPage {
  url: string;
  title: string;
  depth: number;
  status: number;
}

export interface DiscoveryForm {
  pageUrl: string;
  action: string;
  method: string;
  inputNames: string[];
  formType: "login" | "signup" | "contact" | "newsletter" | "quote" | "other";
}

export interface DiscoveryButton {
  pageUrl: string;
  text: string;
  selectorHint: string;
}

export interface DiscoveryLink {
  fromUrl: string;
  toUrl: string;
  text: string;
  isBroken: boolean;
}

export interface DiscoveryEngineOptions {
  maxDepth: number;
  maxPages: number;
  maxLinksPerPage: number;
  onProgress?: (update: DiscoveryProgressUpdate) => void;
}

export interface DiscoveryProgressUpdate {
  stage: "crawling" | "complete";
  message: string;
  pagesCrawled: number;
  maxPages: number;
  currentUrl?: string;
}

export interface DiscoveryResult {
  baseUrl: string;
  websiteType: WebsiteType;
  capabilities: DiscoveryCapabilities;
  pagesFound: DiscoveryPage[];
  formsFound: DiscoveryForm[];
  buttonsFound: DiscoveryButton[];
  linksFound: DiscoveryLink[];
  possibleJourneys: string[];
  importantSelectors: string[];
  detectedEcommerceSignals: string[];
  detectedFormSignals: string[];
  detectedStaticPages: string[];
  startedAt: string;
  completedAt: string;
  crawlDepthUsed: number;
  siteSuite?: "ecommerce" | "static" | "mixed";
  classificationNotes?: string[];
}
