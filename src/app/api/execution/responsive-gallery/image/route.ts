import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function isSafeName(value: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(value);
}

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get("runId") ?? "";
  const file = request.nextUrl.searchParams.get("file") ?? "";

  if (!isSafeName(runId) || !isSafeName(file)) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_PATH", message: "Invalid run or file path." } },
      { status: 400 }
    );
  }

  const imagePath = path.join(
    process.cwd(),
    "src",
    "reports",
    "executions",
    runId,
    "responsive-screenshots",
    file
  );

  if (!fs.existsSync(imagePath)) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Screenshot not found." } },
      { status: 404 }
    );
  }

  const buffer = fs.readFileSync(imagePath);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
