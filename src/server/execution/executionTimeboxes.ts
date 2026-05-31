export function getScenarioTimeboxMs(
  feature: string,
  scenarioText: string,
  testType?: string
): number {
  const text = `${feature} ${scenarioText}`.toLowerCase();
  const type = (testType ?? "").toLowerCase();

  if (type.includes("smoke")) {
    return 60_000;
  }
  if (feature === "Checkout" || /checkout|shipping|billing|payment|address step/.test(text)) {
    return 120_000;
  }
  if (/pagination|remove item|filter/.test(text)) {
    return 90_000;
  }
  if (type.includes("full regression")) {
    return 90_000;
  }
  return 90_000;
}

export function getStepTimeboxMs(intentText: string): number {
  const intent = intentText.toLowerCase();
  if (/navigate to https?:\/\//i.test(intent) || /^navigate to /.test(intent)) {
    return 20_000;
  }
  if (/proceed to checkout|checkout|shipping|payment|billing/.test(intent)) {
    return 30_000;
  }
  if (/pagination|page 2|go to page 2/.test(intent)) {
    return 25_000;
  }
  if (/product listing|catalog filter|open first product|search for/.test(intent)) {
    return 20_000;
  }
  if (/keep as scheduled|make payment|next button|shipping address/.test(intent)) {
    return 25_000;
  }
  if (/remove item|update quantity|move to cart|add to cart/.test(intent)) {
    return 20_000;
  }
  if (/login|password|email/.test(intent)) {
    return 20_000;
  }
  return 15_000;
}

export async function runWithTimeout<T>(
  label: string,
  timeoutMs: number,
  task: () => Promise<T>,
  kind: "step" | "scenario" = "step"
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      task(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          const prefix = kind === "scenario" ? "Scenario timed out" : "Step timed out";
          reject(new Error(`${prefix} after ${Math.round(timeoutMs / 1000)} seconds: ${label}`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
