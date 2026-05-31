import { parseInstructionText } from "@/core/instructionParser";
import { runPlaywrightExecution } from "./playwrightExecutionEngine";
import type { ExecutableScenarioInput } from "@/types";

async function runSampleSmoke() {
  const parsed = parseInstructionText(`
  - Validate homepage content
  email: qa.user@example.test
  password: Password@123
  `);

  const scenarios: ExecutableScenarioInput[] = [
    {
      id: "smoke-1",
      definition: {
        feature: "Navigation",
        scenario: "Homepage renders expected static content",
        priority: "High",
        riskLevel: "Medium",
        given: ["site is reachable", parsed.naturalLanguageCommands[0] ?? "default smoke command"],
        when: ["user loads homepage"],
        then: ["homepage renders non-empty title and body"],
        requiredTestData: [],
        skipConditions: [],
        expectedResult: "Homepage is loaded successfully.",
        executionStatus: "executable",
      },
    },
    {
      id: "smoke-2",
      definition: {
        feature: "Checkout",
        scenario: "Checkout path should be skipped if unavailable",
        priority: "High",
        riskLevel: "High",
        given: ["checkout capability not discovered"],
        when: ["scenario is evaluated"],
        then: ["scenario is skipped with reason"],
        requiredTestData: ["payment.cardNumber"],
        skipConditions: ["No checkout capability"],
        expectedResult: "Scenario skipped safely.",
        executionStatus: "skipped",
        skipReason: "Checkout not available in smoke sample.",
      },
    },
  ];

  const result = await runPlaywrightExecution({
    config: {
      runId: `sample-smoke-${Date.now()}`,
      baseUrl: "https://example.com",
      browser: "Chrome",
      mode: "headless",
      devices: ["Desktop"],
      screenshotMode: "pass-fail",
      timeoutMs: 20_000,
    },
    scenarios,
  });

  console.log(`Sample smoke completed. Report: ${result.reportPath}`);
  console.log(
    JSON.stringify(
      {
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped,
        scenarios: result.scenarios.length,
      },
      null,
      2
    )
  );
}

void runSampleSmoke();
