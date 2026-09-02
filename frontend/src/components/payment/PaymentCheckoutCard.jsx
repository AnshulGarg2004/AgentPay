import { useState, useEffect } from "react";
import Card from "../common/Card.jsx";
import Button from "../common/Button.jsx";
import Badge from "../common/Badge.jsx";
import StateTimeline from "../common/StateTimeline.jsx";
import { formatRupee } from "../../lib/format.js";
import { api } from "../../lib/api.js";

export default function PaymentCheckoutCard({ transaction, onStateUpdated }) {
  const [txn, setTxn] = useState(transaction);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);

  // Generate deterministic idempotency key for this transaction session
  const [idempotencyKey] = useState(`idemp_key_${transaction._id}_${Date.now()}`);

  useEffect(() => {
    setTxn(transaction);
  }, [transaction]);

  async function refreshTxn() {
    try {
      const res = await api.get(`/payments/${txn._id}/status`);
      setTxn(res.data.transaction);
      if (onStateUpdated) onStateUpdated(res.data.transaction);
    } catch (err) {
      console.error("Refresh txn status error:", err);
    }
  }

  async function handleCreateOrder() {
    setIsLoading(true);
    try {
      const res = await api.post("/payments/orders", { transactionId: txn._id });
      setTxn(res.data.transaction);
      setLastResponse(res.data);
      if (onStateUpdated) onStateUpdated(res.data.transaction);
    } catch (err) {
      console.error("Create order error:", err);
      alert("Failed to create order: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleInitiatePayment(simulateTimeout = false) {
    setIsLoading(true);
    try {
      const res = await api.post("/payments/initiate", {
        transactionId: txn._id,
        idempotencyKey,
        simulateTimeout,
      });

      setLastResponse(res.data);
      await refreshTxn();
    } catch (err) {
      console.error("Initiate payment error:", err);
      alert("Payment initiation error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFireSimulatedWebhook() {
    setIsLoading(true);
    try {
      const res = await api.post("/webhooks/simulate-captured", {
        transactionId: txn._id,
      });
      setLastResponse(res.data);
      await refreshTxn();
    } catch (err) {
      console.error("Simulated webhook error:", err);
      alert("Webhook simulation error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  }

  const product = txn.productId || {};
  const merchant = txn.merchantId || {};

  return (
    <div className="space-y-6">
      {/* State Machine Visualization Timeline */}
      <StateTimeline currentState={txn.state} />

      <Card className="space-y-6 border-2 border-brand-500/20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-ink-400">TXN #{String(txn._id).slice(-8).toUpperCase()}</span>
              <Badge status={txn.state}>{txn.state}</Badge>
            </div>
            <h2 className="text-lg font-bold text-ink-900 mt-1">
              Autonomous Escrow Payment Settlement
            </h2>
            <p className="text-xs text-ink-400">Item: {product.name || "B2B Product"} | Merchant: {merchant.name || "Verified Merchant"}</p>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase text-ink-400 font-medium block">Total Payable Amount</span>
            <span className="text-2xl font-bold font-mono text-brand-600">{formatRupee(txn.amountInPaise)}</span>
          </div>
        </div>

        {/* Idempotency Key Banner */}
        <div className="p-3 bg-surface-alt border border-surface-border rounded-xl flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-ink-400 block text-[10px] uppercase font-sans">Active Idempotency Guarantee Key</span>
            <span className="text-brand-700 font-semibold">{idempotencyKey}</span>
          </div>
          <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200">
            MongoDB Unique Index Dedupe Active
          </span>
        </div>

        {/* Action Panel based on state */}
        <div className="space-y-4">
          {txn.state === "PAYMENT_PENDING" && (
            <div className="p-4 bg-brand-50/50 border border-brand-100 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-ink-900">Step 1: Create Razorpay Escrow Order</h3>
              <p className="text-xs text-ink-700">
                Initiate escrow transaction to generate Razorpay Order ID.
              </p>
              <Button variant="primary" disabled={isLoading} onClick={handleCreateOrder}>
                {isLoading ? "Creating Order..." : "🚀 Create Razorpay Escrow Order"}
              </Button>
            </div>
          )}

          {(txn.state === "PAYMENT_PENDING" || txn.state === "PAYMENT_PROCESSING") && (
            <div className="space-y-4 p-4 bg-surface-alt rounded-2xl border border-surface-border">
              <h3 className="text-sm font-bold text-ink-900">Step 2: Execute Idempotent Escrow Payment</h3>
              <p className="text-xs text-ink-400">
                Test both standard happy path and payment timeout recovery flow.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button variant="primary" disabled={isLoading} onClick={() => handleInitiatePayment(false)}>
                  {isLoading ? "Processing..." : "⚡ Execute Payment (Happy Path)"}
                </Button>

                <Button variant="secondary" className="border-warning text-warning-dark hover:bg-warning-light/50" disabled={isLoading} onClick={() => handleInitiatePayment(true)}>
                  ⏱️ Simulate Payment Timeout (Hero Demo Scene 6)
                </Button>
              </div>
            </div>
          )}

          {/* HERO DEMO MOMENT: PAYMENT TIMEOUT RECOVERY IN PAYMENT_VERIFICATION */}
          {txn.state === "PAYMENT_VERIFICATION" && (
            <div className="p-5 bg-warning-light/80 border-2 border-warning rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-warning text-white flex items-center justify-center font-bold text-xl shadow-sm">
                  ⏱️
                </div>
                <div>
                  <h3 className="text-base font-bold text-warning-dark">
                    HERO DEMO: Payment Timeout Held in PAYMENT_VERIFICATION
                  </h3>
                  <p className="text-xs text-warning-dark/90 mt-0.5">
                    AgentPay protocol locked state in <code>PAYMENT_VERIFICATION</code> to prevent double-charging. Awaiting Razorpay Webhook.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-warning/30 text-xs text-ink-700 font-mono space-y-1">
                <div>• Idempotency Key: {idempotencyKey}</div>
                <div>• Retry attempt blocked: Will return cached IN_PROGRESS response instead of re-charging Razorpay</div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-warning/30">
                <span className="text-xs font-semibold text-warning-dark">
                  Simulate Webhook Delivery to Complete Escrow Settlement:
                </span>
                <Button variant="primary" disabled={isLoading} onClick={handleFireSimulatedWebhook}>
                  {isLoading ? "Delivering Webhook..." : "📡 Fire Razorpay Webhook (payment.captured)"}
                </Button>
              </div>
            </div>
          )}

          {txn.state === "PAID" && (
            <div className="p-5 bg-success-light border-2 border-success/40 rounded-2xl text-center space-y-2 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-success text-white flex items-center justify-center text-2xl font-bold mx-auto">
                ✓
              </div>
              <h3 className="text-lg font-bold text-success-dark">🎉 Transaction Paid & Settled via AgentPay Escrow</h3>
              <p className="text-xs text-success-dark/90 font-mono">
                Razorpay Payment ID: {txn.razorpayPaymentId || "pay_verified"}
              </p>
              <p className="text-[11px] text-success-dark/70">
                Payment verified cleanly via Razorpay webhook. Inventory locked and fulfillment initiated.
              </p>
            </div>
          )}
        </div>

        {/* Debug Log Output Box */}
        {lastResponse && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-ink-400 uppercase">Protocol Response Log</span>
            <pre className="p-3 bg-ink-900 text-green-400 text-xs font-mono rounded-xl overflow-x-auto max-h-40">
              {JSON.stringify(lastResponse, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}
