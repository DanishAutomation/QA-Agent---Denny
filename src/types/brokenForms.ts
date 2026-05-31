export type BrokenLinkCategory =
  | "header"
  | "footer"
  | "cta"
  | "internal"
  | "image-link";

export type BrokenLinkFailureType =
  | "404"
  | "403"
  | "500"
  | "redirect-loop"
  | "timeout"
  | "blocked";

export interface BrokenLinkFinding {
  fromUrl: string;
  targetUrl: string;
  category: BrokenLinkCategory;
  failureType: BrokenLinkFailureType;
  statusCode?: number;
}

export interface BrokenLinksReport {
  baseUrl: string;
  checkedAt: string;
  checkedCount: number;
  failedCount: number;
  confirmedFailedCount?: number;
  blockedCount?: number;
  pagesSampled?: number;
  findings: BrokenLinkFinding[];
}

export type DetectedFormType =
  | "contact"
  | "newsletter"
  | "quote"
  | "registration"
  | "search"
  | "other";

export interface FormValidationResult {
  pageUrl: string;
  formType: DetectedFormType;
  requiredFieldsOk: boolean;
  invalidEmailValidationOk: boolean;
  validationMessageDetected: boolean;
  successfulSubmissionAttempted: boolean;
  successfulSubmissionPassed: boolean;
  skippedSubmissionReason?: string;
  notes: string[];
}

export interface FormsTestingReport {
  baseUrl: string;
  checkedAt: string;
  formsDetected: number;
  results: FormValidationResult[];
}
