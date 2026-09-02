import { useState, useEffect } from "react";
import StateTimeline from "../../components/common/StateTimeline.jsx";
import PaymentCheckoutCard from "../../components/payment/PaymentCheckoutCard.jsx";
import AuditTrail from "../../components/audit/AuditTrail.jsx";
import LiveActivityFeed from "../../components/audit/LiveActivityFeed.jsx";
import Card from "../../components/common/Card.jsx";
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
