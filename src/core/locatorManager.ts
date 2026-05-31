export interface LocatorCandidate {
  strategy: "role" | "text" | "testid" | "css" | "xpath";
  value: string;
  confidence: number;
}

export class LocatorManager {
  rankCandidates(candidates: LocatorCandidate[]): LocatorCandidate[] {
    return [...candidates].sort((a, b) => b.confidence - a.confidence);
  }
}

export const locatorManager = new LocatorManager();
