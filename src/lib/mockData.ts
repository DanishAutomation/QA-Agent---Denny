export interface DashboardMetric {
  label: string;
  value: string;
  trend: string;
}

export interface ExecutionRun {
  id: string;
  project: string;
  testType: string;
  browser: string;
  status: "Passed" | "Running" | "Failed";
  progress: number;
  startedAt: string;
  duration: string;
}

export const dashboardMetrics: DashboardMetric[] = [
  { label: "Total Executions", value: "186", trend: "+12% this week" },
  { label: "Pass Rate", value: "91.4%", trend: "+1.8% stability gain" },
  { label: "Critical Bugs", value: "9", trend: "-3 from last cycle" },
  { label: "Avg. Runtime", value: "07m 24s", trend: "-55s improvement" },
];

export const executionHistory: ExecutionRun[] = [
  {
    id: "RUN-2401",
    project: "Shopfront QA",
    testType: "Ecommerce Journey",
    browser: "Chrome",
    status: "Passed",
    progress: 100,
    startedAt: "Today, 10:41 AM",
    duration: "6m 20s",
  },
  {
    id: "RUN-2400",
    project: "Portal Login Suite",
    testType: "Login",
    browser: "Firefox",
    status: "Failed",
    progress: 100,
    startedAt: "Today, 09:13 AM",
    duration: "4m 44s",
  },
  {
    id: "RUN-2399",
    project: "Marketing Site Sweep",
    testType: "Broken Links",
    browser: "Edge",
    status: "Running",
    progress: 67,
    startedAt: "Today, 08:58 AM",
    duration: "Running",
  },
  {
    id: "RUN-2398",
    project: "Global Forms Check",
    testType: "Forms",
    browser: "Chrome",
    status: "Passed",
    progress: 100,
    startedAt: "Yesterday, 05:20 PM",
    duration: "9m 11s",
  },
  {
    id: "RUN-2397",
    project: "Accessibility Deep Scan",
    testType: "Accessibility",
    browser: "Firefox",
    status: "Failed",
    progress: 100,
    startedAt: "Yesterday, 03:06 PM",
    duration: "11m 33s",
  },
];

export const weeklyQualityTrend = [
  { day: "Mon", passRate: 86 },
  { day: "Tue", passRate: 88 },
  { day: "Wed", passRate: 84 },
  { day: "Thu", passRate: 90 },
  { day: "Fri", passRate: 92 },
  { day: "Sat", passRate: 91 },
];

export const browserStability = [
  { browser: "Chrome", score: 94 },
  { browser: "Firefox", score: 89 },
  { browser: "Edge", score: 91 },
];

export const executionProgressMock = {
  runId: "RUN-2399",
  suite: "Marketing Site Sweep",
  stage: "Accessibility + Responsive Checks",
  progress: 67,
  eta: "2m 18s",
  totalSteps: 12,
  completedSteps: 8,
};

export const resultSummaryMock = {
  runId: "RUN-2400",
  passCount: 34,
  failCount: 4,
  skippedCount: 2,
  confidence: 88,
};
