import type {
  BddScenario,
  DiscoveryCapabilities,
  DiscoveryResult,
  DynamicGenerationInput,
  DynamicGenerationOutput,
  ParsedInstructionData,
  ScenarioExecutionStatus,
  ScenarioPriority,
  ScenarioRiskLevel,
} from "@/types";
import { shouldGenerateEcommerceSuite } from "@/server/discovery/websiteClassification";
import {
  buildCapabilityContext,
  filterScenariosForTestTypeAndCapabilities,
  shouldUseEcommerceScenarioGeneration,
  shouldUseStaticScenarioGeneration,
  validateMemoryAgainstDiscovery,
} from "@/server/execution/scenarioCapabilityGate";
import { inferSiteSpecificCapabilities } from "@/server/execution/executionCapabilityResolver";

type CapabilityMap = Partial<DiscoveryCapabilities> & Record<string, boolean | undefined>;

function hasCapability(
  key: keyof DiscoveryCapabilities,
  discoveryCaps: DiscoveryCapabilities,
  overrides?: CapabilityMap
): boolean {
  if (overrides && typeof overrides[key] === "boolean") {
    return Boolean(overrides[key]);
  }
  return Boolean(discoveryCaps[key]);
}

function hasSiteSpecificCapability(
  key: string,
  fallback: boolean,
  overrides?: CapabilityMap
): boolean {
  if (overrides && typeof overrides[key] === "boolean") {
    return Boolean(overrides[key]);
  }
  return fallback;
}

function hasCustomCapability(
  key: string,
  fallback: boolean,
  overrides?: CapabilityMap
): boolean {
  return hasSiteSpecificCapability(key, fallback, overrides);
}

function usesAuthenticatedRegressionSession(instructions: ParsedInstructionData): boolean {
  return Boolean(instructions.login?.email?.trim() && instructions.login?.password?.trim());
}

function createScenario(params: {
  feature: string;
  scenario: string;
  priority: ScenarioPriority;
  riskLevel: ScenarioRiskLevel;
  given: string[];
  when: string[];
  then: string[];
  requiredTestData?: string[];
  expectedResult: string;
  executable: boolean;
  skipReason?: string;
}): BddScenario {
  const executionStatus: ScenarioExecutionStatus = params.executable
    ? "executable"
    : "skipped";

  return {
    feature: params.feature,
    scenario: params.scenario,
    priority: params.priority,
    riskLevel: params.riskLevel,
    given: params.given,
    when: params.when,
    then: params.then,
    requiredTestData: params.requiredTestData ?? [],
    skipConditions: params.executable
      ? []
      : [params.skipReason ?? "Capability unavailable on target website."],
    expectedResult: params.expectedResult,
    executionStatus,
    skipReason: params.executable ? undefined : params.skipReason,
  };
}

function filterByTestType(scenarios: BddScenario[], selectedTestType: string): BddScenario[] {
  const normalized = selectedTestType.toLowerCase();
  const priorityOrder: Record<ScenarioPriority, number> = {
    High: 0,
    Medium: 1,
    Low: 2,
  };
  const riskOrder: Record<ScenarioRiskLevel, number> = {
    Critical: 0,
    High: 1,
    Medium: 2,
    Low: 3,
  };
  const sortedByRisk = [...scenarios].sort((a, b) => {
    const aCustom = a.feature === "Custom Command" ? 0 : 1;
    const bCustom = b.feature === "Custom Command" ? 0 : 1;
    if (aCustom !== bCustom) {
      return aCustom - bCustom;
    }
    const byPriority = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (byPriority !== 0) {
      return byPriority;
    }
    return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
  });

  if (normalized.includes("smoke")) {
    return sortedByRisk.filter((item) => item.priority === "High").slice(0, 6);
  }
  if (normalized.includes("login")) {
    return sortedByRisk.filter(
      (item) => /auth|login|signup|forgot password|custom command/i.test(item.feature)
    );
  }
  if (normalized.includes("ecommerce")) {
    return sortedByRisk.filter((item) =>
      /catalog|pdp|cart|checkout|authentication|account|custom command/i.test(item.feature)
    );
  }
  if (normalized.includes("forms")) {
    return sortedByRisk.filter((item) =>
      /contact form|newsletter form|quote|signup|login|custom command/i.test(item.feature)
    );
  }
  if (normalized.includes("broken links")) {
    return sortedByRisk.filter((item) => /broken link|navigation|custom command/i.test(item.feature));
  }
  if (normalized.includes("responsive")) {
    return sortedByRisk.filter((item) => /responsive|navigation|catalog|checkout|custom command/i.test(item.feature));
  }
  if (normalized.includes("accessibility")) {
    return sortedByRisk.filter((item) => /accessibility|navigation|form|custom command/i.test(item.feature));
  }
  if (normalized.includes("static")) {
    return sortedByRisk.filter((item) => /static|navigation|broken link|newsletter|contact|custom command/i.test(item.feature));
  }
  if (normalized.includes("full regression")) {
    return sortedByRisk;
  }
  return sortedByRisk;
}

