import { useState, useEffect } from "react";
import StateTimeline from "../../components/common/StateTimeline.jsx";
import PaymentCheckoutCard from "../../components/payment/PaymentCheckoutCard.jsx";
import AuditTrail from "../../components/audit/AuditTrail.jsx";
import LiveActivityFeed from "../../components/audit/LiveActivityFeed.jsx";
import Card from "../../components/common/Card.jsx";
import Badge from "../../components/common/Badge.jsx";
import RiskGauge from "../../components/common/RiskGauge.jsx";
import { api } from "../../lib/api.js";

export default function TransactionDetailPage({ transactionId }) {
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  function fetchTransaction() {
    setIsLoading(true);
    api
      .get(`/payments/${transactionId}/status`)
      .then((res) => setTransaction(res.data.transaction))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  if (isLoading) {
    return (
      <Card className="py-8 text-center">
        <p className="text-xs text-ink-400 italic">Loading transaction detail view...</p>
      </Card>
    );
  }

  if (!transaction) {
    return (
      <Card className="py-8 text-center">
        <p className="text-xs text-ink-400">Transaction not found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Gauge & Metadata Header Banner */}
      <Card hasGradientAccent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-ink-400">TXN #{String(transaction._id).slice(-8).toUpperCase()}</span>
            <Badge status={transaction.state}>{transaction.state}</Badge>
            <Badge status={transaction.riskLevel === "HIGH" ? "FAILED" : "PAID"}>
              Risk Score: {transaction.riskScore || 15}/100
            </Badge>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Autonomous Escrow Transaction Inspector</h2>
          <p className="text-xs text-ink-400">Inspecting policy engine evaluations, risk scores & escrow settlement logs</p>
        </div>

        {/* Risk Gauge Component alongside Badge */}
        <div className="flex items-center space-x-3 bg-surface p-2 rounded-xl border border-surface-border">
          <RiskGauge score={transaction.riskScore || 15} level={transaction.riskLevel || "LOW"} size={72} />
        </div>
      </Card>

      {/* 1. Full-Width State Machine Timeline Top Bar */}
      <StateTimeline currentState={transaction.state} />

      {/* 2. Two-Column Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Escrow & Payment Controls */}
        <div className="lg:col-span-7 space-y-6">
          <PaymentCheckoutCard
            transaction={transaction}
            onStateUpdated={(updated) => setTransaction(updated)}
          />
        </div>

        {/* Right Column (5 cols): Audit Trail & Real-time Live Activity Feed */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Activity Feed Socket.IO Stream */}
          <LiveActivityFeed transactionId={transaction._id} />

          {/* Persisted Governance Audit Trail */}
          <AuditTrail transactionId={transaction._id} />
        </div>
      </div>
    </div>
  );
}
