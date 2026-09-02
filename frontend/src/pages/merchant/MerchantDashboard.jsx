import { useState, useEffect } from "react";
import Card from "../../components/common/Card.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import Badge from "../../components/common/Badge.jsx";
import ApprovalQueue from "../../components/approval/ApprovalQueue.jsx";
import { formatRupee } from "../../lib/format.js";
import { api } from "../../lib/api.js";

export default function MerchantDashboard({ onSelectTransaction }) {
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  function fetchData() {
    setIsLoading(true);
    Promise.all([
      api.get("/merchants/all/analytics"),
      api.get("/transactions?limit=10"),
    ])
      .then(([analyticsRes, txnsRes]) => {
        setAnalytics(analyticsRes.data);
        setTransactions(txnsRes.data || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Merchant Operations & Governance Dashboard</h1>
          <p className="text-sm text-ink-400 mt-1">Real-time revenue metrics, state distribution, and pending human governance queue.</p>
        </div>
        <button
          onClick={fetchData}
          className="text-xs text-brand-500 font-semibold border border-surface-border bg-surface-alt px-3 py-1.5 rounded-xl hover:bg-surface-border hover:text-white shadow-sm transition-all"
        >
          🔄 Refresh Analytics
        </button>
      </div>

      {/* 1. StatCards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Gross Revenue"
          value={formatRupee(analytics?.totalRevenuePaise || 0)}
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
          value={formatRupee(analytics?.avgOrderValuePaise || 0)}
          subtitle="Per Successful Checkout"
        />
        <StatCard
          title="Pending Approvals"
          value={analytics?.pendingApprovalCount || 0}
          subtitle="Requires Human Sign-off"
          highlight={analytics?.pendingApprovalCount > 0}
        />
      </div>

      {/* 2. Middle 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Transaction State Breakdown */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-bold text-white">Transaction Lifecycle Distribution</h3>
              <span className="text-xs text-ink-400">Real-time DB Counts</span>
            </div>

            {/* State Distribution Progress Bars */}
            <div className="space-y-3">
              {Object.entries(analytics?.stateBreakdown || {}).map(([state, count]) => {
                const pct = analytics?.transactionCount ? Math.round((count / analytics.transactionCount) * 100) : 0;
                return (
                  <div key={state} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-ink-700 flex items-center space-x-2">
                        <Badge status={state}>{state}</Badge>
                      </span>
                      <span className="font-mono text-white">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-surface-border">
                      <div
                        className="bg-brand-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column (6 cols): Approval Queue Widget */}
        <div className="lg:col-span-6">
          <ApprovalQueue />
        </div>
      </div>

      {/* 3. Bottom Section: Recent Transactions List */}
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
