import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function isSafe(value: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(value);
}

function getContentType(file: string): string {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  if (file.endsWith(".md")) return "text/markdown; charset=utf-8";
  return "text/plain; charset=utf-8";
}

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get("runId") ?? "";
  const file = request.nextUrl.searchParams.get("file") ?? "";

  if (!isSafe(runId) || !isSafe(file)) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_PATH", message: "Invalid run or filename." } },
      { status: 400 }
    );
  }

  const allowed = new Set(["client-report.html", "client-report.json", "summary.md"]);
  if (!allowed.has(file)) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_ALLOWED", message: "Unsupported report file." } },
      { status: 400 }
    );
  }

  const absolutePath = path.join(
    process.cwd(),
    "src",
    "reports",
    "executions",
    runId,
    file
  );
  if (!fs.existsSync(absolutePath)) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Report file not found." } },
      { status: 404 }
    );
  }

  const buffer = fs.readFileSync(absolutePath);
  const disposition =
    file.endsWith(".html") || file.endsWith(".md")
      ? `inline; filename="${file}"`
      : `attachment; filename="${file}"`;
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": getContentType(file),
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
