import { useState, useEffect } from "react";
import Card from "../../components/common/Card.jsx";
import Badge from "../../components/common/Badge.jsx";
import { formatRupee } from "../../lib/format.js";
import { api } from "../../lib/api.js";

const STATE_FILTERS = [
  "ALL",
  "HUMAN_APPROVAL_REQUIRED",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFICATION",
  "PAID",
  "POLICY_REJECTED",
  "REJECTED",
];

export default function TransactionExplorer({ onSelectTransaction }) {
  const [transactions, setTransactions] = useState([]);
  const [selectedState, setSelectedState] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [selectedState]);

  function fetchTransactions() {
    setIsLoading(true);
    const query = selectedState !== "ALL" ? `?state=${selectedState}` : "";
    api
      .get(`/transactions${query}`)
      .then((res) => setTransactions(res.data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  const filtered = transactions.filter((t) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    const idMatch = String(t._id).toLowerCase().includes(term);
    const prodMatch = t.productId?.name?.toLowerCase().includes(term);
    const merchantMatch = t.merchantId?.name?.toLowerCase().includes(term);
    return idMatch || prodMatch || merchantMatch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Agent<span className="brand-pay">Pay</span> Transaction Explorer
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Inspect all agent-mediated orders, policy governance evaluations, and escrow settlement states.
        </p>
      </div>

      <Card className="space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-4">
          {/* Search Input */}
          <div className="w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search TXN ID, Product, or Merchant..."
              className="w-full px-3.5 py-2 rounded-xl border border-surface-border bg-surface text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* State Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-surface p-1 rounded-xl border border-surface-border">
            {STATE_FILTERS.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedState(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedState === st
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-ink-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        {isLoading ? (
          <p className="text-xs text-ink-400 py-6 italic text-center">Loading transactions catalog...</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-ink-400 py-6 italic text-center">No transactions match current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-ink-400 uppercase text-[10px] font-mono bg-surface">
                  <th className="py-2.5 px-3">TXN ID</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Merchant</th>
                  <th className="py-2.5 px-3">Payable Amount</th>
                  <th className="py-2.5 px-3">Risk Assessment</th>
                  <th className="py-2.5 px-3">Current State</th>
                  <th className="py-2.5 px-3 text-right">Drill-Down Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map((txn) => (
                  <tr key={txn._id} className="hover:bg-surface-border/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      #{String(txn._id).slice(-8).toUpperCase()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {txn.productId?.name || "B2B Product"}
                    </td>
                    <td className="py-3 px-3 text-ink-700">
                      {txn.merchantId?.name || "Verified Merchant"}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-brand-500">
                      {formatRupee(txn.amountInPaise)}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          txn.riskLevel === "HIGH"
                            ? "bg-danger-dark/40 text-danger border border-danger/30"
                            : "bg-success-dark/40 text-success border border-success/30"
                        }`}
                      >
                        {txn.riskLevel || "LOW"} ({txn.riskScore || 0}/100)
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge status={txn.state}>{txn.state}</Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectTransaction && onSelectTransaction(txn._id)}
                        className="px-3 py-1 bg-surface-alt border border-surface-border text-brand-500 font-semibold rounded-lg hover:bg-surface-border hover:text-white text-xs transition-all shadow-sm"
                      >
                        Inspect Detail →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
