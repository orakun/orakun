import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Dosya yüklenmedi" }, { status: 400 });

  const text = await file.text();
  let records: Record<string, string>[];
  try {
    records = parse(text, { columns: true, skip_empty_lines: true, trim: true });
  } catch {
    return NextResponse.json({ error: "CSV parse hatası" }, { status: 400 });
  }

  const errors: string[] = [];
  const created: number[] = [];

  for (const [i, row] of Array.from(records.entries())) {
    try {
      const { date, account, asset_symbol, asset_type, quantity, unit_price_try, notes } = row;
      if (!date || !account || !asset_symbol || !asset_type || !quantity || !unit_price_try) {
        errors.push(`Satır ${i + 2}: Zorunlu alan eksik`);
        continue;
      }
      const txDate = new Date(date);
      if (isNaN(txDate.getTime())) {
        errors.push(`Satır ${i + 2}: Geçersiz tarih (YYYY-MM-DD formatı kullanın)`);
        continue;
      }
      const acc = await prisma.account.upsert({
        where: { name: account },
        create: { name: account },
        update: {},
      });
      const assetType = asset_type.toUpperCase();
      if (!["STOCK", "CURRENCY", "GOLD", "FUND"].includes(assetType)) {
        errors.push(`Satır ${i + 2}: Geçersiz varlık türü (STOCK/CURRENCY/GOLD/FUND)`);
        continue;
      }
      const ast = await prisma.asset.upsert({
        where: { symbol: asset_symbol.toUpperCase() },
        create: { symbol: asset_symbol.toUpperCase(), displayName: asset_symbol, type: assetType },
        update: {},
      });
      const qty = parseFloat(quantity);
      const price = parseFloat(unit_price_try);
      const tx = await prisma.transaction.create({
        data: {
          accountId: acc.id,
          assetId: ast.id,
          transactionDate: txDate,
          quantity: qty.toString(),
          unitPriceTry: price.toString(),
          totalTry: (qty * price).toString(),
          notes: notes || null,
        },
      });
      created.push(tx.id);
    } catch (e) {
      errors.push(`Satır ${i + 2}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ imported: created.length, errors });
}
