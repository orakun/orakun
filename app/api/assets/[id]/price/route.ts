import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { date, priceTry } = await req.json();
  if (!date || !priceTry) {
    return NextResponse.json({ error: "Tarih ve fiyat zorunlu" }, { status: 400 });
  }
  const entry = await prisma.priceHistory.upsert({
    where: { assetId_date: { assetId: Number(id), date: new Date(date) } },
    update: { priceTry: String(priceTry) },
    create: { assetId: Number(id), date: new Date(date), priceTry: String(priceTry) },
  });
  return NextResponse.json(entry);
}
