import type { AgentInput, AgentModule, AgentOutput, AgentRegistration } from "@/types";

export function createStaticAgent(registration: AgentRegistration): AgentModule {
  return {
    registration,
    async run(input: AgentInput): Promise<AgentOutput> {
      return {
        status: "completed",
        summary: `${registration.name} accepted objective "${input.objective}" (scaffold mode).`,
        artifacts: {
          module: registration.id,
          projectId: input.projectId,
          runId: input.runId,
        },
      };
    },
  };
}
