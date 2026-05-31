import { appConfig } from "@/core/configManager";

export default function ConfigPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Runtime Configuration
      </h1>
      <p className="text-muted-foreground">
        Centralized config system with environment overlays and provider
        abstraction for future infrastructure upgrades.
      </p>
      <pre className="overflow-auto rounded-md border bg-muted p-4 text-xs">
        {JSON.stringify(appConfig, null, 2)}
      </pre>
    </main>
  );
}
