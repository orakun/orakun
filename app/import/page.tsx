"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/import", { method: "POST", body: fd });
    setResult(await res.json());
    setLoading(false);
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">CSV İmport</h1>

      <Card>
        <CardHeader><CardTitle className="text-sm">CSV Formatı</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted rounded p-3 overflow-x-auto">
{`date,account,asset_symbol,asset_type,quantity,unit_price_try,notes
2023-01-15,Midas,THYAO,STOCK,100,55.20,İlk alım
2023-03-01,Garanti,USD,CURRENCY,1000,18.75,
2024-06-10,İş Yatırım,GRAM_ALTIN,GOLD,50,2100.00,`}
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            asset_type: STOCK | CURRENCY | GOLD | FUND | Tarih: YYYY-MM-DD
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Dosya Yükle</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <Button type="submit" disabled={!file || loading}>
              {loading ? "İmport ediliyor..." : "İmport Et"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.errors.length ? "border-orange-300" : "border-green-300"}>
          <CardContent className="pt-4">
            <p className="font-medium">{result.imported} işlem başarıyla eklendi.</p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-destructive font-medium">Hatalar:</p>
                <ul className="text-xs text-destructive space-y-1 mt-1">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
