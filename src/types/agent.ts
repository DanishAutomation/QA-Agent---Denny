export type AgentStatus = "idle" | "running" | "completed" | "failed";

export interface AgentInput {
  objective: string;
  projectId: string;
  runId: string;
  context: Record<string, unknown>;
}

export interface AgentOutput {
  status: AgentStatus;
  summary: string;
  artifacts: Record<string, unknown>;
}

export interface AgentRegistration {
  id: string;
  name: string;
  description: string;
}

export interface AgentModule {
  readonly registration: AgentRegistration;
  run(input: AgentInput): Promise<AgentOutput>;
}
