import { computePortfolioSummary } from "@/lib/calculations";
import PortfolioSummaryCards from "@/components/portfolio-summary-cards";
import AllocationChart from "@/components/allocation-chart";
import PositionTable from "@/components/position-table";

export const revalidate = 300;

export default async function DashboardPage() {
  const summary = await computePortfolioSummary();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gösterge Paneli</h1>
      <PortfolioSummaryCards summary={summary} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AllocationChart data={summary.byAssetAllocation} title="Varlık Dağılımı" />
        <AllocationChart data={summary.byAccountAllocation} title="Hesap Dağılımı" />
      </div>
      <PositionTable positions={summary.positions} />
    </div>
  );
}
