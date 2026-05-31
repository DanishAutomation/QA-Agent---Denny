# DennyQA vNext

Base architecture scaffold for an AI Agentic QA Platform designed to evolve into an AI QA Engineer system, not a simple script runner.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- ShadCN UI
- Node.js-oriented backend modules (inside the Next.js project)
- Playwright MCP integration points
- SQLite-first data design, structured for PostgreSQL migration

## Current Scope

This phase implements architecture only:

1. Project structure
2. Folder architecture
3. Basic routing
4. Basic database structure
5. Basic agent module structure
6. Basic configuration system
7. Basic types/interfaces

No automation flows, hardcoded test cases, or full UI have been implemented yet.

## Phase 2 Added (Contracts + Orchestration Skeleton)

- Typed API response and run contract models (`src/types/api.ts`, `src/types/orchestration.ts`)
- Request validation contract for run creation (`src/server/contracts/runContracts.ts`)
- In-memory run store and orchestration service (`src/server/store/runStore.ts`, `src/server/orchestration/runService.ts`)
- Sequential agent pipeline scaffold (`src/server/orchestration/runPipeline.ts`)
- New run APIs (`src/app/api/runs/route.ts`):
  - `POST /api/runs` create a QA run from typed input
  - `GET /api/runs` list all runs
  - `GET /api/runs?runId=<id>` fetch a specific run

The orchestration pipeline invokes the registered agents in order and records step-level metadata, but does not execute browser automation yet.

## High-Level Structure

```text
src/
  app/
    api/
      agents/route.ts
      health/route.ts
    architecture/page.tsx
    agents/page.tsx
    config/page.tsx
    page.tsx
  components/
    app-shell.tsx
    ui/...
  lib/
    routes.ts
    utils.ts
  server/
    index.ts
    router.ts
  agents/
    plannerAgent.ts
    discoveryAgent.ts
    testDesignAgent.ts
    executionAgent.ts
    selfHealingAgent.ts
    bugAnalysisAgent.ts
    reportingAgent.ts
    jiraAgent.ts
    retryAssistantAgent.ts
  core/
    browserManager.ts
    deviceManager.ts
    testDataManager.ts
    screenshotManager.ts
    locatorManager.ts
    configManager.ts
  features/
    ecommerce/
    forms/
    brokenLinks/
    responsive/
    accessibility/
    staticPages/
    customCommands/
  reports/
  database/
    client.ts
    schema.sql
  types/
```

## Architectural Intent

- **AI-agent-first design:** dedicated modules for planning, discovery, test design, execution orchestration, self-healing, bug analysis, reporting, issue integration, and retry intelligence.
- **Separation of concerns:** `agents` (reasoning), `core` (runtime capabilities), `server` (backend orchestration), `features` (domain packs), and `database` (persistence).
- **Provider abstraction:** database configuration supports SQLite now and PostgreSQL later through a single config contract.
- **Playwright MCP readiness:** browser and execution architecture is prepared for MCP endpoint integrations.

## Routes (Current)

- `/` Home architecture overview
- `/architecture` System structure overview
- `/agents` Registered agent modules
- `/config` Runtime config visibility
- `/api/health` Basic health payload
- `/api/agents` Agent registry payload
- `/api/runs` QA run contract endpoint (create/list/get)

## Local Development

```bash
npm install
npm run dev
```

Build validation:

```bash
npm run build
```
