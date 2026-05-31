const architectureSections = [
  "app: route-level composition and UX surfaces",
  "agents: AI QA engineer reasoning modules",
  "core: browser, devices, data, screenshots, locators, config",
  "server: backend orchestration and APIs",
  "database: provider-aware persistence with SQLite default",
  "features: domain packs for scalable QA intents",
];

export default function ArchitecturePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        DennyQA vNext Architecture
      </h1>
      <p className="text-muted-foreground">
        This scaffold provides modular boundaries for a future AI QA Engineer
        system without shipping automation behavior yet.
      </p>
      <ul className="space-y-2">
        {architectureSections.map((section) => (
          <li key={section} className="rounded-md border p-3 text-sm">
            {section}
          </li>
        ))}
      </ul>
    </main>
  );
}
