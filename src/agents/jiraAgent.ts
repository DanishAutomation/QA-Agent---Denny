import { createStaticAgent } from "./createStaticAgent";

export const jiraAgent = createStaticAgent({
  id: "jira-agent",
  name: "Jira Agent",
  description: "Synchronizes actionable defects and QA tasks to Jira workflows.",
});
