import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const assets = await prisma.asset.findMany({
    where: type ? { type } : undefined,
    orderBy: { symbol: "asc" },
  });
  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const { symbol, displayName, type } = await req.json();
  if (!symbol || !displayName || !type) {
    return NextResponse.json({ error: "Sembol, isim ve tür zorunlu" }, { status: 400 });
  }
  const asset = await prisma.asset.create({
    data: { symbol: symbol.toUpperCase(), displayName, type },
  });
  return NextResponse.json(asset, { status: 201 });
}
