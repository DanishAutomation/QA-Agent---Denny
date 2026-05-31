import { chromium, firefox, type Browser } from "playwright-core";
import type { PlaywrightExecutionMode, SupportedBrowser } from "@/types";

const FALLBACK_PATHS: Record<SupportedBrowser, string[]> = {
  Chrome: [
    process.env.PLAYWRIGHT_CHROME_PATH ?? "",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Chromium\\Application\\chrome.exe",
  ],
  Edge: [
    process.env.PLAYWRIGHT_EDGE_PATH ?? "",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ],
  Firefox: [
    process.env.PLAYWRIGHT_FIREFOX_PATH ?? "",
    "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
  ],
};

export async function launchBrowser(
  browserName: SupportedBrowser,
  mode: PlaywrightExecutionMode
): Promise<Browser> {
  const headless = mode === "headless";

  if (browserName === "Firefox") {
    try {
      return await firefox.launch({ headless });
    } catch {
      for (const executablePath of FALLBACK_PATHS.Firefox.filter(Boolean)) {
        try {
          return await firefox.launch({ headless, executablePath });
        } catch {
          // continue
        }
      }
      throw new Error("Unable to launch Firefox browser.");
    }
  }

  if (browserName === "Edge") {
    try {
      return await chromium.launch({ headless, channel: "msedge" });
    } catch {
      for (const executablePath of FALLBACK_PATHS.Edge.filter(Boolean)) {
        try {
          return await chromium.launch({ headless, executablePath });
        } catch {
          // continue
        }
      }
      throw new Error("Unable to launch Edge browser.");
    }
  }

  try {
    return await chromium.launch({ headless, channel: "chrome" });
  } catch {
    for (const executablePath of FALLBACK_PATHS.Chrome.filter(Boolean)) {
      try {
        return await chromium.launch({ headless, executablePath });
      } catch {
        // continue
      }
    }
    return chromium.launch({ headless });
  }
}

export function getDeviceDescriptor(deviceName: string) {
  const normalized = deviceName.toLowerCase();
  if (normalized.includes("iphone")) {
    return { viewport: { width: 390, height: 844 }, userAgent: "Mozilla/5.0 (iPhone)" };
  }
  if (normalized.includes("android")) {
    return { viewport: { width: 412, height: 915 }, userAgent: "Mozilla/5.0 (Linux; Android 13)" };
  }
  if (normalized.includes("ipad") || normalized.includes("tablet")) {
    return { viewport: { width: 820, height: 1180 }, userAgent: "Mozilla/5.0 (iPad)" };
  }
  return { viewport: { width: 1440, height: 900 }, userAgent: "Mozilla/5.0 (Windows NT 10.0)" };
}