function commandAwareStep(commands: string[]): string {
  if (commands.length === 0) {
    return "custom instruction directives are optional for this scenario";
  }
  return `custom directives include: ${commands.slice(0, 2).join(" | ")}`;
}

interface CommandDirectives {
  skipSignup: boolean;
  onlyLogin: boolean;
}

function parseCommandDirectives(instructions: ParsedInstructionData): CommandDirectives {
  const fullText = [
    instructions.rawText,
    ...instructions.naturalLanguageCommands,
    ...instructions.bulletPoints,
  ]
    .join(" ")
    .toLowerCase();
  return {
    skipSignup: /skip\s+signup|no\s+signup|dont\s+signup|don't\s+signup/.test(fullText),
    onlyLogin: /only\s+do\s+login|only\s+login|login\s+only/.test(fullText),
  };
}

function applyDirectivesToScenarios(
  scenarios: BddScenario[],
  directives: CommandDirectives
): BddScenario[] {
  return scenarios.map((scenario) => {
    const text = `${scenario.feature} ${scenario.scenario}`.toLowerCase();
    if (directives.skipSignup && /signup|register/.test(text)) {
      return {
        ...scenario,
        executionStatus: "skipped",
        skipReason: "Skipped because custom instruction requested to skip signup.",
        skipConditions: ["Skipped because custom instruction requested to skip signup."],
      };
    }
    if (directives.onlyLogin) {
      const allowed = /login|authentication|custom command.*login|search/.test(text);
      if (!allowed) {
        return {
          ...scenario,
          executionStatus: "skipped",
          skipReason: "Skipped because custom instruction requested login-focused flow only.",
          skipConditions: ["Skipped because custom instruction requested login-focused flow only."],
        };
      }
    }
    return scenario;
  });
}

