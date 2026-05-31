"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Camera,
  Compass,
  GaugeCircle,
  History,
  PanelLeftClose,
  PlayCircle,
  Rows3,
  Rocket,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: GaugeCircle },
  { href: "/discovery-lab", label: "Discovery Lab", icon: Compass },
  { href: "/responsive-gallery", label: "Responsive Gallery", icon: Rows3 },
  { href: "/new-execution", label: "New Execution", icon: Rocket },
  { href: "/execution-progress", label: "Execution Progress", icon: Activity },
  { href: "/screenshot-gallery", label: "Screenshot Gallery", icon: Camera },
  { href: "/results", label: "Results", icon: PlayCircle },
  { href: "/execution-history", label: "Execution History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SideNavProps {
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function SideNav({
  className,
  onNavigate,
  onClose,
  showCloseButton = false,
}: SideNavProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen w-72 border-r bg-white/80 p-4 backdrop-blur dark:bg-slate-950/70",
        className
      )}
    >
      <div className="mb-6 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 p-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/70">DennyQA vNext</p>
            <h1 className="mt-1 text-lg font-semibold">AI QA Command Center</h1>
            <p className="mt-1 text-xs text-white/80">Smart quality orchestration</p>
          </div>
          {showCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-white/30 p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Close navigation"
            >
              <PanelLeftClose className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
