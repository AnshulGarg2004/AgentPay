import { useState, useEffect } from "react";
import Card from "../../components/common/Card.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import Badge from "../../components/common/Badge.jsx";
import ApprovalQueue from "../../components/approval/ApprovalQueue.jsx";
import RevenueChart from "../../components/charts/RevenueChart.jsx";
import ConversionChart from "../../components/charts/ConversionChart.jsx";
import { useMerchantAnalytics } from "../../hooks/useMerchantAnalytics.js";
import { formatRupee } from "../../lib/format.js";
import { api } from "../../lib/api.js";

export default function MerchantDashboard({ onSelectTransaction }) {
  const { analytics, isLoading: isAnalyticsLoading, refetch: refetchAnalytics } = useMerchantAnalytics("all");
  const [transactions, setTransactions] = useState([]);
  const [isTxnsLoading, setIsTxnsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  function fetchTransactions() {
    setIsTxnsLoading(true);
    return api
      .get("/transactions?limit=10")
      .then((txnsRes) => {
        setTransactions(txnsRes.data || []);
      })
      .catch(console.error)
      .finally(() => setIsTxnsLoading(false));
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchAnalytics(), fetchTransactions()]);
    } catch (err) {
      console.error("Failed to refresh analytics:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }

  const isLoadingNow = isRefreshing || isAnalyticsLoading;

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Merchant Operations & Governance Dashboard</h1>
          <p className="text-sm text-ink-400 mt-1">Real-time revenue metrics, state distribution, and pending human governance queue.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoadingNow}
          className="text-xs text-brand-400 font-semibold border border-surface-border bg-surface-alt px-3.5 py-1.5 rounded-xl hover:bg-surface-border hover:text-white shadow-sm transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          <span className={`inline-block transition-transform ${isLoadingNow ? "animate-spin" : ""}`}>🔄</span>
          <span>{isLoadingNow ? "Refreshing..." : "Refresh Analytics"}</span>
        </button>
      </div>

      {/* 1. StatCards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Gross Revenue"
          value={formatRupee(analytics?.totalRevenueInPaise || analytics?.totalRevenuePaise || 0)}
          subtitle="Settled & Paid via Escrow"
        />
        <StatCard
          title="Total Transactions"
          value={analytics?.transactionCount || 0}
          subtitle="Agent Negotiations & Quotes"
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
        <StatCard
          title="Pending Approvals"
          value={analytics?.pendingApprovalCount || 0}
          subtitle="Requires Human Sign-off"
          highlight={analytics?.pendingApprovalCount > 0}
        />
      </div>

      {/* 2. Middle Row: Revenue Velocity Chart alongside Approval Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Revenue Velocity Chart */}
        <div className="lg:col-span-6">
          <RevenueChart data={analytics?.revenueByDay || []} />
        </div>

        {/* Right Column (6 cols): Approval Queue Widget */}
        <div className="lg:col-span-6">
          <ApprovalQueue />
        </div>
      </div>

      {/* 3. Conversion Funnel Chart */}
      <div>
        <ConversionChart data={analytics?.conversionFunnel || []} />
      </div>

      {/* 4. Bottom Section: Recent Transactions List */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h3 className="text-base font-bold text-white">Recent Merchant Transactions</h3>
          <span className="text-xs text-ink-400">Showing last 10 transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-border text-ink-400 uppercase text-[10px] font-mono">
                <th className="py-2 px-3">TXN ID</th>
                <th className="py-2 px-3">Product</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Risk Level</th>
                <th className="py-2 px-3">State</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {transactions.map((txn) => (
                <tr key={txn._id} className="hover:bg-surface-border/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-white font-bold">
                    #{String(txn._id).slice(-8).toUpperCase()}
                  </td>
                  <td className="py-2.5 px-3 text-white font-semibold">
                    {txn.productId?.name || "B2B Item"}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-white">
                    {formatRupee(txn.amountInPaise)}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      txn.riskLevel === "HIGH" ? "bg-danger-dark/40 text-danger border border-danger/30" : "bg-success-dark/40 text-success border border-success/30"
                    }`}>
                      {txn.riskLevel || "LOW"} ({txn.riskScore || 0})
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge status={txn.state}>{txn.state}</Badge>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {onSelectTransaction && (
                      <button
                        onClick={() => onSelectTransaction(txn._id)}
                        className="text-xs text-brand-500 hover:text-brand-400 font-semibold"
                      >
                        Inspect →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
