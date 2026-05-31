import type { ReactNode } from "react";

interface AppShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AppShell({ title, description, children }: AppShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </header>
      {children}
    </main>
  );
}
