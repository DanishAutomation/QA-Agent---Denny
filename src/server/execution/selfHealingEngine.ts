import type { Page } from "playwright-core";

interface HealingParams {
  page: Page;
  baseUrl: string;
  timeoutMs: number;
  originalError: string;
  allowBaseRecovery?: boolean;
}

export interface HealingOutcome {
  recovered: boolean;
  strategyLogs: string[];
}

async function tryCloseInterferingOverlays(page: Page): Promise<boolean> {
  const selectors = [
    "[aria-label*='close' i]",
    "[data-testid*='close' i]",
    "button:has-text('Accept')",
    "button:has-text('Got it')",
    "button:has-text('I Agree')",
    "button:has-text('Allow all')",
  ];

  let interacted = false;
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      if ((await element.count()) > 0 && (await element.isVisible())) {
        await element.click({ timeout: 1000 });
        interacted = true;
      }
    } catch {
      // Ignore noisy overlay selectors.
    }
  }
  return interacted;
}

export async function attemptAdvancedSelfHealing(
  params: HealingParams
): Promise<HealingOutcome> {
  const { page, baseUrl, timeoutMs, originalError, allowBaseRecovery = true } = params;
  const strategyLogs: string[] = [`Root error: ${originalError}`];

  try {
    await page.waitForLoadState("domcontentloaded", { timeout: Math.min(timeoutMs, 8000) });
    strategyLogs.push("Strategy 1: synchronized to domcontentloaded state.");
  } catch {
    strategyLogs.push("Strategy 1 failed: domcontentloaded sync timed out.");
  }

  try {
    const overlayClosed = await tryCloseInterferingOverlays(page);
    strategyLogs.push(
      overlayClosed
        ? "Strategy 2: closed potential blocking overlays."
        : "Strategy 2: no blocking overlays detected."
    );
  } catch {
    strategyLogs.push("Strategy 2 failed: overlay handling failed.");
  }

  const onCheckoutFlow = /checkout|\/cart/i.test(page.url());
  if (!onCheckoutFlow) {
    try {
      await page.reload({ waitUntil: "domcontentloaded", timeout: Math.min(timeoutMs, 10000) });
      strategyLogs.push("Strategy 3: reloaded page successfully.");
    } catch {
      strategyLogs.push("Strategy 3 failed: page reload did not stabilize.");
    }
  } else {
    strategyLogs.push("Strategy 3 skipped: reload avoided on checkout flow to preserve session.");
  }

  if (allowBaseRecovery) {
    try {
      await page.goto(baseUrl, {
        waitUntil: "domcontentloaded",
        timeout: Math.min(timeoutMs, 12000),
      });
      await page.waitForLoadState("networkidle", { timeout: Math.min(timeoutMs, 8000) });
      strategyLogs.push("Strategy 4: navigated back to base URL and stabilized network.");
    } catch {
      strategyLogs.push("Strategy 4 failed: base URL recovery navigation failed.");
      return { recovered: false, strategyLogs };
    }
  } else {
    strategyLogs.push("Strategy 4 skipped: base URL recovery disabled for session continuity.");
  }

  return { recovered: true, strategyLogs };
}
