import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { parseInstructionText } from "@/core/instructionParser";
import { generateBugIntelligenceFromRun } from "@/server/bug-intelligence/bugIntelligenceEngine";
import { runPlaywrightExecution } from "@/server/execution/playwrightExecutionEngine";
import type { ExecutableScenarioInput, ExecutionRunResult } from "@/types";

export const runtime = "nodejs";

interface RetryRequestBody {
  instruction?: string;
  targetScenarioId?: string;
}

function getLatestRunReportPath(): string | null {
  const root = path.join(process.cwd(), "src", "reports", "executions");
  if (!fs.existsSync(root)) {
    return null;
  }
  const entries = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const folderPath = path.join(root, entry.name);
      const stat = fs.statSync(folderPath);
      return { folderPath, mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  for (const entry of entries) {
    const resultPath = path.join(entry.folderPath, "result.json");
    if (fs.existsSync(resultPath)) {
      return resultPath;
    }
  }
  return null;
}

function selectTargetScenario(run: ExecutionRunResult, instruction: string) {
  const failed = run.scenarios.filter((scenario) => scenario.status === "failed");
  if (failed.length === 0) {
    return null;
  }
  const lowerInstruction = instruction.toLowerCase();

  const directId = failed.find((scenario) =>
    lowerInstruction.includes(scenario.scenarioId.toLowerCase())
  );
  if (directId) {
    return directId;
  }

  const scored = failed
    .map((scenario) => {
      const haystack = `${scenario.feature} ${scenario.scenario}`.toLowerCase();
      let score = 0;
      for (const token of lowerInstruction.split(/\s+/).filter(Boolean)) {
        if (token.length < 3) continue;
        if (haystack.includes(token)) score += 1;
      }
      return { scenario, score };
    })
    .sort((a, b) => b.score - a.score);

  if (scored[0]?.score > 0) {
    return scored[0].scenario;
  }
  return failed[0];
}

function computeEffectiveSummary(run: ExecutionRunResult) {
  type RetryLog = NonNullable<ExecutionRunResult["retryAssistant"]>["logs"][number];
  const latestByScenario = new Map<string, RetryLog>();
  for (const item of run.retryAssistant?.logs ?? []) {
    latestByScenario.set(item.scenarioId, item);
  }

  const effectiveStatuses = run.scenarios.map((scenario) => {
    const retry = latestByScenario.get(scenario.scenarioId);
    return retry ? retry.retryResult.status : scenario.status;
  });

  return {
    passed: effectiveStatuses.filter((status) => status === "passed").length,
    failed: effectiveStatuses.filter((status) => status === "failed").length,
    skipped: effectiveStatuses.filter((status) => status === "skipped").length,
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as RetryRequestBody | null;
  const instruction = body?.instruction?.trim() ?? "";
  if (!instruction) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_REQUEST", message: "instruction is required." } },
      { status: 400 }
    );
  }

  const reportPath = getLatestRunReportPath();
  if (!reportPath) {
    return NextResponse.json(
      { ok: false, error: { code: "NO_REPORT", message: "No execution report found." } },
      { status: 404 }
    );
  }

  const run = JSON.parse(fs.readFileSync(reportPath, "utf-8")) as ExecutionRunResult;
  const explicitTarget = body?.targetScenarioId?.trim();
  const targetScenario = explicitTarget
    ? run.scenarios.find(
        (scenario) =>
          scenario.scenarioId === explicitTarget && scenario.status === "failed"
      ) ?? selectTargetScenario(run, instruction)
    : selectTargetScenario(run, instruction);
  if (!targetScenario) {
    return NextResponse.json({
      ok: true,
      message: "No failed scenario available to retry.",
      data: run,
    });
  }

  const parsed = parseInstructionText(instruction);
  const retryInput: ExecutableScenarioInput = {
    id: `${targetScenario.scenarioId}-retry`,
    definition: {
      feature: targetScenario.feature,
      scenario: `${targetScenario.scenario} (retry with assistant)`,
      priority: "High",
      riskLevel: "High",
      given: [
        "scenario previously failed",
        ...parsed.naturalLanguageCommands.slice(0, 3),
      ],
      when: ["retry assistant executes scenario with updated instruction context"],
      then: ["scenario outcome is re-evaluated and stored as retry attempt"],
      requiredTestData: [],
      skipConditions: [],
      expectedResult: "Scenario should pass after updated retry instructions are applied.",
      executionStatus: "executable",
    },
  };

  const retryRun = await runPlaywrightExecution({
    config: {
      runId: `${run.runId}-retry-${Date.now()}`,
      baseUrl: targetScenario.pageUrl || "https://example.com",
      browser: "Chrome",
      mode: "headless",
      devices: ["Desktop"],
      screenshotMode: "pass-fail",
      timeoutMs: 25_000,
      parsedInstructions: parsed,
      enableAdvancedSelfHealing: true,
      maxSelfHealingAttempts: 2,
    },
    scenarios: [retryInput],
  });

  const retryResult = retryRun.scenarios[0];
  const newLog = {
    id: `retry-${Date.now()}`,
    scenarioId: targetScenario.scenarioId,
    userInstruction: instruction,
    retryPlan: {
      cssSelectors: parsed.selectors.cssSelectors,
      xpaths: parsed.selectors.xpaths,
      playwrightLocators: parsed.selectors.playwrightLocators,
      naturalLanguageCommands: parsed.naturalLanguageCommands,
    },
    retryResult,
    createdAt: new Date().toISOString(),
  };

  run.retryAssistant = run.retryAssistant ?? {
    logs: [],
    effectiveSummary: { passed: run.passed, failed: run.failed, skipped: run.skipped },
  };
  run.retryAssistant.logs.push(newLog);
  run.retryAssistant.effectiveSummary = computeEffectiveSummary(run);

  const latestByScenario = new Map<string, typeof newLog>();
  for (const item of run.retryAssistant.logs) {
    latestByScenario.set(item.scenarioId, item);
  }
  const effectiveScenarioView = run.scenarios.map((scenario) => {
    const retry = latestByScenario.get(scenario.scenarioId);
    if (!retry) return scenario;
    return {
      ...scenario,
      status: retry.retryResult.status,
      errorReason: retry.retryResult.errorReason,
      screenshots: retry.retryResult.screenshots,
      consoleErrors: retry.retryResult.consoleErrors,
      networkErrors: retry.retryResult.networkErrors,
      pageUrl: retry.retryResult.pageUrl,
      timestamp: retry.retryResult.timestamp,
      durationMs: retry.retryResult.durationMs,
      selfHealing: retry.retryResult.selfHealing,
      preconditionDiscovery: retry.retryResult.preconditionDiscovery,
    };
  });
  run.bugReports = generateBugIntelligenceFromRun({ scenarios: effectiveScenarioView });

  fs.writeFileSync(reportPath, JSON.stringify(run, null, 2), "utf-8");

  return NextResponse.json({
    ok: true,
    message: `Retried ${targetScenario.scenarioId}. New status: ${retryResult.status}`,
    data: {
      run,
      targetScenarioId: targetScenario.scenarioId,
      retryResult,
      userInstruction: instruction,
    },
  });
}
