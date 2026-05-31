import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import type { ExecutionRunResult } from "@/types";

export const runtime = "nodejs";

function getLatestRunReportPath(): string | null {
  const root = path.join(process.cwd(), "src", "reports", "executions");
  if (!fs.existsSync(root)) {
    return null;
  }
  const entries = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const folderPath = path.join(root, entry.name);
      const stat = fs.statSync(folderPath);
      return { folderPath, mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  for (const entry of entries) {
    const resultPath = path.join(entry.folderPath, "result.json");
    if (fs.existsSync(resultPath)) {
      return resultPath;
    }
  }
  return null;
}

export async function GET() {
  const resultPath = getLatestRunReportPath();
  if (!resultPath) {
    return NextResponse.json({
      ok: true,
      data: null,
      message: "No run report found.",
    });
  }

  const run = JSON.parse(fs.readFileSync(resultPath, "utf-8")) as ExecutionRunResult;
  if (!run.responsiveReport) {
    return NextResponse.json({
      ok: true,
      data: null,
      message: "Latest run does not contain responsive report.",
    });
  }

  const findings = run.responsiveReport.findings.map((item) => ({
    ...item,
    screenshotFile: path.basename(item.screenshotPath),
  }));

  return NextResponse.json({
    ok: true,
    data: {
      runId: run.runId,
      responsiveReport: {
        ...run.responsiveReport,
        findings,
      },
    },
  });
}
