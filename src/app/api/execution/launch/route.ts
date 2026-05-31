import { NextRequest, NextResponse } from "next/server";
import { createExecutionHistoryRun } from "@/database/executionHistoryRepository";
import { runPlaywrightExecution } from "@/server/execution/playwrightExecutionEngine";
import { writeExecutionDebugLog } from "@/server/execution/executionDebugLogger";
import {
  runAutomationAgent,
  runDiscoveryAgent,
  runPlannerAgent,
  runTestDesignAgent,
} from "@/server/orchestration/runtimeAgentPipeline";
import {
  completeExecutionProgress,
  failExecutionProgress,
  getExecutionProgressSnapshot,
  initializeExecutionProgress,
  type LaunchExecutionRequest,
  updateExecutionProgress,
} from "@/server/execution/progressStreamStore";
import {
  initRunControl,
  waitWhilePausedOrStopped,
} from "@/server/execution/executionControlStore";
import type { ParsedInstructionData } from "@/types";
import { readExecutionMemory } from "@/server/execution/executionMemoryStore";
import { buildCapabilityMapFromMemory } from "@/server/execution/executionCapabilityResolver";
import { resetRunSession } from "@/server/execution/ecommerceSessionStore";

export const runtime = "nodejs";

type LaunchBody = Partial<LaunchExecutionRequest>;

function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return trimmed;
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    // Common typo: https://subdomain@example.com → https://subdomain.example.com
    if (parsed.username && !parsed.password && parsed.hostname.includes(".")) {
      const pathname = parsed.pathname === "/" ? "" : parsed.pathname;
      return `${parsed.protocol}//${parsed.username}.${parsed.hostname}${pathname}${parsed.search}`;
    }
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return withProtocol;
  }
}