function generateEcommerceScenarios(
  caps: DiscoveryCapabilities,
  instructions: ParsedInstructionData,
  overrides?: CapabilityMap
): BddScenario[] {
  const commandsHint = commandAwareStep(instructions.naturalLanguageCommands);
  const directives = parseCommandDirectives(instructions);
  const scenarios: BddScenario[] = [];

  const effectiveCaps: DiscoveryCapabilities = {
    ...caps,
    productListing:
      caps.productListing || caps.productDetail || caps.categories || caps.search,
    categories: caps.categories || caps.productListing || caps.productDetail,
    search: caps.search || caps.productListing || caps.productDetail,
    productDetail: caps.productDetail || caps.productListing || caps.addToCart,
    addToCart: caps.addToCart || (caps.productDetail && caps.cart) || caps.productListing,
  };

  const authCases = [
    { name: "Login", capability: hasCapability("login", caps, overrides), data: ["login.email", "login.password"] },
    { name: "Signup", capability: hasCapability("signup", caps, overrides) && !usesAuthenticatedRegressionSession(instructions), data: ["signup.name", "signup.email", "signup.password", "signup.phone"] },
    { name: "Forgot Password", capability: hasCustomCapability("forgotPassword", hasCapability("login", caps, overrides), overrides), data: ["login.email"] },
    {
      name: "Guest Checkout",
      capability:
        hasCustomCapability("guestCheckout", hasCapability("checkout", caps, overrides), overrides) &&
        !usesAuthenticatedRegressionSession(instructions),
      data: [],
    },
  ];

  for (const test of authCases) {
    const baseExecutable = test.capability;
    const executable =
      test.name === "Signup" && directives.skipSignup ? false : baseExecutable;
    const guestSkippedForLogin =
      test.name === "Guest Checkout" && usesAuthenticatedRegressionSession(instructions);
    const signupSkippedForLogin =
      test.name === "Signup" && usesAuthenticatedRegressionSession(instructions);
    scenarios.push(
      createScenario({
        feature: "Authentication",
        scenario: `${test.name} flow works as expected`,
        priority: "High",
        riskLevel: "High",
        given: ["user is on the authentication entry point", commandsHint],
        when: [`user attempts ${test.name.toLowerCase()} flow`],
        then: ["authentication response is valid and stable"],
        requiredTestData: test.data,
        expectedResult: `${test.name} path should complete without blocker issues.`,
        executable,
        skipReason:
          guestSkippedForLogin
            ? "Skipped because regression uses login credentials — guest checkout does not apply to authenticated sessions."
            : signupSkippedForLogin
              ? "Skipped because regression uses login credentials — signup is not required for this run."
            : test.name === "Signup" && directives.skipSignup
              ? "Skipped because custom instruction requested to skip signup."
              : "Skipped because this feature was not detected on the website.",
      })
    );
  }

  const catalogCases = [
    {
      name: "Product Listing",
      capability:
        hasCapability("productListing", effectiveCaps, overrides) ||
        hasCapability("productDetail", effectiveCaps, overrides),
    },
    { name: "Search", capability: hasCapability("search", effectiveCaps, overrides) },
    { name: "Categories", capability: hasCapability("categories", effectiveCaps, overrides) },
    {
      name: "Filters",
      capability: hasCustomCapability("filters", false, overrides),
    },
    {
      name: "Sorting",
      capability: hasCustomCapability("sorting", false, overrides),
    },
    {
      name: "Pagination",
      capability: hasCustomCapability("pagination", false, overrides),
    },
  ];

  for (const test of catalogCases) {
    scenarios.push(
      createScenario({
        feature: "Catalog",
        scenario: `${test.name} behavior is correct`,
        priority: "Medium",
        riskLevel: "Medium",
        given: ["catalog area is accessible"],
        when: [`user performs ${test.name.toLowerCase()} interactions`],
        then: ["listing updates and remains consistent"],
        expectedResult: `${test.name} should provide expected catalog controls.`,
        executable: test.capability,
        skipReason: "Skipped because this feature was not detected on the website.",
      })
    );
  }

  const pdpCases = [
    { name: "Product image", capabilityKey: "pdpImage", fallback: "productDetail" as const },
    { name: "Child SKU selection", capabilityKey: "pdpChildSkus", fallback: false as const },
    { name: "Variants", capabilityKey: "pdpVariants", fallback: false as const },
    { name: "Size", capabilityKey: "pdpSize", fallback: false as const },
    { name: "Color", capabilityKey: "pdpColor", fallback: false as const },
    { name: "Quantity", capabilityKey: "pdpQuantity", fallback: "productDetail" as const },
    { name: "Add to cart", capabilityKey: "addToCart", fallback: "addToCart" as const },
    { name: "Inventory", capabilityKey: "pdpInventory", fallback: "productDetail" as const },
  ] as const;

  for (const test of pdpCases) {
    const fallback =
      test.fallback === "addToCart"
        ? hasCapability("addToCart", effectiveCaps, overrides)
        : test.fallback === "productDetail"
          ? hasCapability("productDetail", effectiveCaps, overrides)
          : false;
    const executable =
      test.capabilityKey === "addToCart"
        ? hasCapability("addToCart", effectiveCaps, overrides)
        : hasCustomCapability(test.capabilityKey, fallback, overrides);
    scenarios.push(
      createScenario({
        feature: "PDP",
        scenario: `${test.name} behavior on product detail page`,
        priority: "Medium",
        riskLevel: "High",
        given: ["a product detail page is loaded"],
        when: [`user validates ${test.name.toLowerCase()} interactions`],
        then: ["product detail behavior should be reliable"],
        expectedResult: `${test.name} behavior is functional and consistent.`,
        executable,
        skipReason: "Skipped because this feature was not detected on the website.",
      })
    );
  }

  const cartCases = [
    { name: "Add item", capability: hasCapability("addToCart", effectiveCaps, overrides) },
    { name: "Update quantity", capability: hasCapability("cart", effectiveCaps, overrides) },
    { name: "Remove item", capability: hasCapability("cart", effectiveCaps, overrides) },
    {
      name: "Coupon if available",
      capability: hasCustomCapability("coupon", hasCapability("cart", effectiveCaps, overrides), overrides),
    },
  ];

  for (const test of cartCases) {
    scenarios.push(
      createScenario({
        feature: "Cart",
        scenario: `${test.name} works from cart workflow`,
        priority: "High",
        riskLevel: "High",
        given: ["cart context exists with at least one item"],
        when: [`user validates ${test.name.toLowerCase()} behavior`],
        then: ["cart state and totals remain correct"],
        expectedResult: `${test.name} should apply expected cart behavior.`,
        executable: test.capability,
        skipReason: "Skipped because this feature was not detected on the website.",
      })
    );
  }

  const checkoutCases = [
    { name: "Address", data: ["address.name", "address.street", "address.city", "address.country"] },
    { name: "Shipping", data: [] },
    { name: "Billing", data: ["address.name", "address.street", "address.city", "address.country"] },
    { name: "Payment", data: ["payment.cardNumber", "payment.expiry", "payment.cvv", "payment.cardholderName"] },
    { name: "Review", data: [] },
  ];

  for (const test of checkoutCases) {
    scenarios.push(
      createScenario({
        feature: "Checkout",
        scenario: `${test.name} step validates correctly`,
        priority: "High",
        riskLevel: "Critical",
        given: ["checkout has been initiated"],
        when: [`user proceeds through ${test.name.toLowerCase()} step`],
        then: ["checkout state transitions without blockers"],
        requiredTestData: test.data,
        expectedResult: `${test.name} step should complete with valid state.`,
        executable: hasCapability("checkout", effectiveCaps, overrides),
        skipReason: "Skipped because this feature was not detected on the website.",
      })
    );
  }

  const accountCases = [
    { name: "Profile", capability: hasCustomCapability("accountProfile", hasCapability("login", caps, overrides), overrides) },
    { name: "Orders", capability: hasCustomCapability("accountOrders", hasCapability("login", caps, overrides), overrides) },
    { name: "Wishlist", capability: hasCustomCapability("accountWishlist", hasCustomCapability("wishlist", false, overrides), overrides) },
  ];

  for (const test of accountCases) {
    scenarios.push(
      createScenario({
        feature: "Account",
        scenario: `${test.name} section behaves as expected`,
        priority: "Medium",
        riskLevel: "Medium",
        given: ["authenticated account context exists"],
        when: [`user opens ${test.name.toLowerCase()} area`],
        then: ["account section loads and remains stable"],
        expectedResult: `${test.name} section should support core account actions.`,
        executable: test.capability,
        skipReason: "Skipped because this feature was not detected on the website.",
      })
    );
  }

  return applyDirectivesToScenarios(scenarios, directives);
}

