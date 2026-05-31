import { CircleCheck, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ExecutionPhase } from "@/lib/mockExecutionState";

interface ExecutionPhaseStepperProps {
  phases: ExecutionPhase[];
  currentPhase: ExecutionPhase;
  isComplete?: boolean;
}

export function ExecutionPhaseStepper({
  phases,
  currentPhase,
  isComplete = false,
}: ExecutionPhaseStepperProps) {
  const normalizedPhase =
    (currentPhase as string) === "Analysis" ? "Post-Run Analysis" : currentPhase;
  const activeIndex = phases.indexOf(normalizedPhase);

  return (
    <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
      <h3 className="mb-3 font-semibold">Execution Phase Stepper</h3>
      <div className="space-y-2">
        {phases.map((phase, index) => {
          const completed = isComplete ? true : index < activeIndex;
          const active = isComplete ? false : index === activeIndex;
          return (
            <div
              key={phase}
              className="flex items-center justify-between rounded-lg border p-2"
            >
              <div className="flex items-center gap-2 text-sm">
                {completed ? (
                  <CircleCheck className="size-4 text-emerald-600" />
                ) : active ? (
                  <LoaderCircle className="size-4 animate-spin text-indigo-600" />
                ) : (
                  <div className="size-4 rounded-full border" />
                )}
                <span>{phase}</span>
              </div>
              <Badge
                variant={completed ? "success" : active ? "warning" : "outline"}
                className={active ? "qa-live-badge" : undefined}
              >
                {completed ? "Done" : active ? "In Progress" : "Pending"}
              </Badge>
            </div>
          );
        })}
      </div>
    </section>
  );
}
