const THIRD_PARTY_HOST_PATTERNS = [
  /(^|\.)google-analytics\.com$/i,
  /(^|\.)googletagmanager\.com$/i,
  /(^|\.)googleadservices\.com$/i,
  /(^|\.)doubleclick\.net$/i,
  /(^|\.)facebook\.com$/i,
  /(^|\.)facebook\.net$/i,
  /(^|\.)hotjar\.com$/i,
  /(^|\.)clarity\.ms$/i,
  /(^|\.)aplo-evnt\.com$/i,
  /(^|\.)amazonaws\.com$/i,
  /(^|\.)b2bjsstore\./i,
  /(^|\.)linkedin\.com$/i,
  /(^|\.)hubspot\.com$/i,
];

const IGNORABLE_CONSOLE_PATTERNS = [
  /^failed to load resource/i,
  /^net::err_/i,
  /third-party cookie/i,
  /was preloaded using link preload but not used/i,
];

export function isThirdPartyUrl(url: string, siteHostname: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const siteHost = siteHostname.toLowerCase();
    if (hostname === siteHost || hostname.endsWith(`.${siteHost}`)) {
      return false;
    }
    return THIRD_PARTY_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

export function filterConsoleErrors(errors: string[], siteHostname: string): string[] {
  const deduped = new Set<string>();
  for (const line of errors) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (IGNORABLE_CONSOLE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      continue;
    }
    if (/google|gtag|analytics|facebook|pixel/i.test(trimmed) && !/intlTelInput/i.test(trimmed)) {
      continue;
    }
    deduped.add(trimmed);
  }
  return [...deduped];
}

export function filterNetworkErrors(errors: string[], siteHostname: string): string[] {
  const kept: string[] = [];
  for (const line of errors) {
    const urlMatch = line.match(/https?:\/\/[^\s]+/i);
    const url = urlMatch?.[0] ?? "";
    if (url && isThirdPartyUrl(url, siteHostname)) {
      continue;
    }
    if (/net::ERR_ABORTED/i.test(line) && url && isThirdPartyUrl(url, siteHostname)) {
      continue;
    }
    kept.push(line);
  }
  return kept;
}

export function isSiteOwnedConsoleIssue(message: string): boolean {
  return /intlTelInput is not loaded|referenceerror|typeerror|syntaxerror/i.test(message);
}
