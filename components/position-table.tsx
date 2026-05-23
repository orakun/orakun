"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatTRY, formatPercent, formatNumber } from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/lib/types";
import type { PortfolioPosition } from "@/lib/types";

export default function PositionTable({ positions }: { positions: PortfolioPosition[] }) {
  if (!positions.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">Henüz işlem girilmedi.</p>;
  }
  return (
    <div className="rounded-xl border bg-card">
      <h3 className="font-semibold p-4 pb-0 text-sm">Pozisyonlar</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Varlık</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead className="text-right">Adet</TableHead>
            <TableHead className="text-right">Ort. Maliyet</TableHead>
            <TableHead className="text-right">Güncel Fiyat</TableHead>
            <TableHead className="text-right">Güncel Değer</TableHead>
            <TableHead className="text-right">K/Z</TableHead>
            <TableHead className="text-right">K/Z %</TableHead>
            <TableHead className="text-right">Reel %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((p) => {
            const pnlColor = p.pnlTry >= 0 ? "text-green-600" : "text-red-600";
            return (
              <TableRow key={p.assetId}>
                <TableCell className="font-medium">
                  <div>{p.symbol}</div>
                  <div className="text-xs text-muted-foreground">{p.displayName}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {ASSET_TYPE_LABELS[p.type as keyof typeof ASSET_TYPE_LABELS] ?? p.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatNumber(p.quantity)}</TableCell>
                <TableCell className="text-right">{formatTRY(p.avgCostTry)}</TableCell>
                <TableCell className="text-right">
                  {p.currentPriceTry > 0 ? formatTRY(p.currentPriceTry) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-right">{formatTRY(p.currentValueTry)}</TableCell>
                <TableCell className={`text-right ${pnlColor}`}>{formatTRY(p.pnlTry)}</TableCell>
                <TableCell className={`text-right ${pnlColor}`}>{formatPercent(p.pnlPct)}</TableCell>
                <TableCell className={`text-right ${p.realReturnPct >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatPercent(p.realReturnPct)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
