import type { DiscoveryPage } from "@/types";

const BOT_CHALLENGE_TITLE = /just a moment|access denied|attention required|cloudflare/i;

export function isBotChallengeTitle(title: string): boolean {
  return BOT_CHALLENGE_TITLE.test(title.trim());
}

export function pickDiscoverySamplePages(
  pages: DiscoveryPage[],
  baseUrl: string,
  maxPages: number
): string[] {
  const origin = new URL(baseUrl).origin;
  const seen = new Set<string>();
  const ordered: string[] = [];

  const push = (url: string) => {
    const normalized = url.replace(/\/$/, "") || url;
    if (seen.has(normalized)) {
      return;
    }
    if (!normalized.startsWith(origin)) {
      return;
    }
    seen.add(normalized);
    ordered.push(url);
  };

  push(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

  const byPriority = [...pages].sort((a, b) => {
    const score = (page: DiscoveryPage) => {
      const url = page.url.toLowerCase();
      let value = 0;
      if (/(about|contact|services|solutions|portfolio|case-stud)/.test(url)) value += 3;
      if (page.depth <= 1) value += 2;
      if (isBotChallengeTitle(page.title)) value -= 5;
      return value;
    };
    return score(b) - score(a);
  });

  for (const page of byPriority) {
    if (isBotChallengeTitle(page.title)) {
      continue;
    }
    push(page.url);
    if (ordered.length >= maxPages) {
      break;
    }
  }

  return ordered.slice(0, maxPages);
}

export function pickNavigationSamplePages(pages: DiscoveryPage[], baseUrl: string): string[] {
  return pickDiscoverySamplePages(
    pages.filter((page) => page.depth <= 2),
    baseUrl,
    5
  );
}

export function pickStaticContentPages(pages: DiscoveryPage[], baseUrl: string): string[] {
  const filtered = pages.filter((page) =>
    /about|contact|services|solutions|portfolio|industry|development|consulting|blog|news|privacy|terms|faq/i.test(
      page.url
    )
  );
  return pickDiscoverySamplePages(filtered.length > 0 ? filtered : pages, baseUrl, 6);
}

export function buildCrawledUrlSet(pages: DiscoveryPage[], baseUrl: string): Set<string> {
  const set = new Set<string>();
  const add = (url: string) => {
    try {
      const parsed = new URL(url);
      set.add(parsed.href.replace(/\/$/, ""));
      set.add(parsed.href);
    } catch {
      // ignore invalid URLs
    }
  };
  add(baseUrl);
  for (const page of pages) {
    if (page.status >= 200 && page.status < 400) {
      add(page.url);
    }
  }
  return set;
}
