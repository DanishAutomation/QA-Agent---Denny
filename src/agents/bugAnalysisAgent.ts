import { createStaticAgent } from "./createStaticAgent";

export const bugAnalysisAgent = createStaticAgent({
  id: "bug-analysis-agent",
  name: "Bug Analysis Agent",
  description: "Analyzes failures and converts evidence into bug intelligence.",
});
