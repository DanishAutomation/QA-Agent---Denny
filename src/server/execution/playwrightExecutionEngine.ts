import type { BrowserContext, Page } from "playwright-core";
import type {
  ExecutableScenarioInput,
  ExecutionRunResult,
  PlaywrightExecutionConfig,
  ScenarioExecutionResult,
} from "@/types";
import type { ExecutionPhase } from "@/lib/mockExecutionState";
import { launchBrowser, getDeviceDescriptor } from "./browserFactory";
import { createReportPaths, writeExecutionReport } from "./reportWriter";
import { executeScenarioOnPage } from "./scenarioExecutor";
import { generateBugIntelligenceFromRun } from "../bug-intelligence/bugIntelligenceEngine";
import { runResponsiveTestingEngine } from "./responsiveTestingEngine";
import { runBrokenLinksAndFormsTesting } from "./brokenLinksFormsEngine";
import { runAccessibilityRiskChecks } from "./accessibilityRiskEngine";
import { generateProductionGradeReports } from "./productionReportGenerator";
import { writeExecutionDebugLog } from "./executionDebugLogger";
import {
  clearCheckoutSession,
  isPostPaymentScenarioText,
  shouldSkipPostPaymentSteps,
} from "./checkoutSessionStore";
import {
  clearRunControl,
  getRunControlState,
  waitForRunControl,
} from "./executionControlStore";
import {
  applyPostRunReportOutcomes,
  summarizeRunCounts,
} from "./postRunReportSync";

