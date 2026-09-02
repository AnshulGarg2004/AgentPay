import { useState, useEffect } from "react";
import Card from "../common/Card.jsx";
import Button from "../common/Button.jsx";
import Badge from "../common/Badge.jsx";
import OfferBubble from "./OfferBubble.jsx";
import QuoteCard from "../quote/QuoteCard.jsx";
import { api } from "../../lib/api.js";
import { formatRupee } from "../../lib/format.js";

export default function NegotiationThread({ productId, buyerId, onQuoteGenerated }) {
  const [product, setProduct] = useState(null);
  const [negotiation, setNegotiation] = useState(null);

  // Counter offer input state
  const [targetPriceRupees, setTargetPriceRupees] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [deliveryDays, setDeliveryDays] = useState(3);
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [activeQuote, setActiveQuote] = useState(null);
  const [acceptedTxn, setAcceptedTxn] = useState(null);

  // Fetch product details on mount
  useEffect(() => {
    if (productId) {
      api
        .get(`/products/${productId}`)
        .then((res) => {
          setProduct(res.data);
          setTargetPriceRupees(res.data.priceInPaise / 100);
          setDeliveryDays(res.data.deliveryMinDays || 3);
        })
        .catch(console.error);
    }
  }, [productId]);

  async function handleStartNegotiation() {
    setIsLoading(true);
    try {
      const res = await api.post("/negotiations", {
        productId,
        buyerId,
        quantity: Number(quantity),
        targetPriceInPaise: Math.round(Number(targetPriceRupees) * 100),
        requestedDeliveryDays: Number(deliveryDays),
        notes: notes || "Initial buyer offer",
      });

      setNegotiation(res.data);
      setNotes("");
    } catch (err) {
      console.error("Failed to start negotiation:", err);
      alert("Negotiation start failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitCounterOffer() {
    if (!negotiation?._id) return;
    setIsLoading(true);
    try {
      const res = await api.post(`/negotiations/${negotiation._id}/offer`, {
        sender: "BUYER_AGENT",
        quantity: Number(quantity),
        unitPriceInPaise: Math.round(Number(targetPriceRupees) * 100),
        deliveryDays: Number(deliveryDays),
        notes: notes || "Buyer counter offer",
      });

      setNegotiation(res.data);
      setNotes("");
    } catch (err) {
      console.error("Counter offer failed:", err);
      alert("Counter offer failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateQuote() {
    if (!negotiation?.agreedOffer || !product) return;
    setIsLoading(true);
    try {
      const agreed = negotiation.agreedOffer;
      const quoteRes = await api.post("/quotes", {
        productId: product._id,
        merchantId: product.merchantId?._id || product.merchantId,
        buyerId: buyerId || null,
        unitPriceInPaise: agreed.unitPriceInPaise,
        quantity: agreed.quantity,
        deliveryDays: agreed.deliveryDays,
        expiresInMinutes: 15,
      });

      setActiveQuote(quoteRes.data);
      if (onQuoteGenerated) {
        onQuoteGenerated(quoteRes.data);
      }
    } catch (err) {
      console.error("Quote generation failed:", err);
      alert("Failed to generate quote: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAcceptQuote(quote) {
    setIsLoading(true);
    try {
      const res = await api.post(`/quotes/${quote._id}/accept`);
      setAcceptedTxn(res.data.transaction);
    } catch (err) {
      console.error("Accept quote error:", err);
      alert("Quote acceptance failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  }

  if (!product) {
    return <Card><p className="text-xs text-ink-400">Loading product details...</p></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Target Product Summary Banner */}
      <Card className="bg-surface-alt border-surface-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold">
                {product.attributes?.category || "Product"}
              </span>
              <span className="text-xs text-ink-400">Merchant: {product.merchantId?.name || "Verified Merchant"}</span>
            </div>
            <h2 className="text-xl font-bold text-ink-900 mt-1">{product.name}</h2>
          </div>

          <div className="flex items-center space-x-6 text-right">
            <div>
              <span className="text-xs text-ink-400 block uppercase">Standard Price</span>
              <span className="text-lg font-bold font-mono text-ink-900">{formatRupee(product.priceInPaise)}</span>
            </div>
            <div>
              <span className="text-xs text-ink-400 block uppercase">Floor Price</span>
              <span className="text-sm font-mono text-ink-700">{formatRupee(product.minPriceInPaise)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Negotiation History & Control Section */}
      {!negotiation ? (
        /* Initial Offer Creation Panel */
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-ink-900 border-b border-surface-border pb-2">
            Initiate Autonomous AI Negotiation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase text-ink-700 mb-1">
                Target Unit Price (₹)
              </label>
              <input
                type="number"
                value={targetPriceRupees}
                onChange={(e) => setTargetPriceRupees(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-surface-border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase text-ink-700 mb-1">
                Quantity Required
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-surface-border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase text-ink-700 mb-1">
                Delivery SLA (Days)
              </label>
              <input
                type="number"
                min="1"
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-surface-border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase text-ink-700 mb-1">
              Buyer Agent Note / Offer Context
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Requesting bulk discount for upfront payment terms"
              className="w-full px-3.5 py-2 rounded-lg border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" disabled={isLoading} onClick={handleStartNegotiation}>
              {isLoading ? "Negotiating with Merchant AI..." : "🤝 Submit Initial Offer"}
            </Button>
          </div>
        </Card>
      ) : (
        /* Ongoing Negotiation Thread View */
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-ink-900">Negotiation Thread</h3>
                <span className="text-xs font-mono text-ink-400">#{String(negotiation._id).slice(-8)}</span>
              </div>
              <Badge status={negotiation.status}>{negotiation.status}</Badge>
            </div>

            {/* Offer Timeline Bubbles */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {negotiation.offers.map((offer, idx) => (
                <OfferBubble key={idx} offer={offer} />
              ))}
            </div>

            {/* Status-specific Action Bar */}
            {negotiation.status === "OPEN" && (
              <div className="pt-4 border-t border-surface-border space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-700">Submit Buyer Counter Offer</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-ink-400 mb-1">Counter Unit Price (₹)</label>
                    <input
                      type="number"
                      value={targetPriceRupees}
                      onChange={(e) => setTargetPriceRupees(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-surface-border text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-surface-border text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-400 mb-1">Delivery (Days)</label>
                    <input
                      type="number"
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-surface-border text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="primary" size="sm" disabled={isLoading} onClick={handleSubmitCounterOffer}>
                    {isLoading ? "Sending Counter..." : "💬 Send Counter Offer"}
                  </Button>
                </div>
              </div>
            )}

            {negotiation.status === "AGREED" && !activeQuote && (
              <div className="p-4 bg-success-light border border-success/30 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-success-dark">🎉 Terms Agreed by Merchant AI!</h4>
                  <p className="text-xs text-success-dark/80 mt-0.5">
                    Final Agreed Unit Price: {formatRupee(negotiation.agreedOffer?.unitPriceInPaise)} | Qty: {negotiation.agreedOffer?.quantity}
                  </p>
                </div>
                <Button variant="primary" disabled={isLoading} onClick={handleGenerateQuote}>
                  {isLoading ? "Generating Quote..." : "📜 Lock & Generate Immutable Quote"}
                </Button>
              </div>
            )}
          </Card>

          {/* Render Active Quote Card once generated */}
          {activeQuote && (
            <div className="animate-slideIn space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-ink-400">
                Generated Binding Quote
              </h3>
              <QuoteCard quote={activeQuote} onAcceptQuote={handleAcceptQuote} />
            </div>
          )}

          {/* Render Resulting Transaction Status Banner */}
          {acceptedTxn && (
            <Card className="animate-slideIn border-2 border-brand-500/40">
              <div className="flex items-center justify-between border-b border-surface-border pb-3 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-ink-400">TXN #{String(acceptedTxn._id).slice(-8).toUpperCase()}</span>
                  <Badge status={acceptedTxn.state}>{acceptedTxn.state}</Badge>
                </div>
                <span className="text-xs font-mono font-bold text-brand-600">
                  Risk Level: {acceptedTxn.riskLevel} ({acceptedTxn.riskScore}/100)
                </span>
              </div>

              {acceptedTxn.state === "HUMAN_APPROVAL_REQUIRED" ? (
                <div className="p-4 bg-warning-light border border-warning/40 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-warning-dark font-bold text-sm">
                    <span>🛡️ FLAGGED FOR HUMAN GOVERNANCE APPROVAL</span>
                  </div>
                  <p className="text-xs text-warning-dark/90">
                    Policy Engine evaluated quote acceptance and flagged human approval requirement before advancing transaction to payment settlement.
                  </p>
                  <div className="text-xs font-medium text-warning-dark bg-white/70 p-2.5 rounded-lg border border-warning/30 space-y-1">
                    <span className="font-bold block">Policy Engine Trigger Reasons:</span>
                    {acceptedTxn.approvalReasons?.map((r, i) => (
                      <div key={i}>• {r}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-success-light border border-success/30 rounded-xl">
                  <div className="text-success-dark font-bold text-sm">
                    ✅ Transaction Policy Evaluated & Approved
                  </div>
                  <p className="text-xs text-success-dark/80 mt-1">
                    State advanced to <strong>PAYMENT_PENDING</strong>. Ready for Razorpay escrow settlement.
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
