import { Bell, Menu, Moon, Sparkles, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onToggleMobileNav: () => void;
}

export function TopBar({
  isDarkMode,
  onToggleTheme,
  onToggleMobileNav,
}: TopBarProps) {
  return (
    <header className="flex items-center justify-between rounded-xl border bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:bg-slate-950/70">
      <div>
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="mb-2 inline-flex rounded-lg border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </button>
        <p className="text-sm font-medium">Welcome back, Danish</p>
        <p className="text-xs text-muted-foreground">
          Platform mode: Live orchestration (discovery + generation + execution)
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="size-3" />
          AI Ready
        </Badge>
        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-lg border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Toggle color theme"
        >
          {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
        <button
          type="button"
          className="rounded-lg border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </button>
      </div>
    </header>
  );
}
