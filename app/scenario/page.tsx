"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTRY, formatPercent, formatDate } from "@/lib/format";
import ScenarioChart from "@/components/scenario-chart";
import type { ScenarioResult, TransactionWithRelations } from "@/lib/types";

export default function ScenarioPage() {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
  const [assets, setAssets] = useState<{ id: number; symbol: string }[]>([]);
  const [selectedTx, setSelectedTx] = useState("");
  const [altAssets, setAltAssets] = useState<string[]>([]);
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/transactions").then(r => r.json()).then(setTransactions);
    fetch("/api/assets").then(r => r.json()).then(setAssets);
  }, []);

  function toggleAlt(id: string) {
    setAltAssets(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  }

  async function handleCompute() {
    if (!selectedTx || !altAssets.length) return;
    setLoading(true);
    const res = await fetch("/api/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: Number(selectedTx), alternativeAssetIds: altAssets.map(Number) }),
    });
    setResults(await res.json());
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Senaryo — Ne Olurdu?</h1>

      <Card>
        <CardHeader><CardTitle className="text-sm">Karşılaştırma Ayarları</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>İşlem Seçin</Label>
            <Select value={selectedTx} onValueChange={setSelectedTx}>
              <SelectTrigger><SelectValue placeholder="İşlem seçin..." /></SelectTrigger>
              <SelectContent>
                {transactions.map(tx => (
                  <SelectItem key={tx.id} value={String(tx.id)}>
                    {formatDate(tx.transactionDate)} — {tx.asset.symbol} — {formatTRY(parseFloat(tx.totalTry))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Alternatif Varlıklar (birden fazla seçilebilir)</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {assets.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAlt(String(a.id))}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    altAssets.includes(String(a.id))
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input hover:bg-muted"
                  }`}
                >
                  {a.symbol}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleCompute} disabled={loading || !selectedTx || !altAssets.length}>
            {loading ? "Hesaplanıyor..." : "Hesapla"}
          </Button>
        </CardContent>
      </Card>

      {results.map((r) => (
        <Card key={r.alternativeAssetId}>
          <CardHeader>
            <CardTitle className="text-sm">
              {r.originalAsset} → {r.alternativeAsset} karşılaştırması
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs text-muted-foreground">Gerçek Değer</p>
                <p className="font-bold text-blue-700">{formatTRY(r.actualCurrentValue)}</p>
                <p className="text-xs">{formatPercent(r.actualNominalReturn)} nominal</p>
                <p className="text-xs">{formatPercent(r.actualRealReturn)} reel</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-xs text-muted-foreground">Olurdu ({r.alternativeAsset})</p>
                <p className="font-bold text-green-700">{formatTRY(r.hypotheticalCurrentValue)}</p>
                <p className="text-xs">{formatPercent(r.hypotheticalNominalReturn)} nominal</p>
                <p className="text-xs">{formatPercent(r.hypotheticalRealReturn)} reel</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Yatırım Tutarı</p>
                <p className="font-bold">{formatTRY(r.investmentAmountTry)}</p>
                <p className="text-xs">{formatDate(r.investmentDate)}</p>
              </div>
              <div className={`rounded-lg p-3 ${r.hypotheticalCurrentValue > r.actualCurrentValue ? "bg-green-100" : "bg-red-100"}`}>
                <p className="text-xs text-muted-foreground">Fark</p>
                <p className={`font-bold ${r.hypotheticalCurrentValue > r.actualCurrentValue ? "text-green-700" : "text-red-700"}`}>
                  {formatTRY(r.hypotheticalCurrentValue - r.actualCurrentValue)}
                </p>
                <p className="text-xs">
                  {r.hypotheticalCurrentValue > r.actualCurrentValue ? "Daha iyi olurdu" : "Daha iyi seçim yaptınız"}
                </p>
              </div>
            </div>

            {r.timeSeries.length > 0 && (
              <ScenarioChart
                data={r.timeSeries}
                actualLabel={r.originalAsset}
                hypotheticalLabel={r.alternativeAsset}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