function generateStaticWebsiteScenarios(
  discovery: DiscoveryResult,
  caps: DiscoveryCapabilities,
  instructions: ParsedInstructionData,
  overrides?: CapabilityMap
): BddScenario[] {
  const commandsHint = commandAwareStep(instructions.naturalLanguageCommands);
  const hasForms =
    caps.contactForm ||
    caps.newsletterForm ||
    caps.quoteForm ||
    discovery.formsFound.length > 0;

  const cases: Array<{
    feature: string;
    scenario: string;
    capability: boolean;
    priority: ScenarioPriority;
    riskLevel: ScenarioRiskLevel;
    requiredData?: string[];
    skipReason: string;
  }> = [
    {
      feature: "Navigation",
      scenario: "Primary navigation routes resolve correctly",
      capability: true,
      priority: "High",
      riskLevel: "Medium",
      skipReason: "Navigation test unavailable.",
    },
    {
      feature: "Static Pages",
      scenario: "Static informational pages load and render expected sections",
      capability: caps.staticPages || discovery.pagesFound.length > 1,
      priority: "High",
      riskLevel: "Medium",
      skipReason: "No static/informational pages detected.",
    },
    {
      feature: "Blog",
      scenario: "Blog or news pages load with readable content structure",
      capability: caps.blogPages,
      priority: "Medium",
      riskLevel: "Medium",
      skipReason: "No blog/news section detected.",
    },
    {
      feature: "Contact Form",
      scenario: "Contact form can be submitted with valid data",
      capability: hasCapability("contactForm", caps, overrides),
      priority: "High",
      riskLevel: "High",
      requiredData: ["address.name", "address.phone"],
      skipReason: "Contact form capability not detected.",
    },
    {
      feature: "Newsletter Form",
      scenario: "Newsletter subscription accepts valid email",
      capability: hasCapability("newsletterForm", caps, overrides),
      priority: "Medium",
      riskLevel: "Medium",
      requiredData: ["signup.email"],
      skipReason: "Newsletter form not detected.",
    },
    {
      feature: "Quote Form",
      scenario: "Quote or lead form accepts valid business inquiry data",
      capability: hasCapability("quoteForm", caps, overrides),
      priority: "High",
      riskLevel: "High",
      skipReason: "Quote/lead form not detected.",
    },
    {
      feature: "Forms",
      scenario: "Discovered forms validate required fields safely",
      capability: hasForms,
      priority: "High",
      riskLevel: "High",
      skipReason: "No forms discovered on static website.",
    },
    {
      feature: "Broken Link",
      scenario: "Site links return healthy HTTP responses",
      capability: hasCapability("brokenLinks", caps, overrides) || discovery.linksFound.length > 0,
      priority: "High",
      riskLevel: "High",
      skipReason: "No navigable links discovered to validate during execution.",
    },
    {
      feature: "Responsive",
      scenario: "Responsive layout remains stable across breakpoints",
      capability: true,
      priority: "High",
      riskLevel: "High",
      skipReason: "Responsive check unavailable.",
    },
    {
      feature: "Accessibility",
      scenario: "Accessibility risk checks run on key templates",
      capability: true,
      priority: "High",
      riskLevel: "High",
      skipReason: "Accessibility check unavailable.",
    },
  ];

  return cases.map((item) =>
    createScenario({
      feature: item.feature,
      scenario: item.scenario,
      priority: item.priority,
      riskLevel: item.riskLevel,
      given: [
        "website classified as static/corporate during discovery",
        commandsHint,
        ...(discovery.classificationNotes?.slice(0, 1) ?? []),
      ],
      when: ["the scenario is executed against discovered pages"],
      then: ["expected behavior is validated with clear outcomes"],
      requiredTestData: item.requiredData ?? [],
      expectedResult: `${item.feature} checks should finish with deterministic outcomes.`,
      executable: item.capability,
      skipReason: item.capability
        ? undefined
        : "Skipped because this feature was not detected on the website.",
    })
  );
}

