import type { QaRunRecord } from "@/types";

class RunStore {
  private readonly records = new Map<string, QaRunRecord>();

  save(record: QaRunRecord): void {
    this.records.set(record.runId, record);
  }

  get(runId: string): QaRunRecord | undefined {
    return this.records.get(runId);
  }

  list(): QaRunRecord[] {
    return [...this.records.values()].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );
  }
}

export const runStore = new RunStore();
