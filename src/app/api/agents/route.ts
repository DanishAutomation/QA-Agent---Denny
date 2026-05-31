import { NextResponse } from "next/server";
import { getRegisteredAgents } from "@/agents";

export async function GET() {
  return NextResponse.json({
    data: getRegisteredAgents(),
  });
}
