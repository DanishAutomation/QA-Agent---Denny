import { getAgentById } from "@/agents";
import type {
  AgentInput,
  QaPipelineStepResult,
  QaRunRecord,
  QaRunRequestPayload,
  QaRunStatus,
} from "@/types";

const ORCHESTRATION_ORDER = [
  "planner-agent",
  "discovery-agent",
  "test-design-agent",
  "execution-agent",
  "self-healing-agent",
  "bug-analysis-agent",
  "reporting-agent",
  "jira-agent",
  "retry-assistant-agent",
] as const;

export async function executeQaRunPipeline(
  request: QaRunRequestPayload,
  runId: string
): Promise<QaRunRecord> {
  const createdAt = new Date().toISOString();
  const steps: QaPipelineStepResult[] = [];
  let status: QaRunStatus = "running";

  for (const [index, agentId] of ORCHESTRATION_ORDER.entries()) {
    const agent = getAgentById(agentId);

    if (!agent) {
      const now = new Date().toISOString();
      steps.push({
        step: index + 1,
        agentId,
        agentName: "Unknown Agent",
        status: "failed",
        summary: `Agent "${agentId}" is not registered.`,
        startedAt: now,
        completedAt: now,
        durationMs: 0,
      });
      status = "failed";
      break;
    }

    const startedAt = new Date();
    const input: AgentInput = {
      objective: request.objective,
      projectId: request.projectId,
      runId,
      context: {
        intent: request.intent,
        featureKeys: request.featureKeys,
        targetBaseUrl: request.targetBaseUrl,
        metadata: request.metadata ?? {},
      },
    };

    const output = await agent.run(input);
    const completedAt = new Date();
    const stepStatus = output.status === "failed" ? "failed" : "completed";

    steps.push({
      step: index + 1,
      agentId,
      agentName: agent.registration.name,
      status: stepStatus,
      summary: output.summary,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
    });

    if (stepStatus === "failed") {
      status = "failed";
      break;
    }
  }

  if (status !== "failed") {
    status = "completed";
  }

  const updatedAt = new Date().toISOString();

  return {
    runId,
    status,
    createdAt,
    updatedAt,
    completedAt: status === "completed" ? updatedAt : null,
    request,
    steps,
  };
}