function getEmptyParsedInstructions(): ParsedInstructionData {
  return {
    rawText: "",
    bulletPoints: [],
    naturalLanguageCommands: [],
    login: {},
    signup: {},
    address: {},
    payment: {},
    selectors: {
      cssSelectors: [],
      xpaths: [],
      playwrightLocators: [],
    },
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as LaunchBody | null;
  if (!body?.websiteUrl || !body?.selectedTestType || !body.browser || !body.mode) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message: "websiteUrl, selectedTestType, browser, and mode are required.",
        },
      },
      { status: 400 }
    );
  }

  const normalizedWebsiteUrl = normalizeWebsiteUrl(body.websiteUrl);

  try {
    new URL(normalizedWebsiteUrl);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_URL",
          message: "Provide a valid absolute website URL.",
        },
      },
      { status: 400 }
    );
  }

  const runId = `run-${Date.now()}`;
  const websiteUrl = normalizedWebsiteUrl;
  const selectedTestType = body.selectedTestType;
  const browser = body.browser;
  const mode = body.mode;
  const parsedInstructions = body.parsedInstructions ?? getEmptyParsedInstructions();
  const devices = body.devices && body.devices.length > 0 ? body.devices : ["Desktop"];
  const screenshotMode = body.screenshotMode ?? "pass-fail";

  initializeExecutionProgress({
    runId,
    browser,
    devices,
    url: websiteUrl,
  });
  initRunControl(runId);
  resetRunSession(runId);

  void (async () => {
    try {
      await waitWhilePausedOrStopped(runId);
      const memoryDomain = (() => {
        try {
          return new URL(websiteUrl).hostname;
        } catch {
          return "";
        }
      })();
      const executionMemory = memoryDomain ? readExecutionMemory(memoryDomain) : undefined;
      const capabilityMap = executionMemory
        ? buildCapabilityMapFromMemory(executionMemory)
        : undefined;
      writeExecutionDebugLog({
        runId,
        stage: "UI_REQUEST",
        message: "Execution launch request accepted.",
        metadata: {
          websiteUrl,
          selectedTestType,
          browser,
          mode,
          devices,
          screenshotMode,
        },
      });
      const planner = runPlannerAgent({
        websiteUrl,
        selectedTestType,
        parsedInstructions,
      });
      writeExecutionDebugLog({
        runId,
        stage: "PLANNER_AGENT",
        message: "Planner strategy generated.",
        metadata: {
          strategySummary: planner.strategySummary,
          businessCriticalFlows: planner.businessCriticalFlows,
          prioritizedFlows: planner.prioritizedFlows,
          skippedFlows: planner.skippedFlows,
        },
      });
      updateExecutionProgress(runId, {
        status: "running",
        orchestrationState: "DISCOVERY",
        currentPhase: "Discovery",
        progressPercentage: 8,
        currentTestCaseTitle: selectedTestType.toLowerCase().includes("custom command")
          ? "Preparing custom command scenarios (fast discovery)"
          : "Running website discovery",
        currentUrl: websiteUrl,
        log: selectedTestType.toLowerCase().includes("custom command")
          ? "Using fast discovery for custom command automation."
          : `Discovery started for ${websiteUrl}`,
      });
      await waitWhilePausedOrStopped(runId);

      const discoveryAgentOutput = await runDiscoveryAgent({
        websiteUrl,
        selectedTestType,
        onProgress: (event) => {
          const crawlProgress =
            event.maxPages > 0
              ? Math.round((event.pagesCrawled / event.maxPages) * 22)
              : 0;
          updateExecutionProgress(runId, {
            status: "running",
            orchestrationState: "DISCOVERY",
            currentPhase:
              event.stage === "crawling" || event.stage === "complete"
                ? "Crawling"
                : "Discovery",
            progressPercentage: Math.min(8 + crawlProgress, 30),
            currentTestCaseTitle: event.message,
            currentUrl: event.currentUrl ?? websiteUrl,
            log: event.message,
          });
        },
      });
      const discovery = discoveryAgentOutput.discovery;
      writeExecutionDebugLog({
        runId,
        stage: "DISCOVERY_AGENT",
        message: "Discovery completed.",
        metadata: {
          websiteType: discovery.websiteType,
          siteSuite: discovery.siteSuite,
          classificationNotes: discovery.classificationNotes,
          pages: discovery.pagesFound.length,
          forms: discovery.formsFound.length,
          links: discovery.linksFound.length,
        },
      });

      updateExecutionProgress(runId, {
        orchestrationState: "TEST_GENERATION",
        currentPhase: "Test Generation",
        progressPercentage: 35,
        currentTestCaseTitle: `Generating ${discovery.siteSuite ?? "contextual"} regression scenarios`,
        currentUrl: discovery.baseUrl,
        log: `Discovery classified as ${discovery.websiteType} (${discovery.siteSuite ?? "static"} suite). ${discovery.pagesFound.length} pages, ${discovery.formsFound.length} forms.`,
      });
      await waitWhilePausedOrStopped(runId);

      const testDesignOutput = runTestDesignAgent({
        discovery,
        selectedTestType,
        parsedInstructions,
        capabilityMap,
      });
      const generated = {
        scenarios: testDesignOutput.scenarios,
        totalScenarios: testDesignOutput.scenarios.length,
        executableScenarios: testDesignOutput.executableCount,
        skippedScenarios: testDesignOutput.skippedCount,
      };
      writeExecutionDebugLog({
        runId,
        stage: "TEST_GENERATION_AGENT",
        message: "Scenario generation completed.",
        metadata: {
          totalScenarios: generated.totalScenarios,
          executableScenarios: generated.executableScenarios,
          skippedScenarios: generated.skippedScenarios,
          selectedTestType,
          parsedInstructionSummary: {
            rawCustomCommand: parsedInstructions.rawText,
            naturalLanguageCommands: parsedInstructions.naturalLanguageCommands,
            login: parsedInstructions.login,
            address: parsedInstructions.address,
            payment: parsedInstructions.payment,
            selectors: parsedInstructions.selectors,
          },
        },
      });

      const { executableQueue: executable } = runAutomationAgent({
        scenarios: generated.scenarios,
        selectedTestType,
        discovery,
        capabilityMap,
      });
      writeExecutionDebugLog({
        runId,
        stage: "SCENARIO_QUEUE",
        message: "Scenario queue prepared.",
        metadata: {
          queuedCount: executable.length,
          queuedScenarios: executable.map((s) => ({
            id: s.id,
            title: s.definition.scenario,
            feature: s.definition.feature,
            given: s.definition.given,
            when: s.definition.when,
            then: s.definition.then,
            executionStatus: s.definition.executionStatus,
          })),
        },
      });

      updateExecutionProgress(runId, {
        orchestrationState: "SCENARIO_QUEUE_READY",
        totalGeneratedTestCases: executable.length,
        progressPercentage: 48,
        currentTestCaseTitle: "Preparing execution contexts",
        log: `Generated ${generated.totalScenarios} scenarios (${generated.executableScenarios} executable, ${generated.skippedScenarios} skipped).`,
      });

      if (executable.length === 0) {
        throw new Error("No executable scenarios found for this website and test type.");
      }

      await waitWhilePausedOrStopped(runId);

      for (const scenario of executable) {
        updateExecutionProgress(runId, {
          testCaseUpdate: {
            id: scenario.id,
            title: scenario.definition.scenario,
            status: "pending",
          },
        });
      }

      updateExecutionProgress(runId, {
        status: "running",
        orchestrationState: "EXECUTION",
        currentPhase: "Execution",
        progressPercentage: 52,
        currentTestCaseTitle: "Launching browser and executing scenarios",
        log: "Starting Playwright scenario execution.",
      });

      const result = await runPlaywrightExecution({
        config: {
          runId,
          baseUrl: websiteUrl,
          browser,
          mode,
          devices,
          screenshotMode,
          timeoutMs: 30000,
          enableAdvancedSelfHealing: true,
          maxSelfHealingAttempts: 2,
          selectedTestType,
          safeTestMode: true,
          parsedInstructions,
          siteSuite: discovery.siteSuite,
          discoveryPages: discovery.pagesFound,
          executionMemory,
        },
        scenarios: executable,
        onProgress: (progress) => {
          writeExecutionDebugLog({
            runId,
            stage: "EXECUTION_AGENT",
            message: progress.message,
            metadata: {
              phase: progress.phase,
              progressPercentage: progress.progressPercentage,
              currentScenarioTitle: progress.currentScenarioTitle,
              currentUrl: progress.currentUrl,
              passCount: progress.passCount,
              failCount: progress.failCount,
              skippedCount: progress.skippedCount,
              totalScenarios: progress.totalScenarios,
              executedScenarios: progress.executedScenarios,
              testCaseUpdate: progress.testCaseUpdate,
            },
          });
          updateExecutionProgress(runId, {
            status: "running",
            orchestrationState:
              progress.phase === "Reporting"
                ? "REPORTING"
                : progress.phase === "Post-Run Analysis"
                  ? "BUG_ANALYSIS"
                  : "EXECUTION",
            currentPhase: progress.phase,
            progressPercentage: progress.progressPercentage,
            currentTestCaseTitle: progress.currentScenarioTitle ?? progress.message,
            currentUrl: progress.currentUrl,
            passCount: progress.passCount,
            failCount: progress.failCount,
            skippedCount: progress.skippedCount,
            totalGeneratedTestCases: progress.totalScenarios,
            currentExecutingTestCaseNumber: progress.executedScenarios,
            log: progress.message,
            testCaseUpdate: progress.testCaseUpdate,
          });
        },
      });

      updateExecutionProgress(runId, {
        orchestrationState: "RESULT_COLLECTION",
        currentPhase: "Reporting",
        progressPercentage: 96,
        currentTestCaseTitle: "Collecting scenario results",
        log: "Execution finished. Collecting run artifacts and terminal statuses.",
      });
      writeExecutionDebugLog({
        runId,
        stage: "RESULT_COLLECTION",
        message: "Transitioned to result collection lifecycle state.",
      });

      createExecutionHistoryRun({
        websiteUrl,
        testType: selectedTestType,
        browser,
        mode: mode === "headed" ? "Headed" : "Headless",
        devices,
        startTime: result.startedAt,
        endTime: result.completedAt,
        durationSeconds: Math.max(0, Math.round(result.durationMs / 1000)),
        totalCases: result.scenarios.length,
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped,
        bugsFound: result.bugReports.length,
        reportPath: result.productionReportPaths?.html ?? result.reportPath,
        status: result.failed > 0 ? "failed" : "completed",
      });
      writeExecutionDebugLog({
        runId,
        stage: "RESULT_COLLECTION",
        message: "Execution result persisted to history.",
        metadata: {
          passed: result.passed,
          failed: result.failed,
          skipped: result.skipped,
          reportPath: result.reportPath,
        },
      });

      updateExecutionProgress(runId, {
        orchestrationState: "BUG_ANALYSIS",
        currentPhase: "Reporting",
        progressPercentage: 98,
        currentTestCaseTitle: "Running bug intelligence analysis",
        log: "Generating user-friendly bug intelligence and confidence scores.",
      });
      writeExecutionDebugLog({
        runId,
        stage: "BUG_ANALYSIS_AGENT",
        message: "Bug intelligence lifecycle stage completed.",
      });

      const progressBeforeComplete = getExecutionProgressSnapshot(runId);
      if (progressBeforeComplete?.status === "cancelled") {
        writeExecutionDebugLog({
          runId,
          stage: "REPORTING_AGENT",
          message: "Run stopped by user; skipping final completion marker.",
        });
        return;
      }

      completeExecutionProgress(runId, result);
      writeExecutionDebugLog({
        runId,
        stage: "REPORTING_AGENT",
        message: "Reporting completed and run marked complete.",
        metadata: {
          html: result.productionReportPaths?.html,
          json: result.productionReportPaths?.json,
          markdown: result.productionReportPaths?.markdown,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected execution failure.";
      if (message.includes("stopped by user")) {
        return;
      }
      failExecutionProgress(runId, message);
      writeExecutionDebugLog({
        runId,
        stage: "FAILED",
        message: "Execution failed.",
        metadata: { error: message },
      });
    }
  })();

  return NextResponse.json(
    {
      ok: true,
      data: {
        runId,
        status: "queued",
      },
    },
    { status: 202 }
  );
}
