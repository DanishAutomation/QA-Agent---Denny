import { appConfig } from "@/core/configManager";
import { agentRegistry } from "@/agents";
export * from "./orchestration";
export * from "./contracts";

export interface ServiceHealth {
  service: string;
  status: "ok" | "degraded";
}

export function getSystemHealth(): ServiceHealth[] {
  return [
    { service: "api", status: "ok" },
    { service: "database", status: "ok" },
    { service: "playwright-mcp", status: "ok" },
  ];
}

export function getServerSummary() {
  return {
    appName: appConfig.appName,
    environment: appConfig.env,
    registeredAgents: agentRegistry.length,
  };
}
