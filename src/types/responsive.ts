export type ResponsiveViewportName =
  | "Android viewport"
  | "iPhone viewport"
  | "iPad viewport"
  | "Tablet viewport"
  | "Desktop viewport";

export interface ResponsiveViewportConfig {
  name: ResponsiveViewportName;
  width: number;
  height: number;
  userAgent: string;
}

export interface ResponsiveViewportFinding {
  viewport: ResponsiveViewportName;
  layoutBreakage: boolean;
  hiddenCtas: boolean;
  horizontalScroll: boolean;
  menuUsabilityIssue: boolean;
  formVisibilityIssue: boolean;
  overlappingElements: boolean;
  cartOrSearchVisibilityIssue: boolean;
  screenshotPath: string;
  notes: string[];
}

export interface ResponsiveTestReport {
  baseUrl: string;
  generatedAt: string;
  findings: ResponsiveViewportFinding[];
  summary: {
    totalViewports: number;
    issueCount: number;
    issueViewports: number;
  };
}
