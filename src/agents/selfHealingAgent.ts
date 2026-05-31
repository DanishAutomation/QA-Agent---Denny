import { createStaticAgent } from "./createStaticAgent";

export const selfHealingAgent = createStaticAgent({
  id: "self-healing-agent",
  name: "Self-Healing Agent",
  description: "Proposes resilient fallback strategies for brittle interactions.",
});
