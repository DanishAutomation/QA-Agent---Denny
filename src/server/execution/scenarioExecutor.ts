import path from "node:path";
import type { BrowserContext, Page } from "playwright-core";
import type {
  ExecutableScenarioInput,
  PlaywrightExecutionConfig,
  ScenarioExecutionResult,
  SelfHealingMetadata,
  ScreenshotMode,
} from "@/types";
import type { ReportPaths } from "./reportWriter";
import { attemptAdvancedSelfHealing } from "./selfHealingEngine";
import { runPreconditionDiscoveryAndRetry } from "./preconditionDiscoveryEngine";
import { writeExecutionDebugLog } from "./executionDebugLogger";
import {
  readExecutionMemory,
  updateExecutionMemory,
} from "./executionMemoryStore";
import {
  isAuthenticatedUrl,
  isRunAuthenticated,
  isRunCartPopulated,
  markRunAuthenticated,
  shouldSkipRedundantLoginScenario,
  shouldSkipGuestCheckoutScenario,
  shouldSkipSignupScenario,
} from "./ecommerceSessionStore";
import {
  assertEcommerceRegressionOutcome,
  isEcommerceRegressionRun,
  resolveEcommerceRegressionIntents,
} from "./ecommerceRegressionIntentResolver";
import {
  buildScenarioScreenshotName,
  pickMemoryFlowPathForFeature,
  scenarioPageUrlMatchesFeature,
} from "./scenarioScreenshotUtils";
import { resolveAndExecuteIntent } from "./universalActionResolver";
import { getScenarioTimeboxMs, getStepTimeboxMs, runWithTimeout } from "./executionTimeboxes";
import {
  filterConsoleErrors,
  filterNetworkErrors,
} from "./executionNoiseFilter";
import {
  isStaticSuiteScenario,
  runStaticScenarioValidation,
} from "./staticScenarioRunner";

interface Observers {
  consoleErrors: string[];
  networkErrors: string[];
}

const MAX_PAGE_REVISIT_THRESHOLD = 6;
const MAX_REPEATED_NAV_PATTERN = 4;
const MAX_STEP_ACTIONS = 12;
const MAX_LOGIN_ATTEMPTS = 3;
const MAX_STEP_RETRY_COUNT = 2;
const MAX_IDENTICAL_ACTION_COUNT = 5;

interface LoopGuards {
  urlVisits: Map<string, number>;
  navHistory: string[];
  actionCount: number;
  loginAttempts: number;
  credentialLoginAttempted: boolean;
  actionHistory: string[];
  actionFrequency: Map<string, number>;
}

