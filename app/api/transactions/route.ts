import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const assetId = searchParams.get("assetId");

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(accountId ? { accountId: Number(accountId) } : {}),
      ...(assetId ? { assetId: Number(assetId) } : {}),
    },
    include: { asset: true, account: true },
    orderBy: { transactionDate: "desc" },
  });

  // Serialize Decimal fields
  return NextResponse.json(
    transactions.map((tx) => ({
      ...tx,
      quantity: tx.quantity.toString(),
      unitPriceTry: tx.unitPriceTry.toString(),
      totalTry: tx.totalTry.toString(),
      transactionDate: tx.transactionDate.toISOString(),
      createdAt: tx.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { accountId, assetId, transactionDate, quantity, unitPriceTry, notes } = body;
  if (!accountId || !assetId || !transactionDate || !quantity || !unitPriceTry) {
    return NextResponse.json({ error: "Zorunlu alanlar eksik" }, { status: 400 });
  }
  const qty = parseFloat(quantity);
  const price = parseFloat(unitPriceTry);
  const total = qty * price;
  const tx = await prisma.transaction.create({
    data: {
      accountId: Number(accountId),
      assetId: Number(assetId),
      transactionDate: new Date(transactionDate),
      quantity: qty.toString(),
      unitPriceTry: price.toString(),
      totalTry: total.toString(),
      notes: notes ?? null,
    },
    include: { asset: true, account: true },
  });
  return NextResponse.json(
    {
      ...tx,
      quantity: tx.quantity.toString(),
      unitPriceTry: tx.unitPriceTry.toString(),
      totalTry: tx.totalTry.toString(),
      transactionDate: tx.transactionDate.toISOString(),
      createdAt: tx.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
