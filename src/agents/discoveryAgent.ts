import { createStaticAgent } from "./createStaticAgent";

export const discoveryAgent = createStaticAgent({
  id: "discovery-agent",
  name: "Discovery Agent",
  description: "Maps user journeys, states, and QA-relevant product surfaces.",
});