function normalizeIntentSegment(segment: string): string {
  return segment
    .replace(/["']/g, "")
    .replace(/^click\s+/i, "")
    .replace(/^on\s+/i, "")
    .trim();
}

function splitIntentSegments(intent: string): string[] {
  return intent
    .split(/ then | and then | and click | after that | afterwards |->|=>/gi)
    .map((item) => normalizeIntentSegment(item))
    .filter((item) => item.length > 2);
}

function isActionableIntent(intent: string): boolean {
  return /login|sign in|signin|search|find|open|navigate|click|tap|select|choose|add to cart|buy|checkout|payment|fill|enter|type|submit|coupon|wishlist|profile|cart|order|place|next|xpath|css|getby|locator\(|keep as scheduled|make payment|test address|\badd\b.*\baddress|\baddress\b.*\b(billing|shipping|field)/i.test(
    intent
  );
}

function getWaitFollowUpIntents(scenarioIntent: string): string[] {
  if (!/^wait\b/i.test(scenarioIntent)) {
    return [];
  }
  if (!/then|and click|and then/i.test(scenarioIntent)) {
    return [];
  }
  const remainder = scenarioIntent.replace(/^wait\b(?:\s+for)?\s+/i, "");
  return splitIntentSegments(remainder)
    .filter((item) => !/^login$/i.test(item))
    .filter((item) => item.length > 2 && isActionableIntent(item));
}

function domainFromConfig(config: PlaywrightExecutionConfig): string {
  try {
    return new URL(config.baseUrl).hostname;
  } catch {
    return "unknown-domain";
  }
}

async function waitForInteractivePage(page: Page, timeoutMs: number): Promise<void> {
  await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs });
  await page.waitForSelector("body", { state: "attached", timeout: timeoutMs });
  await page.waitForLoadState("networkidle", { timeout: Math.min(timeoutMs, 5000) }).catch(
    () => undefined
  );
}

function attachObservers(page: Page): Observers {
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("response", (res) => {
    if (res.status() >= 400) {
      networkErrors.push(`[${res.status()}] ${res.url()}`);
    }
  });

  page.on("requestfailed", (request) => {
    networkErrors.push(
      `[FAILED] ${request.url()} :: ${request.failure()?.errorText ?? "unknown"}`
    );
  });

  return { consoleErrors, networkErrors };
}

async function maybeCaptureScreenshot(
  page: Page,
  mode: ScreenshotMode,
  status: "passed" | "failed",
  params: {
    scenarioId: string;
    deviceName: string;
    stepIndex: number;
    stepLabel: string;
    feature: string;
    scenarioText: string;
    memoryFlowPaths: string[];
    captureType?: "landing" | "recovered" | "failure";
    runId: string;
  },
  reportPaths: ReportPaths,
  collector: string[]
) {
  const shouldCapture =
    mode === "every-major-step" ||
    mode === "pass-fail" ||
    (mode === "failures-only" && status === "failed");
  if (!shouldCapture) {
    return;
  }

  let pageUrl = page.url();
  if (!scenarioPageUrlMatchesFeature(params.feature, params.scenarioText, pageUrl)) {
    const target = pickMemoryFlowPathForFeature(
      params.feature,
      params.scenarioText,
      params.memoryFlowPaths
    );
    if (target) {
      await page
        .goto(target, { waitUntil: "domcontentloaded", timeout: 30_000 })
        .catch(() => undefined);
      pageUrl = page.url();
    }
  }

  if (!scenarioPageUrlMatchesFeature(params.feature, params.scenarioText, pageUrl)) {
    writeExecutionDebugLog({
      runId: params.runId,
      stage: "SCREENSHOT_VALIDATION",
      message: "Screenshot skipped because page URL did not match scenario context.",
      metadata: {
        scenarioId: params.scenarioId,
        feature: params.feature,
        scenarioText: params.scenarioText,
        pageUrl,
      },
    });
    return;
  }

  const screenshotName = buildScenarioScreenshotName({
    scenarioId: params.scenarioId,
    deviceName: params.deviceName,
    stepIndex: params.stepIndex,
    stepLabel: params.stepLabel,
    pageUrl,
    status,
    captureType: params.captureType,
  });
  const filePath = path.join(reportPaths.screenshotsDir, `${screenshotName}.png`);
  await page
    .screenshot({ path: filePath, fullPage: true })
    .then(() => collector.push(filePath))
    .catch(() => undefined);
}

function isLoginValidationIntent(intentText: string): boolean {
  const text = intentText.toLowerCase();
  if (/login with provided credentials|login flow works|attempts login flow/.test(text)) {
    return true;
  }
  if (
    /^enter\s+(?:the\s+)?(?:email|password)\b|enter\s+(?:email|password)\s*:|fill\s+(?:email|password)|hit login|click login button|submit login/.test(
      text
    )
  ) {
    return true;
  }
  return /empty|invalid|wrong password|validation|incorrect credentials/.test(text);
}

function shouldSkipLoginStepIntent(runId: string, intentText: string): boolean {
  if (isLoginValidationIntent(intentText)) {
    return false;
  }
  return isRunAuthenticated(runId);
}

async function executeCoreScenario(
  page: Page,
  scenario: ExecutableScenarioInput,
  config: PlaywrightExecutionConfig,
  actionIntent: string,
  preconditionCollector: {
    missingPreconditions: string[];
    actionsTaken: string[];
    retryResult: "not-needed" | "recovered" | "failed";
    investigationFindings?: string[];
  },
  loopGuards: LoopGuards,
  options?: {
    navigateToBase?: boolean;
    memorySelectors?: string[];
    executionMemory?: import("./executionMemoryStore").DomainExecutionMemory;
    intentOverride?: string[];
  }
): Promise<string> {
  const recordAction = (action: string) => {
    const key = action.toLowerCase();
    loopGuards.actionHistory.push(key);
    loopGuards.actionHistory = loopGuards.actionHistory.slice(-18);
    const count = (loopGuards.actionFrequency.get(key) ?? 0) + 1;
    loopGuards.actionFrequency.set(key, count);
    if (count > MAX_IDENTICAL_ACTION_COUNT) {
      throw new Error(
        `Loop protection triggered: repeated identical action "${action}" exceeded threshold.`
      );
    }

    const recent = loopGuards.actionHistory.slice(-6);
    const repeatedLoginHomeSearch =
      recent.length === 6 &&
      recent.join("|") === "login|home|search|login|home|search";
    if (repeatedLoginHomeSearch) {
      throw new Error("Loop protection triggered: repeated login/home/search action pattern.");
    }
  };

  const recordUrlVisit = (url: string) => {
    const key = url.toLowerCase();
    const lastUrl = loopGuards.navHistory[loopGuards.navHistory.length - 1];
    if (lastUrl === key) {
      return;
    }
    const count = (loopGuards.urlVisits.get(key) ?? 0) + 1;
    loopGuards.urlVisits.set(key, count);
    loopGuards.navHistory.push(key);
    loopGuards.navHistory = loopGuards.navHistory.slice(-12);
    if (count > MAX_PAGE_REVISIT_THRESHOLD) {
      throw new Error(`Loop protection triggered: URL revisited too often (${url}).`);
    }
    const recent = loopGuards.navHistory.slice(-MAX_REPEATED_NAV_PATTERN);
    if (
      recent.length >= MAX_REPEATED_NAV_PATTERN &&
      recent.every((item) => item === recent[0])
    ) {
      throw new Error(`Loop protection triggered: repeated navigation pattern on ${url}.`);
    }
  };

  const shouldNavigateToBase =
    options?.navigateToBase !== false ||
    page.url() === "about:blank" ||
    page.url().length === 0;
  if (shouldNavigateToBase) {
    recordAction("home");
    await page.goto(config.baseUrl, {
      waitUntil: "domcontentloaded",
      timeout: config.timeoutMs ?? 30_000,
    });
    await waitForInteractivePage(page, config.timeoutMs ?? 30_000);
  }
  let pageUrl = page.url();
  recordUrlVisit(pageUrl);

  // Smart waits: ensure key DOM exists and page is interactive.
  const bodyHandle = await page.waitForSelector("body", {
    state: "visible",
    timeout: config.timeoutMs ?? 30_000,
  });
  if (!bodyHandle) {
    throw new Error("Body element not visible after navigation.");
  }

  const title = await page.title();
  if (!title || title.trim().length === 0) {
    throw new Error("Page title is empty; page may not have loaded expected content.");
  }

  const scenarioIntents = options?.intentOverride ?? [...scenario.definition.when, actionIntent];
  const includeCustomCommands =
    scenario.definition.feature.toLowerCase().includes("custom command") ||
    (config.selectedTestType ?? "").toLowerCase().includes("custom command");
  const extraIntents: string[] = [];
  const selectorIntents = [
    ...(config.parsedInstructions?.selectors.cssSelectors ?? []),
    ...(config.parsedInstructions?.selectors.xpaths ?? []),
    ...(config.parsedInstructions?.selectors.playwrightLocators ?? []),
  ];
  const stepIntents = [...scenarioIntents, ...extraIntents, ...selectorIntents]
    .flatMap((item) => splitIntentSegments(item))
    .map((item) => item.trim())
    .filter((item) => item.length > 2 && isActionableIntent(item))
    .filter((item, index, arr) => arr.indexOf(item) === index)
    .slice(0, MAX_STEP_ACTIONS);

  let effectiveStepIntents = stepIntents;
  if (isEcommerceRegressionRun(config)) {
    const memoryForPlan =
      options?.executionMemory ?? readExecutionMemory(domainFromConfig(config));
    const memoryPlan = resolveEcommerceRegressionIntents(
      scenario.definition,
      memoryForPlan,
      config
    );
    if (memoryPlan.length > 0) {
      effectiveStepIntents = memoryPlan;
      preconditionCollector.actionsTaken.push(
        `Applied ${memoryPlan.length} memory-backed regression step(s) for "${scenario.definition.scenario}".`
      );
    }
  }

  if (effectiveStepIntents.length === 0 && includeCustomCommands) {
    throw new Error(
      `No actionable intent extracted for custom command scenario "${scenario.definition.scenario}".`
    );
  }

  if (effectiveStepIntents.length === 0 && isStaticSuiteScenario(config, scenario.definition.feature)) {
    preconditionCollector.actionsTaken.push(
      `Static suite validation for "${scenario.definition.feature}" using discovered pages.`
    );
    return runStaticScenarioValidation({
      page,
      config,
      feature: scenario.definition.feature,
    });
  }

  if (effectiveStepIntents.length === 0) {
    if (isEcommerceRegressionRun(config)) {
      throw new Error(
        `No executable regression plan for "${scenario.definition.scenario}" — store a successful custom command journey first.`
      );
    }
    throw new Error(`No actionable steps extracted for "${scenario.definition.scenario}".`);
  }

  const tryIntentAction = async (intentText: string) => {
    loopGuards.actionCount += 1;
    if (loopGuards.actionCount > MAX_STEP_ACTIONS) {
      throw new Error("Loop protection triggered: maximum step action threshold exceeded.");
    }

    const intent = intentText.toLowerCase();
    const isCredentialLoginIntent = /login with provided credentials|login flow works/.test(intent);
    if (/login|sign in/.test(intent)) {
      if (shouldSkipLoginStepIntent(config.runId, intentText)) {
        preconditionCollector.actionsTaken.push(
          "Skipped redundant login — authenticated session reused."
        );
        return;
      }
      if (!isCredentialLoginIntent || !loopGuards.credentialLoginAttempted) {
        recordAction("login");
        loopGuards.loginAttempts += 1;
        if (isCredentialLoginIntent) {
          loopGuards.credentialLoginAttempted = true;
        }
        if (loopGuards.loginAttempts > MAX_LOGIN_ATTEMPTS) {
          throw new Error("Loop protection triggered: repeated login attempts exceeded threshold.");
        }
      }
    }

    if (/search/.test(intent)) {
      recordAction("search");
    }

    const resolved = await runWithTimeout(
      intentText,
      getStepTimeboxMs(intentText),
      () =>
        resolveAndExecuteIntent({
          page,
          intentText,
          parsedInstructions: config.parsedInstructions,
          memorySelectors: options?.memorySelectors,
          executionMemory:
            options?.executionMemory ?? readExecutionMemory(domainFromConfig(config)),
          timeoutMs: Math.min(config.timeoutMs ?? 30_000, getStepTimeboxMs(intentText)),
          runId: config.runId,
        })
    );
    preconditionCollector.actionsTaken.push(...resolved.logs);
    if (!resolved.matched) {
      throw new Error(`No executable UI action matched intent: "${intentText}".`);
    }
    if (resolved.usedLocator) {
      preconditionCollector.actionsTaken.push(
        `Resolved action using ${resolved.strategy}: ${resolved.usedLocator}`
      );
    }
    await waitForInteractivePage(page, config.timeoutMs ?? 30_000);
    pageUrl = page.url();
    recordUrlVisit(pageUrl);
    if (/login|sign in/.test(intent) && isAuthenticatedUrl(pageUrl)) {
      markRunAuthenticated(config.runId);
      preconditionCollector.actionsTaken.push("Authenticated session established and stored for run.");
    }
  };

  for (const stepIntent of effectiveStepIntents) {
    if (!stepIntent || stepIntent.length < 2) {
      continue;
    }
    writeExecutionDebugLog({
      runId: config.runId,
      stage: "EXECUTION_AGENT",
      message: "Executing scenario step intent.",
      metadata: {
        scenarioId: scenario.id,
        scenarioTitle: scenario.definition.scenario,
        currentStep: stepIntent,
        currentUrl: page.url(),
        executionStatus: "running",
        retryCount: 0,
      },
    });
    let completed = false;
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_STEP_RETRY_COUNT; attempt += 1) {
      try {
        await tryIntentAction(stepIntent);
        completed = true;
        break;
      } catch (actionError) {
        lastError = actionError;
        const timedOut = /timed out after \d+ seconds/i.test(
          actionError instanceof Error ? actionError.message : ""
        );
        if (
          timedOut &&
          isEcommerceRegressionRun(config) &&
          /pagination|page 2|remove item|update quantity/i.test(stepIntent)
        ) {
          break;
        }
        const discovery = await runPreconditionDiscoveryAndRetry(
          {
            page,
            actionIntent: stepIntent,
            parsedInstructions: config.parsedInstructions,
            safeTestMode: config.safeTestMode,
          },
          () => tryIntentAction(stepIntent)
        );
        preconditionCollector.missingPreconditions.push(...discovery.missingPreconditions);
        preconditionCollector.actionsTaken.push(...discovery.actionsTaken);
        preconditionCollector.investigationFindings = [
          ...new Set([
            ...(preconditionCollector.investigationFindings ?? []),
          ...discovery.investigationFindings,
          ]),
        ];
        preconditionCollector.retryResult = discovery.retryResult;
        if (discovery.retryResult === "recovered") {
          writeExecutionDebugLog({
            runId: config.runId,
            stage: "SELF_HEALING_AGENT",
            message: "Step recovered using precondition discovery and retry.",
            metadata: {
              scenarioId: scenario.id,
              scenarioTitle: scenario.definition.scenario,
              currentStep: stepIntent,
              currentUrl: page.url(),
              executionStatus: "running",
              retryCount: attempt + 1,
            },
          });
          completed = true;
          break;
        }
      }
    }
    if (!completed && lastError) {
      throw new Error(
        `Step failed after ${MAX_STEP_RETRY_COUNT + 1} attempts: ${
          lastError instanceof Error ? lastError.message : "unknown error"
        }`
      );
    }
  }

  return pageUrl;
}

