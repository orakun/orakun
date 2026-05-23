export type AssetType = "STOCK" | "CURRENCY" | "GOLD" | "FUND";

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  STOCK: "HİSSE",
  CURRENCY: "DÖVİZ",
  GOLD: "ALTIN",
  FUND: "FON",
};

export interface PortfolioPosition {
  assetId: number;
  symbol: string;
  displayName: string;
  type: string;
  quantity: number;
  avgCostTry: number;
  totalCostTry: number;
  currentPriceTry: number;
  currentValueTry: number;
  pnlTry: number;
  pnlPct: number;
  realReturnPct: number;
}

export interface AllocationSlice {
  name: string;
  valueTry: number;
  pct: number;
}

export interface PortfolioSummary {
  totalValueTry: number;
  totalCostTry: number;
  totalPnlTry: number;
  totalPnlPct: number;
  totalRealReturnPct: number;
  positions: PortfolioPosition[];
  byAssetAllocation: AllocationSlice[];
  byAccountAllocation: AllocationSlice[];
}

export interface ScenarioTimeSeries {
  date: string;
  actual: number;
  hypothetical: number;
}

export interface ScenarioResult {
  transactionId: number;
  originalAsset: string;
  alternativeAsset: string;
  alternativeAssetId: number;
  investmentDate: string;
  investmentAmountTry: number;
  actualCurrentValue: number;
  actualNominalReturn: number;
  actualRealReturn: number;
  hypotheticalCurrentValue: number;
  hypotheticalNominalReturn: number;
  hypotheticalRealReturn: number;
  timeSeries: ScenarioTimeSeries[];
}

export interface TransactionWithRelations {
  id: number;
  transactionDate: string;
  quantity: string;
  unitPriceTry: string;
  totalTry: string;
  notes: string | null;
  account: { id: number; name: string };
  asset: { id: number; symbol: string; displayName: string; type: string };
}
