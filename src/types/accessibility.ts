export interface AccessibilityRiskItem {
  id: string;
  category:
    | "cookie-consent"
    | "missing-alt-text"
    | "missing-form-labels"
    | "keyboard-navigation"
    | "focus-visibility"
    | "contrast-warning"
    | "heading-structure";
  severity: "high" | "medium" | "low";
  message: string;
  pageUrl: string;
}

export interface AccessibilityRiskReport {
  baseUrl: string;
  checkedAt: string;
  findings: AccessibilityRiskItem[];
  summary: {
    totalFindings: number;
    high: number;
    medium: number;
    low: number;
  };
  disclaimer: string;
}
