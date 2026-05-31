export type CheckoutPhase = "none" | "shipping" | "payment" | "complete";

interface CheckoutSessionRecord {
  stopAtMakePayment?: boolean;
  phase?: CheckoutPhase;
}

const checkoutSessions = new Map<string, CheckoutSessionRecord>();

export function getCheckoutPhase(runId: string): CheckoutPhase {
  return checkoutSessions.get(runId)?.phase ?? "none";
}

export function markCheckoutPhase(runId: string, phase: CheckoutPhase): void {
  const current = checkoutSessions.get(runId) ?? {};
  checkoutSessions.set(runId, { ...current, phase });
}

export function markCheckoutCompleteAtMakePayment(runId: string): void {
  const current = checkoutSessions.get(runId) ?? {};
  checkoutSessions.set(runId, { ...current, stopAtMakePayment: true, phase: "complete" });
}

export function shouldSkipPostPaymentSteps(runId: string): boolean {
  return checkoutSessions.get(runId)?.stopAtMakePayment === true;
}
export function clearCheckoutSession(runId: string): void {
  checkoutSessions.delete(runId);
}

export function isPostPaymentScenarioText(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    /card detail|enter card|card no|card number|payment info|cvv|cvc|expiry|expiration/.test(
      normalized
    ) || /place order|submit order|complete order|confirm order/.test(normalized)
  );
}
