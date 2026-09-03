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
      return res.data.order;
    } catch (err) {
      console.error("Create order error:", err);
      alert("Failed to create Razorpay Order: " + (err.response?.data?.error || err.message));
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  // Opens REAL Razorpay Standard Checkout Modal (or Test Mode Popup)
  async function handlePayWithRazorpayModal() {
    setIsLoading(true);
    try {
      // 1. Ensure order is created on backend
      let order = null;
      if (!txn.razorpayOrderId) {
        order = await handleCreateOrder();
      } else {
        const orderRes = await api.post("/payments/orders", { transactionId: txn._id });
        order = orderRes.data.order;
      }

      if (!order || !order.id) {
        alert("Unable to generate Razorpay order ID for checkout.");
        setIsLoading(false);
        return;
      }

      // Determine active Razorpay Key ID
      const frontendKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      const backendKey = order.key_id;

      let validKey = "rzp_test_TXFlxgI55rE33Z"; // Default to user test key
      if (frontendKey && frontendKey.startsWith("rzp_") && !frontendKey.includes("xxxxx")) {
        validKey = frontendKey;
      } else if (backendKey && backendKey.startsWith("rzp_") && !backendKey.includes("xxxxx")) {
        validKey = backendKey;
      }

      // 2. Configure Razorpay Standard Modal options
      const options = {
        key: validKey,
        amount: txn.amountInPaise,
        currency: "INR",
        name: "EscrowAI Escrow",
        description: `Escrow Payment for ${txn.productId?.name || "B2B Order"}`,
        prefill: {
          name: "EscrowAI Buyer Agent",
          email: "buyer@escrowai.demo",
          contact: "9876543210",
        },
        theme: {
          color: "#7c5cff",
        },
        handler: async function (response) {
          console.log("Razorpay Checkout Success Response:", response);
          setIsLoading(true);
          try {
            const verifyRes = await api.post("/payments/verify", {
              transactionId: txn._id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id || order.id,
              razorpay_signature: response.razorpay_signature || "simulated_sig",
            });

            setLastResponse(verifyRes.data);
            await refreshTxn();
          } catch (verifyErr) {
            console.error("Payment verification error:", verifyErr);
            alert("Payment signature verification failed: " + (verifyErr.response?.data?.error || verifyErr.message));
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: async function () {
            console.log("Razorpay Checkout modal dismissed by user.");
            setIsLoading(false);
          },
        },
      };

      // Only pass order_id if it's a real order created on Razorpay API servers
      if (order && order.isMock === false && order.id && !order.id.includes("_17")) {
        options.order_id = order.id;
      }

      // 3. Open Razorpay Checkout Modal
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", async function (response) {
          console.error("Razorpay Payment Failed Event:", response.error);
          try {
            const failRes = await api.post("/payments/failed", {
              transactionId: txn._id,
              errorDescription: response.error?.description || "Payment declined at Razorpay Checkout",
              errorReason: response.error?.reason,
            });
            setLastResponse(failRes.data);
            await refreshTxn();
          } catch (err) {
            console.error("Report payment failure error:", err);
          }
        });
        rzp.open();
      } else {
        alert("Razorpay Checkout SDK script not loaded. Check internet connection.");
      }
    } catch (err) {
      console.error("Razorpay modal trigger error:", err);
      alert("Razorpay checkout error: " + (err.response?.data?.error || err.message));
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

      <Card hasGradientAccent className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-ink-400">TXN #{String(txn._id).slice(-8).toUpperCase()}</span>
              <Badge status={txn.state}>{txn.state}</Badge>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Autonomous Escrow Payment Settlement
            </h2>
            <p className="text-xs text-ink-400">Item: {product.name || "B2B Product"} | Merchant: {merchant.name || "Verified Merchant"}</p>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase text-ink-400 font-medium block">Total Payable Amount</span>
            <span className="text-2xl font-bold font-mono text-brand-500">{formatRupee(txn.amountInPaise)}</span>
          </div>
        </div>

        {/* Idempotency Key Banner */}
        <div className="p-3 bg-surface border border-surface-border rounded-xl flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-ink-400 block text-[10px] uppercase font-sans">Active Idempotency Guarantee Key</span>
            <span className="text-brand-500 font-semibold">{idempotencyKey}</span>
          </div>
          <span className="text-[10px] bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded border border-brand-500/30">
            MongoDB Unique Index Dedupe Active
          </span>
        </div>

        {/* Action Panel based on state */}
        <div className="space-y-4">
          {(txn.state === "PAYMENT_PENDING" || txn.state === "PAYMENT_PROCESSING" || txn.state === "RESERVED" || txn.state === "AGREED") && (
            <div className="space-y-4 p-4 bg-surface border border-surface-border rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Execute Razorpay Payment</h3>
                  <p className="text-xs text-ink-400">
                    Pay via official Razorpay Checkout popup (Supports Test Cards, Netbanking & UPI).
                  </p>
                </div>
                {txn.razorpayOrderId && (
                  <span className="text-xs font-mono bg-surface-alt px-2 py-1 rounded border border-surface-border text-brand-500">
                    Order ID: {txn.razorpayOrderId}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="primary" disabled={isLoading} onClick={handlePayWithRazorpayModal} className="shadow-md">
                  {isLoading ? "Opening Razorpay..." : "💳 Pay via Razorpay Checkout Modal"}
                </Button>

                <Button variant="secondary" disabled={isLoading} onClick={() => handleInitiatePayment(false)}>
                  ⚡ Auto-Simulate Successful Payment
                </Button>

                <Button variant="secondary" className="border-warning/40 text-warning hover:bg-warning-dark/50 text-xs" disabled={isLoading} onClick={() => handleInitiatePayment(true)}>
                  ⏱️ Simulate Payment Timeout (Scene 6)
                </Button>
              </div>
            </div>
          )}

          {/* HERO DEMO MOMENT: PAYMENT TIMEOUT RECOVERY IN PAYMENT_VERIFICATION */}
          {txn.state === "PAYMENT_VERIFICATION" && (
            <div className="p-5 bg-warning-dark/40 border-2 border-warning/60 rounded-2xl space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-warning text-surface flex items-center justify-center font-bold text-xl shadow-sm">
                  ⏱️
                </div>
                <div>
                  <h3 className="text-base font-bold text-warning">
                    HERO DEMO: Payment Timeout Held in PAYMENT_VERIFICATION
                  </h3>
                  <p className="text-xs text-ink-400 mt-0.5">
                    EscrowAI protocol locked state in <code>PAYMENT_VERIFICATION</code> to prevent double-charging. Awaiting Razorpay Webhook.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-warning/30 text-xs text-ink-400 font-mono space-y-1">
                <div>• Idempotency Key: {idempotencyKey}</div>
                <div>• Retry attempt blocked: Will return cached IN_PROGRESS response instead of re-charging Razorpay</div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-warning/30">
                <span className="text-xs font-semibold text-warning">
                  Simulate Webhook Delivery to Complete Escrow Settlement:
                </span>
                <Button variant="primary" disabled={isLoading} onClick={handleFireSimulatedWebhook}>
                  {isLoading ? "Delivering Webhook..." : "📡 Fire Razorpay Webhook (payment.captured)"}
                </Button>
              </div>
            </div>
          )}

          {txn.state === "PAYMENT_FAILED" && (
            <div className="p-5 bg-danger-dark/40 border-2 border-danger/40 rounded-2xl space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-danger text-white flex items-center justify-center font-bold text-xl">
                  ✕
                </div>
                <div>
                  <h3 className="text-base font-bold text-danger">Payment Declined / Failed</h3>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {txn.paymentFailureReason || "The payment attempt was declined or cancelled at Razorpay checkout."}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button variant="primary" disabled={isLoading} onClick={handlePayWithRazorpayModal}>
                  🔄 Retry Payment via Razorpay
                </Button>
              </div>
            </div>
          )}

          {txn.state === "PAID" && (
            <div className="p-5 bg-success-dark/40 border-2 border-success/40 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-success text-white flex items-center justify-center text-2xl font-bold mx-auto">
                ✓
              </div>
              <h3 className="text-lg font-bold text-success">🎉 Transaction Paid & Settled via EscrowAI Escrow</h3>
              <p className="text-xs text-ink-400 font-mono">
                Razorpay Payment ID: {txn.razorpayPaymentId || "pay_verified"}
              </p>
              <p className="text-[11px] text-ink-400">
                Payment verified cleanly via Razorpay checkout & webhook. Inventory locked and fulfillment initiated.
              </p>
            </div>
          )}
        </div>

        {/* Debug Log Output Box */}
        {lastResponse && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-ink-400 uppercase">Protocol Response Log</span>
            <pre className="p-3 bg-surface text-green-400 text-xs font-mono rounded-xl overflow-x-auto max-h-40 border border-surface-border">
              {JSON.stringify(lastResponse, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}
