import { createStaticAgent } from "./createStaticAgent";

export const reportingAgent = createStaticAgent({
  id: "reporting-agent",
  name: "Reporting Agent",
  description: "Produces QA narratives and trend-ready reporting artifacts.",
});
