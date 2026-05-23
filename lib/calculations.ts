import { prisma, toNum } from "./prisma";
import type { PortfolioPosition, PortfolioSummary, ScenarioResult } from "./types";

export async function computePortfolioSummary(): Promise<PortfolioSummary> {
  const transactions = await prisma.transaction.findMany({
    include: { asset: true, account: true },
  });

  if (transactions.length === 0) {
    return {
      totalValueTry: 0,
      totalCostTry: 0,
      totalPnlTry: 0,
      totalPnlPct: 0,
      totalRealReturnPct: 0,
      positions: [],
      byAssetAllocation: [],
      byAccountAllocation: [],
    };
  }

  // Latest price per asset (single query)
  const latestPrices = await prisma.$queryRaw<
    { assetId: number; priceTry: string }[]
  >`
    SELECT ph.assetId, ph.priceTry
    FROM PriceHistory ph
    INNER JOIN (
      SELECT assetId, MAX(date) AS maxDate
      FROM PriceHistory
      GROUP BY assetId
    ) latest ON ph.assetId = latest.assetId AND ph.date = latest.maxDate
  `;

  const priceMap = new Map(
    latestPrices.map((p) => [Number(p.assetId), parseFloat(p.priceTry)])
  );

  // CPI data — fetch all at once
  const cpiRows = await prisma.inflationMonthly.findMany({
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });
  const cpiMap = new Map(
    cpiRows.map((r) => [`${r.year}-${String(r.month).padStart(2, "0")}`, toNum(r.cpiIndex)])
  );
  const currentCPI = cpiRows.length > 0 ? toNum(cpiRows[cpiRows.length - 1].cpiIndex) : 0;

  // Group transactions by asset
  const byAsset = new Map<number, typeof transactions>();
  for (const tx of transactions) {
    const list = byAsset.get(tx.assetId) ?? [];
    list.push(tx);
    byAsset.set(tx.assetId, list);
  }

  const positions: PortfolioPosition[] = [];

  for (const [assetId, txs] of Array.from(byAsset.entries())) {
    const totalQty = txs.reduce((s: number, tx) => s + toNum(tx.quantity), 0);
    const totalCost = txs.reduce((s: number, tx) => s + toNum(tx.totalTry), 0);
    const avgCost = totalCost / totalQty;
    const currentPrice = priceMap.get(assetId) ?? 0;
    const currentValue = totalQty * currentPrice;
    const pnlTry = currentValue - totalCost;
    const pnlPct = totalCost > 0 ? pnlTry / totalCost : 0;

    // Weighted purchase CPI
    let weightedCPISum = 0;
    let costSum = 0;
    for (const tx of txs) {
      const d = new Date(tx.transactionDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const cpi = cpiMap.get(key) ?? 100;
      const cost = toNum(tx.totalTry);
      weightedCPISum += cpi * cost;
      costSum += cost;
    }
    const weightedCPI = costSum > 0 ? weightedCPISum / costSum : 100;
    const inflation = currentCPI > 0 && weightedCPI > 0 ? currentCPI / weightedCPI - 1 : 0;
    const realReturn = (1 + pnlPct) / (1 + inflation) - 1;

    positions.push({
      assetId,
      symbol: txs[0].asset.symbol,
      displayName: txs[0].asset.displayName,
      type: txs[0].asset.type,
      quantity: totalQty,
      avgCostTry: avgCost,
      totalCostTry: totalCost,
      currentPriceTry: currentPrice,
      currentValueTry: currentValue,
      pnlTry,
      pnlPct,
      realReturnPct: realReturn,
    });
  }

  const totalValueTry = positions.reduce((s, p) => s + p.currentValueTry, 0);
  const totalCostTry = positions.reduce((s, p) => s + p.totalCostTry, 0);
  const totalPnlTry = totalValueTry - totalCostTry;
  const totalPnlPct = totalCostTry > 0 ? totalPnlTry / totalCostTry : 0;
  const totalRealReturnPct =
    totalCostTry > 0
      ? positions.reduce((s, p) => s + p.realReturnPct * (p.totalCostTry / totalCostTry), 0)
      : 0;

  const byAssetAllocation = positions.map((p) => ({
    name: p.symbol,
    valueTry: p.currentValueTry,
    pct: totalValueTry > 0 ? p.currentValueTry / totalValueTry : 0,
  }));

  // Account allocation
  const byAccountMap = new Map<string, number>();
  for (const tx of transactions) {
    const pos = positions.find((p) => p.assetId === tx.assetId);
    if (!pos || pos.quantity === 0) continue;
    const txShare = toNum(tx.quantity) / pos.quantity;
    const txValue = txShare * pos.currentValueTry;
    byAccountMap.set(tx.account.name, (byAccountMap.get(tx.account.name) ?? 0) + txValue);
  }
  const byAccountAllocation = Array.from(byAccountMap.entries()).map(([name, valueTry]) => ({
    name,
    valueTry,
    pct: totalValueTry > 0 ? valueTry / totalValueTry : 0,
  }));

  return {
    totalValueTry,
    totalCostTry,
    totalPnlTry,
    totalPnlPct,
    totalRealReturnPct,
    positions,
    byAssetAllocation,
    byAccountAllocation,
  };
}

export async function computeScenario(
  transactionId: number,
  alternativeAssetIds: number[]
): Promise<ScenarioResult[]> {
  const tx = await prisma.transaction.findUniqueOrThrow({
    where: { id: transactionId },
    include: { asset: true },
  });

  const investmentDate = tx.transactionDate;
  const investmentTRY = toNum(tx.totalTry);
  const origUnits = toNum(tx.quantity);

  const cpiRows = await prisma.inflationMonthly.findMany({
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });
  const cpiMap = new Map(
    cpiRows.map((r) => [`${r.year}-${String(r.month).padStart(2, "0")}`, toNum(r.cpiIndex)])
  );
  const currentCPI = cpiRows.length > 0 ? toNum(cpiRows[cpiRows.length - 1].cpiIndex) : 0;

  const purchaseDateKey = `${investmentDate.getFullYear()}-${String(investmentDate.getMonth() + 1).padStart(2, "0")}`;
  const purchaseCPI = cpiMap.get(purchaseDateKey) ?? 100;
  const inflation = currentCPI > 0 && purchaseCPI > 0 ? currentCPI / purchaseCPI - 1 : 0;

  // Original asset prices
  await nearestPrice(tx.assetId, investmentDate); // used only in timeSeries reference
  const origPriceNow = await prisma.priceHistory.findFirst({
    where: { assetId: tx.assetId },
    orderBy: { date: "desc" },
  });
  const actualCurrentValue = origUnits * toNum(origPriceNow?.priceTry);
  const actualNominal = investmentTRY > 0 ? actualCurrentValue / investmentTRY - 1 : 0;
  const actualReal = (1 + actualNominal) / (1 + inflation) - 1;

  const results: ScenarioResult[] = [];

  for (const altId of alternativeAssetIds) {
    const altAsset = await prisma.asset.findUniqueOrThrow({ where: { id: altId } });
    const altPriceOnDate = await nearestPrice(altId, investmentDate);
    const altPriceNow = await prisma.priceHistory.findFirst({
      where: { assetId: altId },
      orderBy: { date: "desc" },
    });

    const altUnits =
      toNum(altPriceOnDate?.priceTry) > 0
        ? investmentTRY / toNum(altPriceOnDate?.priceTry)
        : 0;
    const hypotheticalCurrentValue = altUnits * toNum(altPriceNow?.priceTry);
    const hypoNominal = investmentTRY > 0 ? hypotheticalCurrentValue / investmentTRY - 1 : 0;
    const hypoReal = (1 + hypoNominal) / (1 + inflation) - 1;

    const timeSeries = await buildTimeSeries(
      tx.assetId,
      altId,
      investmentDate,
      new Date(),
      origUnits,
      altUnits
    );

    results.push({
      transactionId,
      originalAsset: tx.asset.symbol,
      alternativeAsset: altAsset.symbol,
      alternativeAssetId: altId,
      investmentDate: investmentDate.toISOString(),
      investmentAmountTry: investmentTRY,
      actualCurrentValue,
      actualNominalReturn: actualNominal,
      actualRealReturn: actualReal,
      hypotheticalCurrentValue,
      hypotheticalNominalReturn: hypoNominal,
      hypotheticalRealReturn: hypoReal,
      timeSeries,
    });
  }

  return results;
}

async function nearestPrice(assetId: number, date: Date) {
  const windowStart = new Date(date.getTime() - 10 * 24 * 60 * 60 * 1000);
  return prisma.priceHistory.findFirst({
    where: { assetId, date: { gte: windowStart, lte: date } },
    orderBy: { date: "desc" },
  });
}

async function buildTimeSeries(
  origAssetId: number,
  altAssetId: number,
  fromDate: Date,
  toDate: Date,
  origUnits: number,
  altUnits: number
) {
  const origPrices = await prisma.priceHistory.findMany({
    where: { assetId: origAssetId, date: { gte: fromDate, lte: toDate } },
    orderBy: { date: "asc" },
    select: { date: true, priceTry: true },
  });
  const altPrices = await prisma.priceHistory.findMany({
    where: { assetId: altAssetId, date: { gte: fromDate, lte: toDate } },
    orderBy: { date: "asc" },
    select: { date: true, priceTry: true },
  });

  const downsample = (prices: { date: Date; priceTry: unknown }[]) => {
    const seen = new Set<string>();
    const result: { ym: string; price: number }[] = [];
    for (const p of prices) {
      const ym = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, "0")}`;
      if (!seen.has(ym)) {
        seen.add(ym);
        result.push({ ym, price: toNum(p.priceTry) });
      }
    }
    return result;
  };

  const origMonthly = downsample(origPrices);
  const altMonthly = downsample(altPrices);
  const origMap = new Map(origMonthly.map((p) => [p.ym, p.price]));
  const altMap = new Map(altMonthly.map((p) => [p.ym, p.price]));

  const allYms = Array.from(new Set([...Array.from(origMap.keys()), ...Array.from(altMap.keys())])).sort();

  return allYms.map((ym) => ({
    date: ym,
    actual: origUnits * (origMap.get(ym) ?? 0),
    hypothetical: altUnits * (altMap.get(ym) ?? 0),
  }));
}
