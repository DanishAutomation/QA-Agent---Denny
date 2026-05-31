export type ScreenshotVerdict = "pass" | "fail" | "info";

export function verdictLabel(verdict: ScreenshotVerdict): string {
  if (verdict === "pass") return "PASS";
  if (verdict === "fail") return "FAIL";
  return "INFO";
}

export function verdictBorderClass(verdict: ScreenshotVerdict): string {
  if (verdict === "pass") {
    return "border-emerald-500 ring-2 ring-emerald-500/30";
  }
  if (verdict === "fail") {
    return "border-rose-500 ring-2 ring-rose-500/40";
  }
  return "border-slate-300 ring-1 ring-slate-200/80 dark:border-slate-600";
}

export function verdictBannerClass(verdict: ScreenshotVerdict): string {
  if (verdict === "pass") {
    return "bg-emerald-600 text-white";
  }
  if (verdict === "fail") {
    return "bg-rose-600 text-white";
  }
  return "bg-slate-600 text-white";
}

export function verdictBadgeVariant(
  verdict: ScreenshotVerdict
): "success" | "danger" | "outline" {
  if (verdict === "pass") return "success";
  if (verdict === "fail") return "danger";
  return "outline";
}

export function responsiveIssueFlags(finding: {
  layoutBreakage: boolean;
  hiddenCtas: boolean;
  horizontalScroll: boolean;
  menuUsabilityIssue: boolean;
  formVisibilityIssue: boolean;
  overlappingElements: boolean;
  cartOrSearchVisibilityIssue: boolean;
}): string[] {
  const flags: string[] = [];
  if (finding.layoutBreakage) flags.push("Layout breakage");
  if (finding.hiddenCtas) flags.push("Hidden CTAs");
  if (finding.horizontalScroll) flags.push("Horizontal scroll");
  if (finding.menuUsabilityIssue) flags.push("Menu usability");
  if (finding.formVisibilityIssue) flags.push("Form visibility");
  if (finding.overlappingElements) flags.push("Overlapping elements");
  if (finding.cartOrSearchVisibilityIssue) flags.push("Cart/search hidden");
  return flags;
}

export function formIssueFlags(result: {
  requiredFieldsOk: boolean;
  invalidEmailValidationOk: boolean;
  validationMessageDetected: boolean;
  successfulSubmissionAttempted: boolean;
  successfulSubmissionPassed: boolean;
  skippedSubmissionReason?: string;
}): string[] {
  const flags: string[] = [];
  if (!result.requiredFieldsOk) flags.push("Required field validation");
  if (!result.invalidEmailValidationOk) flags.push("Invalid email handling");
  if (result.successfulSubmissionAttempted && !result.successfulSubmissionPassed) {
    flags.push("Submission did not succeed");
  }
  if (result.skippedSubmissionReason) {
    flags.push(result.skippedSubmissionReason);
  }
  return flags;
}
