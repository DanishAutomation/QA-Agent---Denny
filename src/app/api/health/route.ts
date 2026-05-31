import { NextResponse } from "next/server";
import { getSystemHealth } from "@/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    services: getSystemHealth(),
  });
}
