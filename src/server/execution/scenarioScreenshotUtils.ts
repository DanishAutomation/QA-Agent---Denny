function slugify(value: string, maxLength = 48): string {
  return value
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength);
}

export function scenarioPageUrlMatchesFeature(
  feature: string,
  scenarioText: string,
  pageUrl: string
): boolean {
  const url = pageUrl.toLowerCase();
  const text = scenarioText.toLowerCase();

  if (feature === "Account") {
    if (/profile|orders|wishlist/.test(text)) {
      return url.includes("/customer/account") && !url.includes("/login");
    }
    if (/address/.test(text)) {
      return url.includes("/customer/address") || url.includes("/customer/account");
    }
    return url.includes("/customer/account");
  }

  if (feature === "Cart") {
    return /\/checkout\/cart|\/cart(?:\/|$|[?#])/.test(url);
  }

  if (feature === "Checkout") {
    return /\/checkout(?:\/|$|[?#])/.test(url) && !/\/checkout\/cart(?:\/|$|[?#])/.test(url);
  }

  if (feature === "Catalog") {
    if (/search/.test(text)) {
      return /catalogsearch|\/search\b|[?&]q=/.test(url);
    }
    return /\.html(?:$|[?#])|catalogsearch|category|collection/.test(url);
  }

  if (feature === "PDP") {
    return /\/product\/|\.html(?:$|[?#])/.test(url) && !url.includes("/customer/");
  }

  if (feature === "Authentication") {
    return url.includes("/login") || url.includes("/customer/account/create");
  }

  return true;
}

export function pickMemoryFlowPathForFeature(
  feature: string,
  scenarioText: string,
  memoryFlowPaths: string[]
): string | undefined {
  const text = scenarioText.toLowerCase();
  const ranked = memoryFlowPaths.filter(Boolean);

  if (feature === "Account") {
    return ranked.find((path) => {
      const url = path.toLowerCase();
      if (/address/.test(text)) {
        return url.includes("/customer/address");
      }
      return url.includes("/customer/account") && !url.includes("/login");
    });
  }

  if (feature === "Cart") {
    return ranked.find((path) => /\/checkout\/cart|\/cart(?:\/|$|[?#])/.test(path.toLowerCase()));
  }

  if (feature === "Checkout") {
    return ranked.find((path) => /\/checkout(?:\/|$|[?#])/.test(path.toLowerCase()));
  }

  if (feature === "Catalog" && /search/.test(text)) {
    return ranked.find((path) => /catalogsearch|[?&]q=/.test(path.toLowerCase()));
  }

  if (feature === "Catalog") {
    return ranked.find((path) => /\.html(?:$|[?#])/.test(path.toLowerCase()));
  }

  if (feature === "PDP") {
    return ranked.find((path) => /\/product\/|\.html(?:$|[?#])/.test(path.toLowerCase()));
  }

  return undefined;
}

export function buildScenarioScreenshotName(params: {
  scenarioId: string;
  deviceName: string;
  stepIndex: number;
  stepLabel: string;
  pageUrl: string;
  status: "passed" | "failed";
  captureType?: "landing" | "recovered" | "failure";
}): string {
  const stepSlug = slugify(params.stepLabel || "final", 32);
  let urlSlug = "page";
  try {
    urlSlug = slugify(new URL(params.pageUrl).pathname || params.pageUrl, 40);
  } catch {
    urlSlug = slugify(params.pageUrl, 40);
  }
  const suffix =
    params.captureType ??
    (params.status === "failed" ? "failure" : "landing");
  return `${params.scenarioId}-step-${params.stepIndex}-${stepSlug}-${urlSlug}-${params.deviceName}-${suffix}`;
}
