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
      return { name: entry.name, folderPath, mtime: stat.mtimeMs };
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
  const reportPath = getLatestRunReportPath();
  if (!reportPath) {
    return NextResponse.json({
      ok: true,
      data: null,
      message: "No execution report found yet.",
    });
  }

  try {
    const raw = fs.readFileSync(reportPath, "utf-8");
    const parsed = JSON.parse(raw) as ExecutionRunResult;
    return NextResponse.json({
      ok: true,
      data: parsed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "REPORT_READ_FAILED",
          message: error instanceof Error ? error.message : "Could not parse latest report.",
        },
      },
      { status: 500 }
    );
  }
}
