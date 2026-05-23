"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Account {
  id: number;
  name: string;
  createdAt: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/accounts");
    setAccounts(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (res.ok) {
      setName("");
      load();
    } else {
      const d = await res.json();
      setError(d.error ?? "Hata oluştu");
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Hesaplar</h1>
      <Card>
        <CardHeader><CardTitle className="text-sm">Yeni Hesap Ekle</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="name">Hesap / Broker Adı</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Midas, Garanti BBVA, İş Yatırım..."
              />
            </div>
            <Button type="submit" className="self-end" disabled={loading || !name.trim()}>
              Ekle
            </Button>
          </form>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {accounts.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <span className="font-medium">{a.name}</span>
            <span className="text-xs text-muted-foreground">#{a.id}</span>
          </div>
        ))}
        {!accounts.length && (
          <p className="text-sm text-muted-foreground text-center py-4">Henüz hesap eklenmedi.</p>
        )}
      </div>
    </div>
  );
}
