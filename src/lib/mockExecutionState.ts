export type ExecutionPhase =
  | "Discovery"
  | "Crawling"
  | "Test Generation"
  | "Execution"
  | "Self-Healing"
  | "Post-Run Analysis"
  | "Reporting";

export type TestCaseStatus = "pending" | "running" | "passed" | "failed" | "skipped";

export interface TestCaseItem {
  id: string;
  title: string;
  status: TestCaseStatus;
}

export interface ExecutionStateSnapshot {
  runId: string;
  currentPhase: ExecutionPhase;
  totalGeneratedTestCases: number;
  currentExecutingTestCaseNumber: number;
  currentTestCaseTitle: string;
  currentUrl: string;
  browser: "Chrome" | "Firefox" | "Edge";
  device: "Desktop" | "Tablet" | "iPhone" | "Android";
  progressPercentage: number;
  passCount: number;
  failCount: number;
  skippedCount: number;
  liveLogs: string[];
  testCases: TestCaseItem[];
}

export const executionPhases: ExecutionPhase[] = [
  "Discovery",
  "Crawling",
  "Test Generation",
  "Execution",
  "Self-Healing",
  "Post-Run Analysis",
  "Reporting",
];

const baseTestCases: TestCaseItem[] = [
  { id: "TC-01", title: "Validate homepage loads", status: "pending" },
  { id: "TC-02", title: "Validate primary navigation", status: "pending" },
  { id: "TC-03", title: "Validate login flow", status: "pending" },
  { id: "TC-04", title: "Validate checkout journey", status: "pending" },
  { id: "TC-05", title: "Validate contact form", status: "pending" },
  { id: "TC-06", title: "Validate broken links in footer", status: "pending" },
];