function generateNonEcommerceScenarios(
  discovery: DiscoveryResult,
  caps: DiscoveryCapabilities,
  instructions: ParsedInstructionData,
  overrides?: CapabilityMap
): BddScenario[] {
  return generateStaticWebsiteScenarios(discovery, caps, instructions, overrides);
}

const CUSTOM_COMMAND_SCENARIO_LIMIT = 30;

function getOrderedCustomCommandLines(instructions: ParsedInstructionData): string[] {
  const source =
    instructions.bulletPoints.length > 0
      ? instructions.bulletPoints
      : instructions.naturalLanguageCommands;
  const ordered = source
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line, index, arr) => {
      const normalized = line.toLowerCase();
      return arr.findIndex((item) => item.toLowerCase() === normalized) === index;
    });

  const paymentSubLines = instructions.naturalLanguageCommands.filter(
    (line) =>
      /^(card no|card number|expiry|cvv|cvc)\b/i.test(line.trim()) &&
      !ordered.some((item) => item.toLowerCase() === line.trim().toLowerCase())
  );
  if (paymentSubLines.length === 0) {
    return ordered;
  }

  const cardDetailsIndex = ordered.findIndex((line) => /enter card detail/i.test(line));
  if (cardDetailsIndex >= 0) {
    return [
      ...ordered.slice(0, cardDetailsIndex + 1),
      ...paymentSubLines,
      ...ordered.slice(cardDetailsIndex + 1),
    ];
  }

  return [...ordered, ...paymentSubLines];
}

