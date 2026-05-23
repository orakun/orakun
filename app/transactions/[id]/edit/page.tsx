"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTRY } from "@/lib/format";

export default function EditTransactionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState({
    transactionDate: "",
    quantity: "",
    unitPriceTry: "",
    notes: "",
  });
  const [assetSymbol, setAssetSymbol] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/transactions").then(r => r.json()).then((txs) => {
      const tx = txs.find((t: { id: number }) => t.id === Number(id));
      if (tx) {
        setForm({
          transactionDate: tx.transactionDate.slice(0, 10),
          quantity: tx.quantity,
          unitPriceTry: tx.unitPriceTry,
          notes: tx.notes ?? "",
        });
        setAssetSymbol(tx.asset.symbol);
      }
    });
  }, [id]);

  const total = parseFloat(form.quantity || "0") * parseFloat(form.unitPriceTry || "0");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    router.push("/transactions");
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">İşlem Düzenle — {assetSymbol}</h1>
      <Card>
        <CardHeader><CardTitle className="text-sm">İşlem Bilgileri</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Tarih</Label>
              <Input type="date" value={form.transactionDate} onChange={e => setForm(f => ({ ...f, transactionDate: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Adet</Label>
                <Input type="number" step="0.0001" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Birim Fiyat (₺)</Label>
                <Input type="number" step="0.01" value={form.unitPriceTry} onChange={e => setForm(f => ({ ...f, unitPriceTry: e.target.value }))} />
              </div>
            </div>
            <div className="rounded-lg bg-muted px-4 py-2 text-sm">
              Toplam: <strong>{formatTRY(total)}</strong>
            </div>
            <div className="space-y-1">
              <Label>Notlar</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? "Kaydediliyor..." : "Güncelle"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>İptal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
