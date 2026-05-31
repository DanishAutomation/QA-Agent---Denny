import type { AppConfig, EnvironmentMode } from "@/types";

const DEFAULT_CONFIG: AppConfig = {
  env: "development",
  appName: "DennyQA vNext",
  database: {
    provider: "sqlite",
    connectionUrl: "file:./src/database/dennyqa.sqlite",
    migrationsPath: "./src/database/migrations",
  },
  playwrightMcp: {
    endpoint: "http://localhost:8931/mcp",
    timeoutMs: 30_000,
  },
  agentRuntime: {
    model: "gpt-5.5-medium",
    maxIterations: 10,
    defaultTimeoutMs: 45_000,
  },
  featureToggles: {
    accessibility: true,
    responsive: true,
    brokenLinks: true,
  },
};

function resolveEnv(value: string | undefined): EnvironmentMode {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
}

export function loadConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    env: resolveEnv(process.env.NODE_ENV),
    database: { ...DEFAULT_CONFIG.database, ...overrides.database },
    playwrightMcp: { ...DEFAULT_CONFIG.playwrightMcp, ...overrides.playwrightMcp },
    agentRuntime: { ...DEFAULT_CONFIG.agentRuntime, ...overrides.agentRuntime },
    featureToggles: {
      ...DEFAULT_CONFIG.featureToggles,
      ...overrides.featureToggles,
    },
  };
}

export const appConfig = loadConfig();
