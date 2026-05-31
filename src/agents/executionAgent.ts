import { createStaticAgent } from "./createStaticAgent";

export const executionAgent = createStaticAgent({
  id: "execution-agent",
  name: "Execution Agent",
  description: "Coordinates runtime execution through Playwright MCP connectors.",
});
