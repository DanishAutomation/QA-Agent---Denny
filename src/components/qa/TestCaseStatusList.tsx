import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleDashed, LoaderCircle, MinusCircle, XCircle } from "lucide-react";
import type { TestCaseItem } from "@/lib/mockExecutionState";
import { cn } from "@/lib/utils";

interface TestCaseStatusListProps {
  testCases: TestCaseItem[];
}

function statusIcon(status: TestCaseItem["status"]) {
  if (status === "passed") {
    return CheckCircle2;
  }
  if (status === "failed") {
    return XCircle;
  }
  if (status === "running") {
    return LoaderCircle;
  }
  if (status === "skipped") {
    return MinusCircle;
  }
  return CircleDashed;
}

function toBadgeVariant(status: TestCaseItem["status"]) {
  if (status === "passed") {
    return "success";
  }
  if (status === "failed") {
    return "danger";
  }
  if (status === "running") {
    return "warning";
  }
  return "outline";
}

export function TestCaseStatusList({ testCases }: TestCaseStatusListProps) {
  return (
    <section className="qa-card rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-950/70">
      <h3 className="mb-3 font-semibold">Test Case Status List</h3>
      <div className="space-y-2">
        {testCases.map((testCase, index) => {
          const Icon = statusIcon(testCase.status);
          return (
            <article
              key={testCase.id}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 transition-colors",
                testCase.status === "running" && "border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/20",
                testCase.status === "passed" && "border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/30",
                testCase.status === "failed" && "border-rose-100 bg-rose-50/30 dark:border-rose-900/30",
                testCase.status === "skipped" && "border-amber-100 bg-amber-50/20 dark:border-amber-900/30"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 items-center justify-center rounded-full border bg-background text-[11px] font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">{testCase.id}</p>
                  <p className="text-sm font-medium">{testCase.title}</p>
                </div>
              </div>
              <Badge
                variant={toBadgeVariant(testCase.status)}
                className={cn("gap-1", testCase.status === "running" && "qa-live-badge")}
              >
                <Icon className={cn("size-3.5", testCase.status === "running" && "animate-spin")} />
                {testCase.status}
              </Badge>
            </article>
          );
        })}
      </div>
    </section>
  );
}