function generateCustomCommandScenarios(
  instructions: ParsedInstructionData
): BddScenario[] {
  const dedupedLines = getOrderedCustomCommandLines(instructions);
  const commandLines = dedupedLines.slice(0, CUSTOM_COMMAND_SCENARIO_LIMIT);

  if (commandLines.length === 0) {
    return [
      createScenario({
        feature: "Custom Command",
        scenario: "No custom command detected in instruction box",
        priority: "High",
        riskLevel: "Medium",
        given: ["custom command automation selected"],
        when: ["instruction parser inspects command text"],
        then: ["no executable custom command is identified"],
        expectedResult: "Custom command scenario is skipped with clear reason.",
        executable: false,
        skipReason: "No natural language/bullet command found in custom instructions.",
      }),
    ];
  }

  return commandLines.map((line, index) => {
    const capabilityOk = true;
    return createScenario({
      feature: "Custom Command",
      scenario: `Execute command ${index + 1}: ${line}`,
      priority: "High",
      riskLevel: "High",
      given: ["website is reachable", "custom command provided by user"],
      when: [line],
      then: ["agent executes mapped Playwright action safely"],
      requiredTestData: [],
      expectedResult: "Custom command should be transformed into executable automation intent.",
      executable: capabilityOk,
      skipReason: capabilityOk
        ? undefined
        : "Skipped because this feature was not detected on the website.",
    });
  });
}

export function generateDynamicTestScenarios(
  input: DynamicGenerationInput
): DynamicGenerationOutput {
  const discovery = input.discoveryResult;
  const caps = discovery.capabilities;
  const selectedType = input.selectedTestType.toLowerCase();
  if (selectedType.includes("custom command")) {
    const scenarios = generateCustomCommandScenarios(input.parsedInstructions);
    const executableScenarios = scenarios.filter(
      (item) => item.executionStatus === "executable"
    ).length;
    return {
      generatedAt: new Date().toISOString(),
      selectedTestType: input.selectedTestType,
      websiteType: input.discoveryResult.websiteType,
      totalScenarios: scenarios.length,
      executableScenarios,
      skippedScenarios: scenarios.length - executableScenarios,
      scenarios,
    };
  }
  const siteSpecificCaps = inferSiteSpecificCapabilities(discovery, input.capabilityMap);
  const mergedCapabilityMap = { ...siteSpecificCaps, ...input.capabilityMap };
  const capabilityContextWithSiteCaps = buildCapabilityContext(discovery, mergedCapabilityMap);
  const memoryCaps =
    validateMemoryAgainstDiscovery(input.capabilityMap, capabilityContextWithSiteCaps) ?? {};
  const effectiveCapabilityMap = { ...memoryCaps, ...siteSpecificCaps };
  const executionCaps = capabilityContextWithSiteCaps.executionCapabilities;

  const scenarioSets: BddScenario[] = [];

  if (shouldUseStaticScenarioGeneration(capabilityContextWithSiteCaps)) {
    scenarioSets.push(
      ...generateNonEcommerceScenarios(
        discovery,
        caps,
        input.parsedInstructions,
        effectiveCapabilityMap
      )
    );
  }

  if (
    shouldUseEcommerceScenarioGeneration(capabilityContextWithSiteCaps) &&
    shouldGenerateEcommerceSuite({
      websiteType: discovery.websiteType,
      capabilities: caps,
      siteSuite: discovery.siteSuite,
    })
  ) {
    scenarioSets.push(
      ...generateEcommerceScenarios(executionCaps, input.parsedInstructions, effectiveCapabilityMap)
    );
  }

  const hasCustomInstructions =
    input.parsedInstructions.bulletPoints.length > 0 ||
    input.parsedInstructions.naturalLanguageCommands.length > 0;
  const supplementalCustomScenarios =
    hasCustomInstructions && capabilityContextWithSiteCaps.siteSuite !== "static"
      ? generateCustomCommandScenarios(input.parsedInstructions)
          .filter((item) => item.executionStatus === "executable")
          .slice(0, 2)
      : [];

  const allScenarios = [...scenarioSets, ...supplementalCustomScenarios];
  const scenarios = filterScenariosForTestTypeAndCapabilities(
    allScenarios,
    input.selectedTestType,
    capabilityContextWithSiteCaps,
    effectiveCapabilityMap
  );
  const executableScenarios = scenarios.filter(
    (item) => item.executionStatus === "executable"
  ).length;
  const skippedScenarios = scenarios.length - executableScenarios;

  return {
    generatedAt: new Date().toISOString(),
    selectedTestType: input.selectedTestType,
    websiteType: input.discoveryResult.websiteType,
    totalScenarios: scenarios.length,
    executableScenarios,
    skippedScenarios,
    scenarios,
  };
}