export async function runPlaywrightExecution(params: {
  config: PlaywrightExecutionConfig;
  scenarios: ExecutableScenarioInput[];
  onProgress?: (update: {
    phase: ExecutionPhase;
    message: string;
    progressPercentage?: number;
    currentScenarioTitle?: string;
    currentUrl?: string;
    passCount?: number;
    failCount?: number;
    skippedCount?: number;
    totalScenarios?: number;
    executedScenarios?: number;
    testCaseUpdate?: {
      id: string;
      title: string;
      status: "pending" | "running" | "passed" | "failed" | "skipped";
    };
  }) => void;
}): Promise<ExecutionRunResult> {
  const { config, scenarios, onProgress } = params;
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  const reportPaths = createReportPaths(config.runId);

  const browser = await launchBrowser(config.browser, config.mode);
  writeExecutionDebugLog({
    runId: config.runId,
    stage: "BROWSER_LIFECYCLE",
    message: "Browser launched.",
    metadata: { browser: config.browser, mode: config.mode },
  });
  const contextCache = new Map<string, BrowserContext>();
  const pageCache = new Map<string, Page>();
  const results: ScenarioExecutionResult[] = [];
  let responsiveReport: ExecutionRunResult["responsiveReport"] | undefined;
  let brokenLinksReport: ExecutionRunResult["brokenLinksReport"] | undefined;
  let formsReport: ExecutionRunResult["formsReport"] | undefined;
  let accessibilityRiskReport: ExecutionRunResult["accessibilityRiskReport"] | undefined;

  try {
    onProgress?.({
      phase: "Execution",
      message: "Launching browser contexts.",
      progressPercentage: 55,
      totalScenarios: scenarios.length,
      executedScenarios: 0,
    });
    for (const deviceName of config.devices) {
      const context = await browser.newContext({
        ...getDeviceDescriptor(deviceName),
        ignoreHTTPSErrors: true,
      });
      contextCache.set(deviceName, context);
      const page = await context.newPage();
      pageCache.set(deviceName, page);
      writeExecutionDebugLog({
        runId: config.runId,
        stage: "BROWSER_LIFECYCLE",
        message: "Context created.",
        metadata: { deviceName },
      });
    }

    const maintainSession =
      (config.selectedTestType ?? "").toLowerCase().includes("custom command") ||
      (config.siteSuite === "ecommerce" &&
        !(config.selectedTestType ?? "").toLowerCase().includes("login"));
    const maxScenarioExecutions = 250;
    if (scenarios.length * config.devices.length > maxScenarioExecutions) {
      throw new Error("Maximum scenario execution threshold exceeded.");
    }

    for (let scenarioIndex = 0; scenarioIndex < scenarios.length; scenarioIndex += 1) {
      const scenario = scenarios[scenarioIndex];
      const control = await waitForRunControl(config.runId);
      if (control === "stopped") {
        onProgress?.({
          phase: "Execution",
          message: "Execution stopped by user.",
          progressPercentage: 56 + Math.round((scenarioIndex / Math.max(1, scenarios.length)) * 30),
        });
        for (let skipIndex = scenarioIndex; skipIndex < scenarios.length; skipIndex += 1) {
          const skippedScenario = scenarios[skipIndex];
          onProgress?.({
            phase: "Execution",
            message: `Skipped after stop: ${skippedScenario.definition.scenario}`,
            testCaseUpdate: {
              id: skippedScenario.id,
              title: skippedScenario.definition.scenario,
              status: "skipped",
            },
          });
        }
        break;
      }

      const scenarioText = [
        scenario.definition.scenario,
        ...scenario.definition.when,
        ...scenario.definition.then,
      ].join(" ");
      if (
        shouldSkipPostPaymentSteps(config.runId) &&
        isPostPaymentScenarioText(scenarioText)
      ) {
        onProgress?.({
          phase: "Execution",
          message: `Skipped post-payment step (saved credentials): ${scenario.definition.scenario}`,
          progressPercentage: 55 + Math.round((scenarioIndex / Math.max(1, scenarios.length)) * 30),
          currentScenarioTitle: scenario.definition.scenario,
          currentUrl: config.baseUrl,
          testCaseUpdate: {
            id: scenario.id,
            title: scenario.definition.scenario,
            status: "skipped",
          },
        });
        results.push({
          scenarioId: scenario.id,
          feature: scenario.definition.feature,
          scenario: scenario.definition.scenario,
          status: "skipped",
          errorReason: "Saved payment on file; checkout flow stops at Make Payment.",
          screenshots: [],
          consoleErrors: [],
          networkErrors: [],
          pageUrl: config.baseUrl,
          timestamp: new Date().toISOString(),
          durationMs: 0,
          selfHealing: {
            attempted: false,
            recovered: false,
            attempts: 0,
            strategyLogs: [],
          },
          preconditionDiscovery: {
            missingPreconditions: [],
            actionsTaken: ["Skipped: saved payment credentials already on file."],
            retryResult: "not-needed",
          },
        });
        continue;
      }

      onProgress?.({
        phase: "Execution",
        message: `Executing scenario ${scenarioIndex + 1}/${scenarios.length}: ${scenario.definition.scenario}`,
        progressPercentage: 55 + Math.round((scenarioIndex / Math.max(1, scenarios.length)) * 30),
        currentScenarioTitle: scenario.definition.scenario,
        currentUrl: config.baseUrl,
        testCaseUpdate: {
          id: scenario.id,
          title: scenario.definition.scenario,
          status: "running",
        },
      });
      const perDeviceResults = await Promise.all(
        config.devices.map(async (deviceName) => {
          const context = contextCache.get(deviceName);
          const page = pageCache.get(deviceName);
          if (!context) {
            return null;
          }
          return executeScenarioOnPage({
            scenario,
            context,
            config,
            reportPaths,
            deviceName,
            page,
            navigateToBase: maintainSession ? scenarioIndex === 0 : true,
          });
        })
      );
      results.push(
        ...perDeviceResults.filter((item): item is ScenarioExecutionResult => item !== null)
      );
      const latest = perDeviceResults.filter((item): item is ScenarioExecutionResult => item !== null);
      const scenarioStatus =
        latest.some((item) => item.status === "failed")
          ? "failed"
          : latest.some((item) => item.status === "skipped")
            ? "skipped"
            : "passed";
      const passedSoFar = results.filter((item) => item.status === "passed").length;
      const failedSoFar = results.filter((item) => item.status === "failed").length;
      const skippedSoFar = results.filter((item) => item.status === "skipped").length;
      onProgress?.({
        phase: "Execution",
        message: `Scenario completed: ${scenario.definition.scenario} (${scenarioStatus})`,
        progressPercentage: 56 + Math.round(((scenarioIndex + 1) / Math.max(1, scenarios.length)) * 30),
        currentScenarioTitle: scenario.definition.scenario,
        currentUrl: latest[0]?.pageUrl ?? config.baseUrl,
        passCount: passedSoFar,
        failCount: failedSoFar,
        skippedCount: skippedSoFar,
        totalScenarios: scenarios.length,
        executedScenarios: scenarioIndex + 1,
        testCaseUpdate: {
          id: scenario.id,
          title: scenario.definition.scenario,
          status: scenarioStatus,
        },
      });
    }

    const selectedType = (config.selectedTestType ?? "").toLowerCase();
    const stoppedByUser = getRunControlState(config.runId) === "stopped";
    const shouldRunResponsive =
      !stoppedByUser &&
      (selectedType.includes("full regression") || selectedType.includes("responsive"));
    const shouldRunBrokenForms =
      !stoppedByUser &&
      (selectedType.includes("full regression") ||
        selectedType.includes("broken links") ||
        selectedType.includes("forms"));
    const shouldRunAccessibility =
      !stoppedByUser &&
      (selectedType.includes("full regression") || selectedType.includes("accessibility"));
    onProgress?.({
      phase: "Post-Run Analysis",
      message: "Running post-execution analysis checks (responsive/broken links/forms/accessibility).",
      currentScenarioTitle: "Post-run checks: responsive, links, forms, accessibility",
      progressPercentage: 90,
      totalScenarios: scenarios.length,
      executedScenarios: scenarios.length,
    });
    try {
      await Promise.all([
        shouldRunResponsive
          ? runResponsiveTestingEngine({
              browser,
              baseUrl: config.baseUrl,
              reportPaths,
              timeoutMs: config.timeoutMs,
              discoveryPages: config.discoveryPages,
            }).then((report) => {
              responsiveReport = report;
            })
          : Promise.resolve(),
        shouldRunBrokenForms
          ? runBrokenLinksAndFormsTesting({
              browser,
              baseUrl: config.baseUrl,
              reportPaths,
              safeTestMode: config.safeTestMode,
              parsedInstructions: config.parsedInstructions,
              discoveryPages: config.discoveryPages,
            }).then((reports) => {
              brokenLinksReport = reports.brokenLinksReport;
              formsReport = reports.formsReport;
            })
          : Promise.resolve(),
        shouldRunAccessibility
          ? runAccessibilityRiskChecks({
              browser,
              baseUrl: config.baseUrl,
              reportPaths,
              discoveryPages: config.discoveryPages,
            }).then((report) => {
              accessibilityRiskReport = report;
            })
          : Promise.resolve(),
      ]);
    } catch (postRunError) {
      writeExecutionDebugLog({
        runId: config.runId,
        stage: "POST_RUN_ANALYSIS",
        message: "Post-run analysis partially failed.",
        metadata: {
          error:
            postRunError instanceof Error ? postRunError.message : "Unknown post-run analysis error.",
        },
      });
    }
  } finally {
    clearCheckoutSession(config.runId);
    clearRunControl(config.runId);
    for (const page of pageCache.values()) {
      await page.close();
    }
    for (const context of contextCache.values()) {
      await context.close();
    }
    await browser.close();
    writeExecutionDebugLog({
      runId: config.runId,
      stage: "BROWSER_LIFECYCLE",
      message: "Browser and contexts closed.",
      metadata: { contextCount: contextCache.size },
    });
  }

  const siteHostname = (() => {
    try {
      return new URL(config.baseUrl).hostname;
    } catch {
      return "";
    }
  })();
  const syncedScenarios = applyPostRunReportOutcomes({
    scenarios: results,
    brokenLinksReport,
    formsReport,
    accessibilityRiskReport,
    responsiveReport,
    siteHostname,
  });
  const { passed, failed, skipped } = summarizeRunCounts(syncedScenarios);

  const output: ExecutionRunResult = {
    runId: config.runId,
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startedMs,
    passed,
    failed,
    skipped,
    reportPath: reportPaths.resultJsonPath,
    scenarios: syncedScenarios,
    bugReports: generateBugIntelligenceFromRun({
      scenarios: syncedScenarios,
      brokenLinksReport,
      formsReport,
      accessibilityRiskReport,
      responsiveReport,
    }),
    brokenLinksReport,
    formsReport,
    accessibilityRiskReport,
    responsiveReport,
    responsiveReportPath: responsiveReport ? reportPaths.responsiveReportJsonPath : undefined,
    brokenLinksReportPath: brokenLinksReport ? reportPaths.brokenLinksReportJsonPath : undefined,
    formsReportPath: formsReport ? reportPaths.formsReportJsonPath : undefined,
    accessibilityRiskReportPath: accessibilityRiskReport
      ? reportPaths.accessibilityRiskReportJsonPath
      : undefined,
  };

  output.productionReportPaths = generateProductionGradeReports({
    run: output,
    config,
    reportDir: reportPaths.reportDir,
  });

  onProgress?.({
    phase: "Reporting",
    message: "Execution reports generated.",
    progressPercentage: 100,
    currentScenarioTitle: "Completed",
    currentUrl: output.reportPath,
    passCount: passed,
    failCount: failed,
    skippedCount: skipped,
    totalScenarios: scenarios.length,
    executedScenarios: scenarios.length,
  });

  writeExecutionReport(reportPaths, output);
  return output;
}
