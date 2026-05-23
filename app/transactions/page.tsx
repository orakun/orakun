"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTRY, formatDate, formatNumber } from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/lib/types";
import type { TransactionWithRelations } from "@/lib/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);

  async function load() {
    const res = await fetch("/api/transactions");
    setTransactions(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    if (!confirm("Bu işlemi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">İşlemler</h1>
        <Link href="/transactions/new">
          <Button>+ Yeni İşlem</Button>
        </Link>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Hesap</TableHead>
              <TableHead>Varlık</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead className="text-right">Adet</TableHead>
              <TableHead className="text-right">Birim Fiyat</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead>Notlar</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{formatDate(tx.transactionDate)}</TableCell>
                <TableCell>{tx.account.name}</TableCell>
                <TableCell className="font-medium">{tx.asset.symbol}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {ASSET_TYPE_LABELS[tx.asset.type as keyof typeof ASSET_TYPE_LABELS] ?? tx.asset.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatNumber(parseFloat(tx.quantity))}</TableCell>
                <TableCell className="text-right">{formatTRY(parseFloat(tx.unitPriceTry))}</TableCell>
                <TableCell className="text-right">{formatTRY(parseFloat(tx.totalTry))}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-32 truncate">{tx.notes ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Link href={`/transactions/${tx.id}/edit`}>
                      <Button size="sm" variant="outline">Düzenle</Button>
                    </Link>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(tx.id)}>Sil</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!transactions.length && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Henüz işlem girilmedi.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
