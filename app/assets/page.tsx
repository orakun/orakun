"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ASSET_TYPE_LABELS } from "@/lib/types";

interface Asset {
  id: number;
  symbol: string;
  displayName: string;
  type: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [symbol, setSymbol] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [type, setType] = useState("STOCK");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Manual price entry
  const [priceAssetId, setPriceAssetId] = useState<number | null>(null);
  const [priceDate, setPriceDate] = useState(new Date().toISOString().slice(0, 10));
  const [priceTry, setPriceTry] = useState("");

  async function load() {
    const res = await fetch("/api/assets");
    setAssets(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, displayName, type }),
    });
    setLoading(false);
    if (res.ok) {
      setSymbol(""); setDisplayName("");
      load();
    } else {
      const d = await res.json();
      setError(d.error ?? "Hata");
    }
  }

  async function handlePriceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!priceAssetId) return;
    await fetch(`/api/assets/${priceAssetId}/price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: priceDate, priceTry }),
    });
    setPriceTry(""); setPriceAssetId(null);
    alert("Fiyat kaydedildi");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Varlıklar</h1>

      <Card>
        <CardHeader><CardTitle className="text-sm">Yeni Varlık Ekle</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Sembol</Label>
              <Input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="THYAO, USD, AFA..." />
            </div>
            <div className="space-y-1">
              <Label>Görünen İsim</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Türk Hava Yolları" />
            </div>
            <div className="space-y-1">
              <Label>Tür</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading || !symbol || !displayName}>Ekle</Button>
            </div>
          </form>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>

      {priceAssetId && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader><CardTitle className="text-sm">Manuel Fiyat Gir</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handlePriceSubmit} className="flex gap-3 flex-wrap">
              <div className="space-y-1">
                <Label>Tarih</Label>
                <Input type="date" value={priceDate} onChange={e => setPriceDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Fiyat (₺)</Label>
                <Input type="number" step="0.01" value={priceTry} onChange={e => setPriceTry(e.target.value)} placeholder="0.00" />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit">Kaydet</Button>
                <Button type="button" variant="outline" onClick={() => setPriceAssetId(null)}>İptal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {assets.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <div>
              <span className="font-medium">{a.symbol}</span>
              <span className="text-sm text-muted-foreground ml-2">{a.displayName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {ASSET_TYPE_LABELS[a.type as keyof typeof ASSET_TYPE_LABELS] ?? a.type}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => setPriceAssetId(a.id)}>
                Fiyat Gir
              </Button>
            </div>
          </div>
        ))}
        {!assets.length && <p className="text-sm text-muted-foreground text-center py-4">Henüz varlık eklenmedi.</p>}
      </div>
    </div>
  );
}
