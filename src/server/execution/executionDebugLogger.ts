import fs from "node:fs";
import path from "node:path";

interface DebugLogEvent {
  timestamp: string;
  runId: string;
  stage: string;
  message: string;
  metadata?: Record<string, unknown>;
}

function logFilePath(runId: string): string {
  const dir = path.join(process.cwd(), "src", "reports", "executions", runId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, "execution-debug.log");
}

export function writeExecutionDebugLog(params: {
  runId: string;
  stage: string;
  message: string;
  metadata?: Record<string, unknown>;
}): void {
  const event: DebugLogEvent = {
    timestamp: new Date().toISOString(),
    runId: params.runId,
    stage: params.stage,
    message: params.message,
    metadata: params.metadata,
  };
  const line = `${JSON.stringify(event)}\n`;
  fs.appendFileSync(logFilePath(params.runId), line, "utf-8");
}
