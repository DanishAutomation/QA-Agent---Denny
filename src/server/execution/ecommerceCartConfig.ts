export interface SecondaryCartLineConfig {
  pdpPath: string;
  itemNumber: string;
  primarySkuHint?: string;
}

const PURELIFE_SECONDARY_LINE: SecondaryCartLineConfig = {
  pdpPath: "/product/prophyflex-cleaning-powder.html",
  itemNumber: "5152202",
  primarySkuHint: "powder",
};

export function getSecondaryCartLineConfig(originOrDomain: string): SecondaryCartLineConfig | undefined {
  const host = originOrDomain.replace(/^https?:\/\//i, "").split("/")[0]?.toLowerCase() ?? "";
  if (host.includes("purelifedental.com")) {
    return PURELIFE_SECONDARY_LINE;
  }
  return undefined;
}

export function buildSecondaryCartLinePdpUrl(baseUrl: string, config: SecondaryCartLineConfig): string {
  try {
    return new URL(config.pdpPath, baseUrl).href;
  } catch {
    return `${baseUrl.replace(/\/$/, "")}${config.pdpPath}`;
  }
}

export function usesProphyflexPrimaryFlow(
  memoryPaths: string[],
  steps: string[]
): boolean {
  const combined = [...memoryPaths, ...steps].join(" ").toLowerCase();
  return /prophyflex-cleaning-powder|search for 'powder|sku=powder/.test(combined);
}
