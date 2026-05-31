import { createStaticAgent } from "./createStaticAgent";

export const plannerAgent = createStaticAgent({
  id: "planner-agent",
  name: "Planner Agent",
  description: "Builds strategic QA plans from product intent and risk signals.",
});
