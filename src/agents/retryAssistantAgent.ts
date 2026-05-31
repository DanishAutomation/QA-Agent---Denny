import { createStaticAgent } from "./createStaticAgent";

export const retryAssistantAgent = createStaticAgent({
  id: "retry-assistant-agent",
  name: "Retry Assistant Agent",
  description: "Decides whether retries should run and under which constraints.",
});