export const executionStateSnapshots: ExecutionStateSnapshot[] = [
  {
    runId: "RUN-2501",
    currentPhase: "Discovery",
    totalGeneratedTestCases: 2,
    currentExecutingTestCaseNumber: 1,
    currentTestCaseTitle: "Discovering surface routes",
    currentUrl: "https://storefront.demo/",
    browser: "Chrome",
    device: "Desktop",
    progressPercentage: 8,
    passCount: 0,
    failCount: 0,
    skippedCount: 0,
    liveLogs: [
      "[10:21:02] Discovery started for root URL.",
      "[10:21:04] Found 14 unique page candidates.",
      "[10:21:07] Prioritizing auth, cart, and checkout paths.",
    ],
    testCases: baseTestCases,
  },
  {
    runId: "RUN-2501",
    currentPhase: "Crawling",
    totalGeneratedTestCases: 4,
    currentExecutingTestCaseNumber: 2,
    currentTestCaseTitle: "Crawling checkout and account routes",
    currentUrl: "https://storefront.demo/account/login",
    browser: "Chrome",
    device: "Desktop",
    progressPercentage: 21,
    passCount: 0,
    failCount: 0,
    skippedCount: 0,
    liveLogs: [
      "[10:21:17] Crawler entered account section.",
      "[10:21:21] Captured 9 interactive forms.",
      "[10:21:24] Link map enriched with footer and header navigation.",
    ],
    testCases: baseTestCases.map((item, index) =>
      index === 0 ? { ...item, status: "running" } : item
    ),
  },
  {
    runId: "RUN-2501",
    currentPhase: "Post-Run Analysis",
    totalGeneratedTestCases: 6,
    currentExecutingTestCaseNumber: 3,
    currentTestCaseTitle: "Risk analysis for login + checkout",
    currentUrl: "https://storefront.demo/checkout",
    browser: "Chrome",
    device: "Desktop",
    progressPercentage: 36,
    passCount: 1,
    failCount: 0,
    skippedCount: 0,
    liveLogs: [
      "[10:21:33] Analysis phase started.",
      "[10:21:36] Risk score high for checkout payment states.",
      "[10:21:39] Accessibility hotspots detected for error messaging.",
    ],
    testCases: baseTestCases.map((item, index) =>
      index === 0
        ? { ...item, status: "passed" }
        : index === 1
          ? { ...item, status: "running" }
          : item
    ),
  },
  {
    runId: "RUN-2501",
    currentPhase: "Test Generation",
    totalGeneratedTestCases: 10,
    currentExecutingTestCaseNumber: 4,
    currentTestCaseTitle: "Generating responsive + broken-link cases",
    currentUrl: "https://storefront.demo/cart",
    browser: "Chrome",
    device: "Desktop",
    progressPercentage: 51,
    passCount: 2,
    failCount: 0,
    skippedCount: 0,
    liveLogs: [
      "[10:21:49] Generated 4 additional dynamic cases.",
      "[10:21:52] Linked test data profiles to form journeys.",
      "[10:21:55] Queued first execution batch.",
    ],
    testCases: baseTestCases.map((item, index) =>
      index <= 1
        ? { ...item, status: "passed" }
        : index === 2
          ? { ...item, status: "running" }
          : item
    ),
  },
  {
    runId: "RUN-2501",
    currentPhase: "Execution",
    totalGeneratedTestCases: 12,
    currentExecutingTestCaseNumber: 6,
    currentTestCaseTitle: "Executing checkout payment flow",
    currentUrl: "https://storefront.demo/checkout/payment",
    browser: "Chrome",
    device: "Desktop",
    progressPercentage: 69,
    passCount: 4,
    failCount: 1,
    skippedCount: 0,
    liveLogs: [
      "[10:22:05] Execution batch #2 started.",
      "[10:22:09] TC-04 failed due to disabled payment CTA.",
      "[10:22:12] Triggering self-heal suggestions for locator drift.",
    ],
    testCases: baseTestCases.map((item, index) =>
      index <= 2
        ? { ...item, status: "passed" }
        : index === 3
          ? { ...item, status: "failed" }
          : index === 4
            ? { ...item, status: "running" }
            : item
    ),
  },
  {
    runId: "RUN-2501",
    currentPhase: "Self-Healing",
    totalGeneratedTestCases: 12,
    currentExecutingTestCaseNumber: 6,
    currentTestCaseTitle: "Healing failed checkout locator",
    currentUrl: "https://storefront.demo/checkout/payment",
    browser: "Chrome",
    device: "Desktop",
    progressPercentage: 82,
    passCount: 5,
    failCount: 1,
    skippedCount: 1,
    liveLogs: [
      "[10:22:21] Self-healing initiated for payment selectors.",
      "[10:22:24] Alternate locator candidate confidence: 0.82",
      "[10:22:28] Re-run scheduled for failed path.",
    ],
    testCases: baseTestCases.map((item, index) =>
      index <= 2
        ? { ...item, status: "passed" }
        : index === 3
          ? { ...item, status: "failed" }
          : index === 4
            ? { ...item, status: "passed" }
            : { ...item, status: "skipped" }
    ),
  },
  {
    runId: "RUN-2501",
    currentPhase: "Reporting",
    totalGeneratedTestCases: 12,
    currentExecutingTestCaseNumber: 6,
    currentTestCaseTitle: "Compiling final execution report",
    currentUrl: "https://storefront.demo/reports/run-2501",
    browser: "Chrome",
    device: "Desktop",
    progressPercentage: 100,
    passCount: 5,
    failCount: 1,
    skippedCount: 1,
    liveLogs: [
      "[10:22:38] Reporting phase started.",
      "[10:22:41] Summarized defects with impacted modules.",
      "[10:22:44] Execution run completed in mock mode.",
    ],
    testCases: baseTestCases.map((item, index) =>
      index <= 2
        ? { ...item, status: "passed" }
        : index === 3
          ? { ...item, status: "failed" }
          : index === 4
            ? { ...item, status: "passed" }
            : { ...item, status: "skipped" }
    ),
  },
];
