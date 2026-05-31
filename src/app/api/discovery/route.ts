import { NextRequest, NextResponse } from "next/server";
import { runDiscovery } from "@/server/discovery/discoveryEngine";

export const runtime = "nodejs";

interface DiscoveryRequestBody {
  url?: string;
  maxDepth?: number;
  maxPages?: number;
  maxLinksPerPage?: number;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as DiscoveryRequestBody | null;
  if (!body?.url) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_REQUEST", message: "url is required." },
      },
      { status: 400 }
    );
  }

  try {
    new URL(body.url);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_URL", message: "Provide a valid absolute URL." },
      },
      { status: 400 }
    );
  }

  try {
    const result = await runDiscovery(body.url, {
      maxDepth: Math.max(0, Math.min(body.maxDepth ?? 2, 5)),
      maxPages: Math.max(1, Math.min(body.maxPages ?? 20, 100)),
      maxLinksPerPage: Math.max(10, Math.min(body.maxLinksPerPage ?? 60, 250)),
    });
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Discovery failed unexpectedly.";
    return NextResponse.json(
      { ok: false, error: { code: "DISCOVERY_FAILED", message } },
      { status: 500 }
    );
  }
}
