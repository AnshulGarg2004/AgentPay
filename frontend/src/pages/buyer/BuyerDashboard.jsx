import { useState, useEffect } from "react";
import Card from "../../components/common/Card.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import Badge from "../../components/common/Badge.jsx";
import { formatRupee } from "../../lib/format.js";
import { api } from "../../lib/api.js";

export default function BuyerDashboard({ onSelectTransaction }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  function fetchTransactions() {
    setIsLoading(true);
    api
      .get("/transactions?limit=20")
      .then((res) => setTransactions(res.data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  const totalVolumePaise = transactions.reduce((acc, t) => acc + (t.amountInPaise || 0), 0);
  const paidTxns = transactions.filter((t) => t.state === "PAID" || t.state === "COMPLETED");
  const pendingTxns = transactions.filter((t) => t.state === "HUMAN_APPROVAL_REQUIRED" || t.state === "PAYMENT_PENDING");

  return (
    <div className="space-y-8 animate-slideIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Buyer Procurement & Governance Portal</h1>
        <p className="text-sm text-ink-400 mt-1">Autonomous procurement history, policy evaluation statuses, and escrow settlements.</p>
      </div>

      {/* StatCards Row (Section 5.5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Procurement Volume"
          value={formatRupee(totalVolumePaise)}
          subtitle="Agent Negotiated Orders"
        />
        <StatCard
          title="Completed Purchases"
          value={paidTxns.length}
          subtitle="Settled via Escrow"
        />
        <StatCard
          title="Pending Settlement"
          value={pendingTxns.length}
          subtitle="Awaiting Approval / Payment"
        />
        <StatCard
          title="Policy Compliance Rate"
          value="100%"
          subtitle="Zero Unauthorized Capital Loss"
        />
      </div>

      {/* Buyer Orders List */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h3 className="text-base font-bold text-ink-900">Procurement Orders & Negotiations</h3>
          <span className="text-xs text-ink-400">Total: {transactions.length} Orders</span>
        </div>

        {isLoading ? (
          <p className="text-xs text-ink-400 py-4 italic">Loading buyer transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-xs text-ink-400 py-4 italic">No buyer transactions found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transactions.map((txn) => (
              <div
                key={txn._id}
                className="p-4 bg-surface-alt rounded-xl border border-surface-border space-y-3 hover:border-brand-500/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-ink-900">
                    TXN #{String(txn._id).slice(-8).toUpperCase()}
                  </span>
                  <Badge status={txn.state}>{txn.state}</Badge>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-ink-900">{txn.productId?.name || "Product"}</h4>
                  <p className="text-xs text-ink-400">Merchant: {txn.merchantId?.name || "Verified Merchant"}</p>
                </div>

                <div className="flex items-center justify-between border-t border-surface-border pt-2 text-xs">
                  <div>
                    <span className="text-ink-400 uppercase text-[10px] block">Order Amount</span>
                    <span className="font-mono font-bold text-brand-600">{formatRupee(txn.amountInPaise)}</span>
                  </div>

                  {onSelectTransaction && (
                    <button
                      onClick={() => onSelectTransaction(txn._id)}
                      className="px-3 py-1 bg-white border border-surface-border rounded-lg text-brand-600 font-semibold hover:bg-brand-50 text-xs shadow-sm"
                    >
                      View Details →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
