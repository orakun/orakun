import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.transaction.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { quantity, unitPriceTry, notes, transactionDate } = body;
  const qty = parseFloat(quantity);
  const price = parseFloat(unitPriceTry);
  const tx = await prisma.transaction.update({
    where: { id: Number(id) },
    data: {
      quantity: qty.toString(),
      unitPriceTry: price.toString(),
      totalTry: (qty * price).toString(),
      notes: notes ?? null,
      transactionDate: new Date(transactionDate),
    },
    include: { asset: true, account: true },
  });
  return NextResponse.json({
    ...tx,
    quantity: tx.quantity.toString(),
    unitPriceTry: tx.unitPriceTry.toString(),
    totalTry: tx.totalTry.toString(),
    transactionDate: tx.transactionDate.toISOString(),
    createdAt: tx.createdAt.toISOString(),
  });
}
