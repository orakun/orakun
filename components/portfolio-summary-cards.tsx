"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTRY, formatPercent } from "@/lib/format";
import type { PortfolioSummary } from "@/lib/types";

export default function PortfolioSummaryCards({ summary }: { summary: PortfolioSummary }) {
  const pnlColor = summary.totalPnlTry >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground">Toplam Değer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatTRY(summary.totalValueTry)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground">Toplam Maliyet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatTRY(summary.totalCostTry)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground">Kâr / Zarar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${pnlColor}`}>{formatTRY(summary.totalPnlTry)}</p>
          <p className={`text-sm ${pnlColor}`}>{formatPercent(summary.totalPnlPct)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-muted-foreground">Reel Getiri (TÜFE)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${summary.totalRealReturnPct >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatPercent(summary.totalRealReturnPct)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
