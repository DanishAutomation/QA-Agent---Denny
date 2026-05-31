import { getRegisteredAgents } from "@/agents";

export default function AgentsPage() {
  const agents = getRegisteredAgents();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Agent Modules</h1>
      <p className="text-muted-foreground">
        Each module represents a future AI QA capability and currently exposes a
        common contract only.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {agents.map((agent) => (
          <li key={agent.id} className="rounded-md border p-4">
            <p className="font-medium">{agent.name}</p>
            <p className="text-sm text-muted-foreground">{agent.id}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
