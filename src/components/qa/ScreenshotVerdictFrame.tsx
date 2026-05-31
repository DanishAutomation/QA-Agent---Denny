import { Badge } from "@/components/ui/badge";
import {
  verdictBannerClass,
  verdictBorderClass,
  verdictLabel,
  type ScreenshotVerdict,
} from "@/lib/screenshotIssueLabels";

interface ScreenshotVerdictFrameProps {
  verdict: ScreenshotVerdict;
  issueSummary?: string;
  issueFlags?: string[];
  children: React.ReactNode;
  className?: string;
}

export function ScreenshotVerdictFrame({
  verdict,
  issueSummary,
  issueFlags = [],
  children,
  className = "",
}: ScreenshotVerdictFrameProps) {
  return (
    <div className={`relative overflow-hidden rounded-lg border-2 ${verdictBorderClass(verdict)} ${className}`}>
      <div
        className={`absolute left-0 top-0 z-10 flex max-w-[85%] items-center gap-2 rounded-br-lg px-3 py-1.5 text-xs font-bold tracking-wide shadow-md ${verdictBannerClass(verdict)}`}
      >
        <span>{verdictLabel(verdict)}</span>
        {issueSummary ? (
          <span className="truncate font-normal opacity-95">· {issueSummary}</span>
        ) : null}
      </div>
      {children}
      {issueFlags.length > 0 ? (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-wrap gap-1 bg-black/75 px-2 py-1.5">
          {issueFlags.map((flag) => (
            <Badge
              key={flag}
              variant="danger"
              className="text-[10px] font-medium uppercase tracking-wide"
            >
              {flag}
            </Badge>
          ))}
        </div>
      ) : verdict === "pass" ? (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-emerald-950/80 px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wide text-emerald-100">
          No issues detected for this capture
        </div>
      ) : null}
    </div>
  );
}
