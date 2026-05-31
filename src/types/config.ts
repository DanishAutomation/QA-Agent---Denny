export type DatabaseProvider = "sqlite" | "postgres";

export type EnvironmentMode = "development" | "test" | "production";

export interface DatabaseConfig {
  provider: DatabaseProvider;
  connectionUrl: string;
  migrationsPath: string;
}

export interface PlaywrightMcpConfig {
  endpoint: string;
  timeoutMs: number;
}

export interface AgentRuntimeConfig {
  model: string;
  maxIterations: number;
  defaultTimeoutMs: number;
}

export interface FeatureToggleConfig {
  accessibility: boolean;
  responsive: boolean;
  brokenLinks: boolean;
}

export interface AppConfig {
  env: EnvironmentMode;
  appName: string;
  database: DatabaseConfig;
  playwrightMcp: PlaywrightMcpConfig;
  agentRuntime: AgentRuntimeConfig;
  featureToggles: FeatureToggleConfig;
}
