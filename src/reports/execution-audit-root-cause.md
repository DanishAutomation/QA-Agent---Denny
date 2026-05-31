# Execution Pipeline Audit & Root Cause Analysis

## Current Architecture (Observed)

UI (`new-execution`, `execution-progress`)
-> `POST /api/execution/launch`
-> Discovery (`runDiscovery`)
-> Test Generation (`generateDynamicTestScenarios`)
-> Scenario Queue build in launch route
-> Execution Engine (`runPlaywrightExecution`)
-> Scenario Executor (`executeScenarioOnPage` / `executeCoreScenario`)
-> Result Collection (`createExecutionHistoryRun`)
-> Reporting (`generateProductionGradeReports`)
-> SSE Progress stream (`/api/execution/progress`)

## Execution Flow Diagram

```text
IDLE
  -> DISCOVERY
  -> TEST_GENERATION
  -> EXECUTION
  -> RESULT_COLLECTION
  -> REPORTING
  -> COMPLETE

On error:
  -> FAILED
```

## Root Causes Found

1. Execution state transitions were not strictly validated; progress updates could be overwritten by out-of-order phase patches.
2. Scenario execution relied mostly on feature/scenario intent text, not structured scenario steps (`given/when/then`) and parsed commands.
3. No hard loop guardrails for repeated URL revisits, repeated login attempts, or excessive step actions.
4. Custom command automation lacked direct command-to-scenario conversion path.
5. Pipeline observability was insufficient to diagnose queue/step/execution/report timing behavior.

## Files Responsible

- `src/app/api/execution/launch/route.ts`
- `src/server/execution/progressStreamStore.ts`
- `src/server/execution/playwrightExecutionEngine.ts`
- `src/server/execution/scenarioExecutor.ts`
- `src/server/test-generation/dynamicTestGenerationEngine.ts`
- `src/server/execution/preconditionDiscoveryEngine.ts`

## Stabilization Fixes Implemented

1. Added orchestration-state validation and phase-order protection in `progressStreamStore`.
2. Added structured debug logging (`execution-debug.log`) at:
   - Discovery Agent
   - Test Generation Agent
   - Scenario Queue
   - Execution Agent
   - Self-Healing Agent
   - Reporting Agent
3. Added scenario-level logging fields:
   - Scenario ID
   - Scenario title
   - Generated steps
   - Current URL
   - Execution status
   - Retry count
   - Completion status
4. Added loop protection in scenario execution:
   - Max page revisit threshold
   - Repeated navigation pattern detection
   - Max step action threshold
   - Max login attempt threshold
5. Added custom command pipeline generation for selected `Custom Command Automation` test type.
6. Added browser lifecycle logging and thresholds in execution engine.

## Recommended Next Fix Iteration

1. Add persisted run-state store (SQLite table) for cross-process recovery and historical execution-state replay.
2. Implement deterministic step compiler (NL command -> typed action plan -> Playwright steps) with validation and confidence scoring.
3. Add per-step timeout/retry telemetry dashboard in Results page.
4. Add run-level invariant checks in CI:
   - Reporting cannot start before scenario terminal statuses.
   - Browser relaunch count threshold.
   - Revisit/retry threshold assertions.
