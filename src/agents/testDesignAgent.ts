import { createStaticAgent } from "./createStaticAgent";

export const testDesignAgent = createStaticAgent({
  id: "test-design-agent",
  name: "Test Design Agent",
  description: "Converts QA plans into reusable, model-generated test designs.",
});
