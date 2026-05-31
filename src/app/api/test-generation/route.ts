import { NextRequest, NextResponse } from "next/server";
import { generateDynamicTestScenarios } from "@/server/test-generation/dynamicTestGenerationEngine";
import type { DynamicGenerationInput, ParsedInstructionData } from "@/types";

export const runtime = "nodejs";

interface RequestBody {
  discoveryResult?: DynamicGenerationInput["discoveryResult"];
  selectedTestType?: string;
  parsedInstructions?: ParsedInstructionData;
  capabilityMap?: DynamicGenerationInput["capabilityMap"];
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  if (!body?.discoveryResult || !body?.selectedTestType || !body?.parsedInstructions) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message: "discoveryResult, selectedTestType, and parsedInstructions are required.",
        },
      },
      { status: 400 }
    );
  }

  const result = generateDynamicTestScenarios({
    discoveryResult: body.discoveryResult,
    selectedTestType: body.selectedTestType,
    parsedInstructions: body.parsedInstructions,
    capabilityMap: body.capabilityMap,
  });

  return NextResponse.json({ ok: true, data: result });
}
