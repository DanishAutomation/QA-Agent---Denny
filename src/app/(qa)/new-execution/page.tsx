"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseInstructionText, testDataManager } from "@/core";
import { PageTitle } from "@/components/qa/page-title";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TestDataStep } from "@/types";

const testTypes = [
  "Smoke",
  "Full Regression",
  "Login",
  "Ecommerce Journey",
  "Static Website",
  "Forms",
  "Broken Links",
  "Responsive",
  "Accessibility",
  "Custom Command Automation",
];

const browsers = ["Chrome", "Firefox", "Edge"];
const modes = ["Headed", "Headless"];
const screenshotModes = ["Failures only", "Pass + Fail", "Every major step"];
const deviceCoverage = ["Android", "iPhone", "iPad", "Tablet", "Desktop"];

const instructionTabs = [
  "Natural Language",
  "Locators",
  "Test Data",
  "Execution Notes",
];

const tabHints: Record<string, string> = {
  "Natural Language": "Describe your QA objective in plain English.",
  Locators: "Include CSS selectors, XPath, and Playwright locator hints.",
  "Test Data": "Login, address, and payment placeholders are supported.",
  "Execution Notes": "Add sequencing, retries, and reporting preferences.",
};

function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export default function NewExecutionPage() {
  const router = useRouter();
  const previewRunId = "preview-run";
  const [activeTab, setActiveTab] = useState("Natural Language");
  const [selectedDevices, setSelectedDevices] = useState<string[]>(["Desktop"]);
  const [customInstructions, setCustomInstructions] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedTestType, setSelectedTestType] = useState(testTypes[0]);
  const [selectedBrowser, setSelectedBrowser] = useState(browsers[0]);
  const [selectedMode, setSelectedMode] = useState(modes[1]);
  const [selectedScreenshotMode, setSelectedScreenshotMode] = useState(screenshotModes[1]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [launchMessage, setLaunchMessage] = useState<string | null>(null);

  const coverageText = useMemo(
    () => `${selectedDevices.length} device profile(s) selected`,
    [selectedDevices]
  );

  const parsedData = useMemo(() => {
    const parsed = parseInstructionText(customInstructions);
    testDataManager.parseAndRegister(previewRunId, customInstructions);
    return parsed;
  }, [customInstructions]);

  const login = testDataManager.resolveStepData(previewRunId, "login");
  const address = testDataManager.resolveStepData(previewRunId, "address");
  const payment = testDataManager.resolveStepData(previewRunId, "payment");
  const checkoutStatus =
    address.status === "skip" || payment.status === "skip"
      ? "skip"
      : address.status === "use-parsed" && payment.status === "use-parsed"
        ? "use-parsed"
        : "use-fallback";
  const stepDecisions = [
    {
      step: "login",
      status: login.status,
      reason: login.reason,
    },
    {
      step: "address",
      status: address.status,
      reason: address.reason,
    },
    {
      step: "payment",
      status: payment.status,
      reason: payment.reason,
    },
    {
      step: "checkout",
      status: checkoutStatus,
      reason:
        checkoutStatus === "use-parsed"
          ? "Address + payment data available from parsed instructions."
          : checkoutStatus === "use-fallback"
            ? "Checkout will use safe fallback for missing address/payment fields."
            : "Checkout skipped because required address/payment data is unavailable.",
    },
  ] as Array<{
    step: TestDataStep | "checkout";
    status: "use-parsed" | "use-fallback" | "skip";
    reason: string;
  }>;

  const launchExecution = async () => {
    setLaunchError(null);
    setLaunchMessage(null);

    const normalizedWebsiteUrl = normalizeWebsiteUrl(websiteUrl);

    if (!normalizedWebsiteUrl) {
      setLaunchError("Website URL is required.");
      return;
    }
    try {
      new URL(normalizedWebsiteUrl);
    } catch {
      setLaunchError("Please enter a valid absolute URL (e.g. https://your-site.com).");
      return;
    }
    if (normalizedWebsiteUrl !== websiteUrl) {
      setWebsiteUrl(normalizedWebsiteUrl);
    }

    setIsLaunching(true);
    try {
      setLaunchMessage("Queueing live run...");
      const launchResponse = await fetch("/api/execution/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: normalizedWebsiteUrl,
          selectedTestType,
          browser: selectedBrowser,
          mode: selectedMode.toLowerCase(),
          devices: selectedDevices.length > 0 ? selectedDevices : ["Desktop"],
          screenshotMode:
            selectedScreenshotMode === "Failures only"
              ? "failures-only"
              : selectedScreenshotMode === "Pass + Fail"
                ? "pass-fail"
                : "every-major-step",
          parsedInstructions: parsedData,
        }),
      });
      const launchPayload = (await launchResponse.json()) as {
        ok: boolean;
        data?: { runId: string; status: string };
        error?: { message?: string };
      };
      if (!launchPayload.ok || !launchPayload.data?.runId) {
        throw new Error(launchPayload.error?.message ?? "Could not launch execution.");
      }
      setLaunchMessage("Live run started. Redirecting to progress stream...");
      router.push(`/execution-progress?runId=${encodeURIComponent(launchPayload.data.runId)}`);
    } catch (error) {
      setLaunchError(error instanceof Error ? error.message : "Execution launch failed.");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <main className="space-y-4">
      <PageTitle
        title="New Execution"
        subtitle="Configure a fresh AI-assisted QA run using guided controls."
        tag="Live Run Builder"
      />

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Website URL</span>
            <input
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              placeholder="https://example.com"
              className="h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Test Type</span>
            <select
              value={selectedTestType}
              onChange={(event) => setSelectedTestType(event.target.value)}
              className="h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {testTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Browser</span>
            <select
              value={selectedBrowser}
              onChange={(event) => setSelectedBrowser(event.target.value)}
              className="h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {browsers.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Mode</span>
            <select
              value={selectedMode}
              onChange={(event) => setSelectedMode(event.target.value)}
              className="h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {modes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Screenshot Mode</span>
            <select
              value={selectedScreenshotMode}
              onChange={(event) => setSelectedScreenshotMode(event.target.value)}
              className="h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {screenshotModes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">Device Coverage</span>
              <Badge variant="outline">{coverageText}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {deviceCoverage.map((device) => {
                const selected = selectedDevices.includes(device);
                return (
                  <button
                    key={device}
                    type="button"
                    onClick={() =>
                      setSelectedDevices((previous) =>
                        selected
                          ? previous.filter((item) => item !== device)
                          : [...previous, device]
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition",
                      selected
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "bg-white text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {device}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {instructionTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition",
                activeTab === tab
                  ? "border-violet-200 bg-violet-50 text-violet-700"
                  : "bg-white text-muted-foreground hover:bg-muted"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{tabHints[activeTab]}</p>

        <label className="mt-3 block space-y-2 text-sm">
          <span className="font-medium">Custom Instructions</span>
          <textarea
            rows={10}
            value={customInstructions}
            onChange={(event) => setCustomInstructions(event.target.value)}
            placeholder={`Examples:\n- Validate login with manager credentials\n- Prefer locator: getByRole('button', { name: 'Checkout' })\n- XPath: //form[@id='payment-form']//input[@name='cardNumber']\n- CSS: [data-testid='submit-order']\n- Login data: qa.user@example.com / ********\n- Address data: 221B Baker Street, London\n- Payment data: VISA test card placeholder`}
            className="w-full rounded-lg border p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Launch runs real discovery, generation, and execution APIs.
          </p>
          <button
            type="button"
            onClick={launchExecution}
            disabled={isLaunching}
            className={buttonVariants({
              className:
                "h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 text-white hover:opacity-90 disabled:opacity-60",
            })}
          >
            {isLaunching ? "Launching..." : "Launch Execution"}
          </button>
        </div>
        {launchMessage ? <p className="mt-2 text-xs text-indigo-600">{launchMessage}</p> : null}
        {launchError ? <p className="mt-2 text-xs text-rose-600">{launchError}</p> : null}
      </section>

      <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Smart Test Data Preview</h3>
          <Badge variant="secondary">Parsed from instruction box</Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DataCard
            title="Login"
            items={[
              ["Email", parsedData.login.email],
              ["Password", parsedData.login.password],
            ]}
          />
          <DataCard
            title="Signup"
            items={[
              ["Name", parsedData.signup.name],
              ["Email", parsedData.signup.email],
              ["Password", parsedData.signup.password],
              ["Phone", parsedData.signup.phone],
            ]}
          />
          <DataCard
            title="Address"
            items={[
              ["Name", parsedData.address.name],
              ["Street", parsedData.address.street],
              ["City", parsedData.address.city],
              ["State", parsedData.address.state],
              ["Zip", parsedData.address.zip],
              ["Country", parsedData.address.country],
              ["Phone", parsedData.address.phone],
            ]}
          />
          <DataCard
            title="Payment"
            items={[
              ["Card number", parsedData.payment.cardNumber],
              ["Expiry", parsedData.payment.expiry],
              ["CVV", parsedData.payment.cvv],
              ["Cardholder", parsedData.payment.cardholderName],
            ]}
          />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <ListCard title="CSS selectors" items={parsedData.selectors.cssSelectors} />
          <ListCard title="XPath selectors" items={parsedData.selectors.xpaths} />
          <ListCard
            title="Playwright locators"
            items={parsedData.selectors.playwrightLocators}
          />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <ListCard title="Natural language commands" items={parsedData.naturalLanguageCommands} />
          <ListCard title="Bullet points" items={parsedData.bulletPoints} />
        </div>

        <div className="mt-3 rounded-lg border p-3">
          <p className="mb-2 text-sm font-medium">Step Data Decision (pre-execution)</p>
          <div className="grid gap-2 md:grid-cols-2">
            {stepDecisions.map((decision) => (
              <article key={decision.step} className="rounded-lg border p-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium capitalize">{decision.step}</p>
                  <Badge
                    variant={
                      decision.status === "use-parsed"
                        ? "success"
                        : decision.status === "use-fallback"
                          ? "warning"
                          : "outline"
                    }
                  >
                    {decision.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{decision.reason}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function DataCard({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string | undefined]>;
}) {
  return (
    <section className="rounded-lg border bg-muted/20 p-3">
      <p className="mb-2 text-sm font-medium">{title}</p>
      <div className="space-y-1 text-xs">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="truncate font-medium">{value ?? "-"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border bg-muted/20 p-3">
      <p className="mb-2 text-sm font-medium">{title}</p>
      <div className="max-h-32 space-y-1 overflow-y-auto text-xs">
        {items.length === 0 ? (
          <p className="text-muted-foreground">No data detected.</p>
        ) : (
          items.map((item) => <div key={item}>{item}</div>)
        )}
      </div>
    </section>
  );
}
