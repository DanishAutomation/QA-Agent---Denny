import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExecutionPlaybackControlsProps {
  isPaused: boolean;
  speed: 1 | 2 | 4;
  onTogglePause: () => void;
  onSpeedChange: (speed: 1 | 2 | 4) => void;
  onReset: () => void;
}

export function ExecutionPlaybackControls({
  isPaused,
  speed,
  onTogglePause,
  onSpeedChange,
  onReset,
}: ExecutionPlaybackControlsProps) {
  return (
    <section className="qa-card rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Playback Controls</p>
          <p className="text-xs text-muted-foreground">
            Control fallback timeline playback when live run data is unavailable.
          </p>
        </div>
        <Badge variant={isPaused ? "outline" : "warning"} className={!isPaused ? "qa-live-badge" : undefined}>
          {isPaused ? "Paused" : "Playing"}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onTogglePause}
          className={buttonVariants({ variant: "outline", className: "h-9" })}
        >
          {isPaused ? "Resume" : "Pause"}
        </button>

        <button
          type="button"
          onClick={onReset}
          className={buttonVariants({ variant: "ghost", className: "h-9" })}
        >
          Reset
        </button>

        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>Speed</span>
          {[1, 2, 4].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSpeedChange(option as 1 | 2 | 4)}
              className={cn(
                "rounded-md border px-2 py-1 text-xs transition",
                speed === option
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "hover:bg-muted"
              )}
            >
              {option}x
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
