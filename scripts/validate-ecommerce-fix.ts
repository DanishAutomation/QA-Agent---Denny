import fs from "node:fs";
import path from "node:path";
import type { DiscoveryResult } from "../src/types";
import { buildCapabilityContext, filterScenarioQueue } from "../src/server/execution/scenarioCapabilityGate";
import {
  buildCapabilityMapFromMemory,
  resolveExecutionCapabilities,
} from "../src/server/execution/executionCapabilityResolver";
import { readExecutionMemory } from "../src/server/execution/executionMemoryStore";
import { generateDynamicTestScenarios } from "../src/server/test-generation/dynamicTestGenerationEngine";

const discoveryPath = path.join(
  process.cwd(),
  "src/reports/discovery-cache/discovery-9b0d7c79.json"
);
const cache = JSON.parse(fs.readFileSync(discoveryPath, "utf-8")) as {
  result: DiscoveryResult;
};
const discovery = cache.result;
const memory = readExecutionMemory("uat2.purelifedental.com");
const capabilityMap = buildCapabilityMapFromMemory(memory);

const executionCaps = resolveExecutionCapabilities(discovery, capabilityMap, true);
const context = buildCapabilityContext(discovery, capabilityMap);

const generated = generateDynamicTestScenarios({
  discoveryResult: discovery,
  selectedTestType: "Full Regression",
  parsedInstructions: {
    rawText: "",
    bulletPoints: [],
    naturalLanguageCommands: [],
    login: {},
    signup: {},
    address: {},
    payment: {},
    selectors: { cssSelectors: [], xpaths: [], playwrightLocators: [] },
  },
  capabilityMap,
});

const queue = filterScenarioQueue({
  scenarios: generated.scenarios,
  context,
  maxCount: 30,
  selectedTestType: "Full Regression",
  memoryCaps: capabilityMap,
});

const features = (items: typeof queue) =>
  [...new Set(items.map((item) => item.feature))].sort();

console.log("Execution capabilities:", {
  productListing: executionCaps.productListing,
  productDetail: executionCaps.productDetail,
  search: executionCaps.search,
  categories: executionCaps.categories,
  addToCart: executionCaps.addToCart,
  cart: executionCaps.cart,
});

console.log("Generated executable:", generated.executableScenarios, "/", generated.totalScenarios);
console.log("Queue size:", queue.length);
console.log("Queue features:", features(queue));
console.log(
  "Catalog scenarios:",
  queue.filter((item) => item.feature === "Catalog").map((item) => item.scenario)
);
console.log(
  "Cart scenarios:",
  queue.filter((item) => item.feature === "Cart").map((item) => item.scenario)
);

const missingCatalog = queue.some((item) => item.feature === "Catalog");
const missingCart = queue.some((item) => item.feature === "Cart");
const missingPdp = queue.some((item) => item.feature === "PDP");

if (!executionCaps.productListing || !missingCatalog || !missingCart || !missingPdp) {
  process.exitCode = 1;
  console.error("VALIDATION FAILED", {
    productListing: executionCaps.productListing,
    missingCatalog,
    missingCart,
    missingPdp,
  });
} else {
  console.log("VALIDATION PASSED: catalog/pdp/cart present in queue");
}
