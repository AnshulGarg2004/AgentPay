import StatCard from "../../components/common/StatCard.jsx";
import RevenueChart from "../../components/charts/RevenueChart.jsx";
import ConversionChart from "../../components/charts/ConversionChart.jsx";
import { useMerchantAnalytics } from "../../hooks/useMerchantAnalytics.js";
import { formatRupee } from "../../lib/format.js";

export default function MerchantAnalytics() {
  const { analytics, isLoading, refetch } = useMerchantAnalytics("all");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Merchant Protocol Analytics</h1>
          <p className="text-sm text-ink-400 mt-1">
            Deep aggregate analysis of revenue velocities, transaction conversions, and agent efficiency.
          </p>
        </div>
        <button
          onClick={refetch}
          className="text-xs text-brand-500 font-semibold border border-surface-border bg-surface-alt px-3 py-1.5 rounded-xl hover:bg-surface-border hover:text-white shadow-sm transition-all"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Gross Revenue"
          value={formatRupee(analytics?.totalRevenueInPaise || analytics?.totalRevenuePaise || 0)}
          subtitle="Settled & Paid via Escrow"
        />
        <StatCard
          title="Total Transactions"
          value={analytics?.transactionCount || 0}
          subtitle="Agent Negotiations"
        />
        <StatCard
          title="Conversion Rate"
          value={`${analytics?.conversionRate || 0}%`}
          subtitle={`${analytics?.paidCount || 0} Paid Orders`}
        />
        <StatCard
          title="Average Order Value"
          value={formatRupee(analytics?.avgOrderValueInPaise || analytics?.avgOrderValuePaise || 0)}
          subtitle="Per Successful Checkout"
        />
      </div>

      {/* Revenue Velocity Chart */}
      <div>
        <RevenueChart data={analytics?.revenueByDay || []} />
      </div>

      {/* Conversion Funnel Chart */}
      <div>
        <ConversionChart data={analytics?.conversionFunnel || []} />
      </div>
    </div>
  );
}
