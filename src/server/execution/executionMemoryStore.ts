import fs from "node:fs";
import path from "node:path";

export interface DomainExecutionMemory {
  domain: string;
  updatedAt: string;
  successfulSelectors: string[];
  failedSelectors: string[];
  successfulFlowPaths: string[];
  failedFlowPaths: string[];
  provenJourneySteps: string[];
  assumptions: string[];
  customCommandMappings: Array<{
    command: string;
    mappedAction: string;
    success: boolean;
    recordedAt: string;
  }>;
}

function memoryFilePath(domain: string): string {
  const safeDomain = domain.replace(/[^a-z0-9.-]/gi, "_").toLowerCase();
  return path.join(process.cwd(), "src", "reports", "memory", `${safeDomain}.json`);
}

function defaultMemory(domain: string): DomainExecutionMemory {
  return {
    domain,
    updatedAt: new Date().toISOString(),
    successfulSelectors: [],
    failedSelectors: [],
    successfulFlowPaths: [],
    failedFlowPaths: [],
    provenJourneySteps: [],
    assumptions: [],
    customCommandMappings: [],
  };
}

function dedupeLimit(values: string[], limit = 150): string[] {
  const unique = [...new Set(values.filter(Boolean).map((value) => value.trim()))];
  return unique.slice(-limit);
}

export function readExecutionMemory(domain: string): DomainExecutionMemory {
  const filePath = memoryFilePath(domain);
  if (!fs.existsSync(filePath)) {
    return defaultMemory(domain);
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as DomainExecutionMemory;
    const updatedAtMs = Date.parse(parsed.updatedAt ?? "");
    const staleForMs = Date.now() - (Number.isNaN(updatedAtMs) ? 0 : updatedAtMs);
    if (staleForMs > 1000 * 60 * 60 * 24 * 14) {
      return defaultMemory(domain);
    }
    return {
      ...defaultMemory(domain),
      ...parsed,
      domain,
      provenJourneySteps: dedupeLimit(
        (parsed.provenJourneySteps ?? []).length > 0
          ? (parsed.provenJourneySteps ?? [])
          : (parsed.customCommandMappings ?? [])
              .filter((entry) => entry.success)
              .map((entry) => entry.command)
      ),
      successfulSelectors: dedupeLimit(parsed.successfulSelectors ?? []),
      failedSelectors: dedupeLimit(parsed.failedSelectors ?? []),
      successfulFlowPaths: dedupeLimit(parsed.successfulFlowPaths ?? []),
      failedFlowPaths: dedupeLimit(parsed.failedFlowPaths ?? []),
      assumptions: dedupeLimit(parsed.assumptions ?? []),
      customCommandMappings: (parsed.customCommandMappings ?? []).slice(-200),
    };
  } catch {
    return defaultMemory(domain);
  }
}

export function updateExecutionMemory(
  domain: string,
  patch: Partial<DomainExecutionMemory>
): DomainExecutionMemory {
  const current = readExecutionMemory(domain);
  const next: DomainExecutionMemory = {
    ...current,
    ...patch,
    domain,
    updatedAt: new Date().toISOString(),
    successfulSelectors: dedupeLimit([
      ...current.successfulSelectors,
      ...(patch.successfulSelectors ?? []),
    ]),
    failedSelectors: dedupeLimit([...current.failedSelectors, ...(patch.failedSelectors ?? [])]),
    successfulFlowPaths: dedupeLimit([
      ...current.successfulFlowPaths,
      ...(patch.successfulFlowPaths ?? []),
    ]),
    failedFlowPaths: dedupeLimit([...current.failedFlowPaths, ...(patch.failedFlowPaths ?? [])]),
    provenJourneySteps: dedupeLimit([
      ...current.provenJourneySteps,
      ...(patch.provenJourneySteps ?? []),
    ]),
    assumptions: dedupeLimit([...current.assumptions, ...(patch.assumptions ?? [])]),
    customCommandMappings: [
      ...current.customCommandMappings,
      ...(patch.customCommandMappings ?? []),
    ].slice(-200),
  };

  const filePath = memoryFilePath(domain);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(next, null, 2), "utf-8");
  return next;
}
