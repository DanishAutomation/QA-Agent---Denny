import { bugAnalysisAgent } from "./bugAnalysisAgent";
import { discoveryAgent } from "./discoveryAgent";
import { executionAgent } from "./executionAgent";
import { jiraAgent } from "./jiraAgent";
import { plannerAgent } from "./plannerAgent";
import { reportingAgent } from "./reportingAgent";
import { retryAssistantAgent } from "./retryAssistantAgent";
import { selfHealingAgent } from "./selfHealingAgent";
import { testDesignAgent } from "./testDesignAgent";
import type { AgentModule, AgentRegistration } from "@/types";

const registry: AgentModule[] = [
  plannerAgent,
  discoveryAgent,
  testDesignAgent,
  executionAgent,
  selfHealingAgent,
  bugAnalysisAgent,
  reportingAgent,
  jiraAgent,
  retryAssistantAgent,
];

export function getRegisteredAgents(): AgentRegistration[] {
  return registry.map((item) => item.registration);
}

export function getAgentById(agentId: string): AgentModule | undefined {
  return registry.find((agent) => agent.registration.id === agentId);
}

export { registry as agentRegistry };
