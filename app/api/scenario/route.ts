import { NextRequest, NextResponse } from "next/server";
import { computeScenario } from "@/lib/calculations";

export async function POST(req: NextRequest) {
  const { transactionId, alternativeAssetIds } = await req.json();
  if (!transactionId || !alternativeAssetIds?.length) {
    return NextResponse.json({ error: "transactionId ve alternativeAssetIds zorunlu" }, { status: 400 });
  }
  const results = await computeScenario(Number(transactionId), alternativeAssetIds.map(Number));
  return NextResponse.json(results);
}
