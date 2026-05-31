export type EcommerceSessionState = "anonymous" | "authenticated";

interface RunSessionRecord {
  state: EcommerceSessionState;
  authenticatedAt?: string;
  cartHasItems: boolean;
}

const runSessions = new Map<string, RunSessionRecord>();

export function getRunSessionState(runId: string): RunSessionRecord {
  return runSessions.get(runId) ?? { state: "anonymous", cartHasItems: false };
}

export function isRunAuthenticated(runId: string): boolean {
  return getRunSessionState(runId).state === "authenticated";
}

export function markRunAuthenticated(runId: string): void {
  const current = getRunSessionState(runId);
  runSessions.set(runId, {
    ...current,
    state: "authenticated",
    authenticatedAt: new Date().toISOString(),
  });
}

export function isRunCartPopulated(runId: string): boolean {
  return getRunSessionState(runId).cartHasItems;
}

export function markRunCartPopulated(runId: string): void {
  const current = getRunSessionState(runId);
  runSessions.set(runId, {
    ...current,
    cartHasItems: true,
  });
}

export function clearRunCartPopulated(runId: string): void {
  const current = getRunSessionState(runId);
  runSessions.set(runId, {
    ...current,
    cartHasItems: false,
  });
}

export async function syncRunCartPopulatedFromPage(
  runId: string,
  hasItems: boolean
): Promise<void> {
  if (hasItems) {
    markRunCartPopulated(runId);
  } else {
    clearRunCartPopulated(runId);
  }
}

export function resetRunSession(runId: string): void {
  runSessions.delete(runId);
}

export function shouldSkipRedundantLoginScenario(feature: string, scenario: string): boolean {
  const text = `${feature} ${scenario}`.toLowerCase();
  if (feature === "Authentication" && /login flow works/.test(text)) {
    return true;
  }
  if (feature === "Custom Command" && /(login|signin|sign in)/.test(text)) {
    return true;
  }
  return false;
}

export function shouldSkipGuestCheckoutScenario(feature: string, scenario: string): boolean {
  const text = `${feature} ${scenario}`.toLowerCase();
  return feature === "Authentication" && /guest checkout/.test(text);
}

export function shouldSkipSignupScenario(feature: string, scenario: string): boolean {
  const text = `${feature} ${scenario}`.toLowerCase();
  return feature === "Authentication" && /signup flow works/.test(text);
}

export function isAuthenticatedUrl(url: string): boolean {
  const normalized = url.toLowerCase();
  if (normalized.includes("/customer/account/login") || /\/login(?:\/|$|[?#])/.test(normalized)) {
    return false;
  }
  return (
    normalized.includes("is_logged_in=1") ||
    (normalized.includes("/customer/account") && !normalized.includes("/login"))
  );
}
