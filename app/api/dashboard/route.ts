import { NextResponse } from "next/server";
import { computePortfolioSummary } from "@/lib/calculations";

export async function GET() {
  const summary = await computePortfolioSummary();
  return NextResponse.json(summary);
}
