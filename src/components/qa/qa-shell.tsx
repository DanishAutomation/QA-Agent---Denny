"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SideNav } from "./side-nav";
import { TopBar } from "./top-bar";

interface QaShellProps {
  children: ReactNode;
}

export function QaShell({ children }: QaShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem("dennyqa-theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    window.localStorage.setItem("dennyqa-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((previous) => !previous);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-cyan-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <SideNav className="hidden lg:block" />

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <SideNav
              className="relative z-10"
              showCloseButton
              onClose={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        ) : null}

        <div className="flex-1 p-4 sm:p-6">
          <TopBar
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            onToggleMobileNav={() => setMobileOpen(true)}
          />
          <div className="qa-page mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
