"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTRY } from "@/lib/format";

export default function NewTransactionPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  const [assets, setAssets] = useState<{ id: number; symbol: string; displayName: string }[]>([]);
  const [form, setForm] = useState({
    accountId: "",
    assetId: "",
    transactionDate: new Date().toISOString().slice(0, 10),
    quantity: "",
    unitPriceTry: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/accounts").then(r => r.json()).then(setAccounts);
    fetch("/api/assets").then(r => r.json()).then(setAssets);
  }, []);

  const total = parseFloat(form.quantity || "0") * parseFloat(form.unitPriceTry || "0");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/transactions");
    } else {
      const d = await res.json();
      setError(d.error ?? "Hata oluştu");
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Yeni İşlem</h1>
      <Card>
        <CardHeader><CardTitle className="text-sm">İşlem Bilgileri</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Hesap</Label>
                <Select value={form.accountId} onValueChange={v => setForm(f => ({ ...f, accountId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Hesap seçin" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Varlık</Label>
                <Select value={form.assetId} onValueChange={v => setForm(f => ({ ...f, assetId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Varlık seçin" /></SelectTrigger>
                  <SelectContent>
                    {assets.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.symbol} — {a.displayName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>İşlem Tarihi</Label>
              <Input type="date" value={form.transactionDate} onChange={e => setForm(f => ({ ...f, transactionDate: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Adet / Miktar</Label>
                <Input type="number" step="0.0001" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0.0000" />
              </div>
              <div className="space-y-1">
                <Label>Birim Fiyat (₺)</Label>
                <Input type="number" step="0.01" min="0" value={form.unitPriceTry} onChange={e => setForm(f => ({ ...f, unitPriceTry: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
            <div className="rounded-lg bg-muted px-4 py-2 text-sm">
              Toplam: <strong>{total > 0 ? formatTRY(total) : "—"}</strong>
            </div>
            <div className="space-y-1">
              <Label>Notlar (isteğe bağlı)</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading || !form.accountId || !form.assetId || !form.quantity || !form.unitPriceTry}>
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>İptal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