export async function executeScenarioOnPage(params: {
  scenario: ExecutableScenarioInput;
  context: BrowserContext;
  config: PlaywrightExecutionConfig;
  reportPaths: ReportPaths;
  deviceName: string;
  page?: Page;
  navigateToBase?: boolean;
}): Promise<ScenarioExecutionResult> {
  const { scenario, context, config, reportPaths, deviceName } = params;
  const started = Date.now();
  const timestamp = new Date().toISOString();

  if (scenario.definition.executionStatus === "skipped") {
    const selfHealing: SelfHealingMetadata = {
      attempted: false,
      recovered: false,
      attempts: 0,
      strategyLogs: [],
    };
    return {
      scenarioId: scenario.id,
      feature: scenario.definition.feature,
      scenario: scenario.definition.scenario,
      status: "skipped",
      errorReason: scenario.definition.skipReason ?? "Scenario skipped by generation engine.",
      screenshots: [],
      consoleErrors: [],
      networkErrors: [],
      pageUrl: config.baseUrl,
      timestamp,
      durationMs: 0,
      selfHealing,
      preconditionDiscovery: {
        missingPreconditions: [],
        actionsTaken: [],
        retryResult: "not-needed",
      },
    };
  }

  const ownsPage = !params.page;
  const page = params.page ?? (await context.newPage());
  const observers = attachObservers(page);
  const screenshots: string[] = [];

  let status: "passed" | "failed" = "passed";
  let errorReason: string | undefined;
  let pageUrl = config.baseUrl;
  const selfHealing: SelfHealingMetadata = {
    attempted: false,
    recovered: false,
    attempts: 0,
    strategyLogs: [],
  };
  const preconditionDiscovery: ScenarioExecutionResult["preconditionDiscovery"] = {
    missingPreconditions: [],
    actionsTaken: [],
    retryResult: "not-needed",
    investigationFindings: [],
  };
  const loopGuards: LoopGuards = {
    urlVisits: new Map<string, number>(),
    navHistory: [],
    actionCount: 0,
    loginAttempts: 0,
    credentialLoginAttempted: false,
    actionHistory: [],
    actionFrequency: new Map<string, number>(),
  };
  const domain = (() => {
    try {
      return new URL(config.baseUrl).hostname;
    } catch {
      return "unknown-domain";
    }
  })();
  const memorySnapshot = readExecutionMemory(domain);
  const memorySelectors = [
    ...memorySnapshot.successfulSelectors,
    ...(config.parsedInstructions?.selectors.cssSelectors ?? []),
    ...(config.parsedInstructions?.selectors.xpaths ?? []),
  ];
  const memoryFlowPaths = memorySnapshot.successfulFlowPaths;

  if (
    isRunAuthenticated(config.runId) &&
    shouldSkipRedundantLoginScenario(scenario.definition.feature, scenario.definition.scenario)
  ) {
    return {
      scenarioId: scenario.id,
      feature: scenario.definition.feature,
      scenario: scenario.definition.scenario,
      status: "skipped",
      errorReason: "Skipped — authenticated session already established.",
      screenshots: [],
      consoleErrors: [],
      networkErrors: [],
      pageUrl: config.baseUrl,
      timestamp,
      durationMs: Date.now() - started,
      selfHealing: {
        attempted: false,
        recovered: false,
        attempts: 0,
        strategyLogs: [],
      },
      preconditionDiscovery: {
        missingPreconditions: [],
        actionsTaken: ["Reused authenticated session; redundant login scenario skipped."],
        retryResult: "not-needed",
      },
    };
  }

  if (
    config.parsedInstructions?.login?.email?.trim() &&
    config.parsedInstructions?.login?.password?.trim() &&
    shouldSkipSignupScenario(scenario.definition.feature, scenario.definition.scenario)
  ) {
    return {
      scenarioId: scenario.id,
      feature: scenario.definition.feature,
      scenario: scenario.definition.scenario,
      status: "skipped",
      errorReason: "Skipped — signup does not apply when regression uses login credentials.",
      screenshots: [],
      consoleErrors: [],
      networkErrors: [],
      pageUrl: config.baseUrl,
      timestamp,
      durationMs: Date.now() - started,
      selfHealing: {
        attempted: false,
        recovered: false,
        attempts: 0,
        strategyLogs: [],
      },
      preconditionDiscovery: {
        missingPreconditions: [],
        actionsTaken: ["Signup skipped because login credentials were provided for this run."],
        retryResult: "not-needed",
      },
    };
  }

  if (
    isRunAuthenticated(config.runId) &&
    shouldSkipGuestCheckoutScenario(scenario.definition.feature, scenario.definition.scenario)
  ) {
    return {
      scenarioId: scenario.id,
      feature: scenario.definition.feature,
      scenario: scenario.definition.scenario,
      status: "skipped",
      errorReason: "Skipped — guest checkout does not apply when already logged in.",
      screenshots: [],
      consoleErrors: [],
      networkErrors: [],
      pageUrl: config.baseUrl,
      timestamp,
      durationMs: Date.now() - started,
      selfHealing: {
        attempted: false,
        recovered: false,
        attempts: 0,
        strategyLogs: [],
      },
      preconditionDiscovery: {
        missingPreconditions: [],
        actionsTaken: ["Reused authenticated session; guest checkout scenario skipped."],
        retryResult: "not-needed",
      },
    };
  }

  if (isAuthenticatedUrl(page.url())) {
    markRunAuthenticated(config.runId);
  }

  const screenshotParams = {
    scenarioId: scenario.id,
    deviceName,
    stepIndex: Math.max(1, scenario.definition.when.length),
    stepLabel: scenario.definition.scenario,
    feature: scenario.definition.feature,
    scenarioText: scenario.definition.scenario,
    memoryFlowPaths,
    runId: config.runId,
  };

  try {
    writeExecutionDebugLog({
      runId: config.runId,
      stage: "SCENARIO_START",
      message: "Scenario execution started.",
      metadata: {
        scenarioId: scenario.id,
        scenarioTitle: scenario.definition.scenario,
        generatedSteps: {
          given: scenario.definition.given,
          when: scenario.definition.when,
          then: scenario.definition.then,
        },
        parsedInstructionData: {
          login: config.parsedInstructions?.login,
          address: config.parsedInstructions?.address,
          payment: config.parsedInstructions?.payment,
          selectors: config.parsedInstructions?.selectors,
        },
        currentUrl: config.baseUrl,
        executionStatus: "running",
        retryCount: 0,
      },
    });
    const scenarioIntent = scenario.definition.when.join(" ").trim();
    const waitFollowUps = getWaitFollowUpIntents(scenarioIntent);
    const scenarioTimeboxMs = getScenarioTimeboxMs(
      scenario.definition.feature,
      scenario.definition.scenario,
      config.selectedTestType
    );

    if (/^wait\b/i.test(scenarioIntent) && waitFollowUps.length === 0) {
      await waitForInteractivePage(page, config.timeoutMs ?? 30_000);
      pageUrl = page.url() || config.baseUrl;
      preconditionDiscovery.actionsTaken.push("Wait-only command recognized; state stabilized.");
    } else if (/^wait\b/i.test(scenarioIntent) && waitFollowUps.length > 0) {
      await waitForInteractivePage(page, config.timeoutMs ?? 30_000);
      preconditionDiscovery.actionsTaken.push("Wait completed; executing follow-up action(s).");
      pageUrl = await runWithTimeout(
        scenario.definition.scenario,
        scenarioTimeboxMs,
        () =>
          executeCoreScenario(
            page,
            scenario,
            config,
            "",
            preconditionDiscovery,
            loopGuards,
            {
              navigateToBase: false,
              memorySelectors,
              intentOverride: waitFollowUps,
              executionMemory: memorySnapshot,
            }
          ),
        "scenario"
      );
    } else {
      pageUrl = await runWithTimeout(
        scenario.definition.scenario,
        scenarioTimeboxMs,
        () =>
          executeCoreScenario(
            page,
            scenario,
            config,
            "",
            preconditionDiscovery,
            loopGuards,
            {
              navigateToBase: params.navigateToBase ?? true,
              memorySelectors,
              executionMemory: memorySnapshot,
            }
          ),
        "scenario"
      );
    }

    if (isEcommerceRegressionRun(config)) {
      await assertEcommerceRegressionOutcome({
        page,
        scenario: scenario.definition,
        runId: config.runId,
        cartHasItems: isRunCartPopulated(config.runId),
      });
    }

    await maybeCaptureScreenshot(
      page,
      config.screenshotMode,
      "passed",
      { ...screenshotParams, captureType: "landing" },
      reportPaths,
      screenshots
    );

  } catch (error) {
    const firstError =
      error instanceof Error ? error.message : "Unknown scenario execution failure.";
    const isTimedOut = /timed out after \d+ seconds/i.test(firstError);
    if (isTimedOut) {
      preconditionDiscovery.actionsTaken.push(`Scenario timed out: ${firstError}`);
    }

    const enableHealing =
      config.enableAdvancedSelfHealing !== false &&
      !(
        isTimedOut &&
        isEcommerceRegressionRun(config)
      );
    const maxAttempts = Math.max(1, config.maxSelfHealingAttempts ?? 1);

    let recovered = false;
    if (enableHealing) {
      selfHealing.attempted = true;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        selfHealing.attempts = attempt;
        const healingOutcome = await attemptAdvancedSelfHealing({
          page,
          baseUrl: config.baseUrl,
          timeoutMs: config.timeoutMs ?? 30_000,
          originalError: firstError,
          allowBaseRecovery:
            !(config.selectedTestType ?? "").toLowerCase().includes("custom command") &&
            !(
              (config.siteSuite === "ecommerce" || config.siteSuite === "mixed") &&
              /full regression|smoke/.test((config.selectedTestType ?? "").toLowerCase())
            ),
        });
        selfHealing.strategyLogs.push(
          ...healingOutcome.strategyLogs.map((line) => `Attempt ${attempt}: ${line}`)
        );
        writeExecutionDebugLog({
          runId: config.runId,
          stage: "SELF_HEALING_AGENT",
          message: "Self-healing attempt result.",
          metadata: {
            scenarioId: scenario.id,
            scenarioTitle: scenario.definition.scenario,
            retryCount: attempt,
            recovered: healingOutcome.recovered,
            logs: healingOutcome.strategyLogs,
          },
        });

        if (!healingOutcome.recovered) {
          continue;
        }

        try {
          pageUrl = await executeCoreScenario(
            page,
            scenario,
            config,
            "",
            preconditionDiscovery,
            loopGuards,
            { navigateToBase: false, memorySelectors, executionMemory: memorySnapshot }
          );
          await assertEcommerceRegressionOutcome({
            page,
            scenario: scenario.definition,
            runId: config.runId,
            cartHasItems: isRunCartPopulated(config.runId),
          });
          recovered = true;
          selfHealing.recovered = true;
          await maybeCaptureScreenshot(
            page,
            config.screenshotMode,
            "passed",
            { ...screenshotParams, captureType: "recovered" },
            reportPaths,
            screenshots
          );
          break;
        } catch (retryError) {
          const retryMessage =
            retryError instanceof Error ? retryError.message : "Retry failed after healing.";
          selfHealing.strategyLogs.push(`Attempt ${attempt}: retry failed (${retryMessage})`);
        }
      }
    }

    if (!recovered) {
      status = "failed";
      errorReason = firstError;
      await maybeCaptureScreenshot(
        page,
        config.screenshotMode,
        "failed",
        { ...screenshotParams, captureType: "failure" },
        reportPaths,
        screenshots
      );
    }
  } finally {
    if (ownsPage) {
      await page.close();
    }
  }

  writeExecutionDebugLog({
    runId: config.runId,
    stage: "SCENARIO_COMPLETE",
    message: "Scenario execution completed.",
    metadata: {
      scenarioId: scenario.id,
      scenarioTitle: scenario.definition.scenario,
      generatedSteps: {
        given: scenario.definition.given,
        when: scenario.definition.when,
        then: scenario.definition.then,
      },
      currentUrl: pageUrl,
      executionStatus: status,
      retryCount: selfHealing.attempts,
      completionStatus: status,
      preconditionDiscovery,
    },
  });

  const selectorHits = preconditionDiscovery.actionsTaken
    .filter((line) => line.startsWith("Resolved action using "))
    .map((line) => line.split(": ").slice(1).join(": ").trim())
    .filter(Boolean);
  const siteHostname = domain;
  updateExecutionMemory(domain, {
    successfulSelectors: status === "passed" ? selectorHits : [],
    failedSelectors: status === "failed" ? selectorHits : [],
    successfulFlowPaths: status === "passed" ? [pageUrl] : [],
    failedFlowPaths: status === "failed" ? [pageUrl] : [],
    provenJourneySteps:
      status === "passed" && scenario.definition.feature === "Custom Command"
        ? scenario.definition.when
        : [],
    assumptions:
      preconditionDiscovery.investigationFindings && preconditionDiscovery.investigationFindings.length > 0
        ? preconditionDiscovery.investigationFindings
        : [],
    customCommandMappings: (config.parsedInstructions?.naturalLanguageCommands ?? []).map((command) => ({
      command,
      mappedAction: scenario.definition.scenario,
      success: status === "passed",
      recordedAt: new Date().toISOString(),
    })),
  });

  return {
    scenarioId: scenario.id,
    feature: scenario.definition.feature,
    scenario: scenario.definition.scenario,
    status,
    errorReason,
    screenshots,
    consoleErrors: filterConsoleErrors(observers.consoleErrors, siteHostname),
    networkErrors: filterNetworkErrors(observers.networkErrors, siteHostname),
    pageUrl,
    timestamp,
    durationMs: Date.now() - started,
    selfHealing,
    preconditionDiscovery,
  };
}
