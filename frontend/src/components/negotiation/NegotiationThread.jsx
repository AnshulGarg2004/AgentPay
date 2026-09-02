import { useState, useEffect, useRef } from "react";
import Card from "../common/Card.jsx";
import Button from "../common/Button.jsx";
import Badge from "../common/Badge.jsx";
import OfferBubble from "./OfferBubble.jsx";
import QuoteCard from "../quote/QuoteCard.jsx";
import PaymentCheckoutCard from "../payment/PaymentCheckoutCard.jsx";
import PriceComparisonBar from "./PriceComparisonBar.jsx";
import { api } from "../../lib/api.js";
import { formatRupee } from "../../lib/format.js";

export default function NegotiationThread({
  productId,
  buyerId,
  initialQuantity,
  initialTargetPriceInPaise,
  initialDeliveryDays,
  initialNotes,
  onQuoteGenerated,
}) {
  const [product, setProduct] = useState(null);
  const [negotiation, setNegotiation] = useState(null);

  // Counter offer input state
  const [targetPriceRupees, setTargetPriceRupees] = useState("");
  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const [deliveryDays, setDeliveryDays] = useState(initialDeliveryDays || 3);
  const [notes, setNotes] = useState(initialNotes || "");

  const [isLoading, setIsLoading] = useState(false);
  const [activeQuote, setActiveQuote] = useState(null);
  const [acceptedTxn, setAcceptedTxn] = useState(null);

  const offersEndRef = useRef(null);

  // Auto-scroll timeline to newest offer message
  useEffect(() => {
    if (negotiation?.offers?.length) {
      offersEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [negotiation?.offers?.length]);

  // Fetch product details on mount or productId change
  useEffect(() => {
    if (productId) {
      setNegotiation(null);
      setActiveQuote(null);
      setAcceptedTxn(null);

      api
        .get(`/products/${productId}`)
        .then((res) => {
          setProduct(res.data);
          if (initialTargetPriceInPaise) {
            setTargetPriceRupees(initialTargetPriceInPaise / 100);
          } else {
            setTargetPriceRupees(res.data.priceInPaise / 100);
          }
          if (initialQuantity) setQuantity(initialQuantity);
          if (initialDeliveryDays) setDeliveryDays(initialDeliveryDays);
          if (initialNotes) setNotes(initialNotes);
        })
        .catch(console.error);
    }
  }, [productId, initialQuantity, initialTargetPriceInPaise, initialDeliveryDays, initialNotes]);

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

  async function handleAcceptMerchantCounterOffer(merchantOffer) {
    if (!negotiation?._id || !merchantOffer?.unitPriceInPaise) return;
    setIsLoading(true);
    try {
      const res = await api.post(`/negotiations/${negotiation._id}/offer`, {
        sender: "BUYER_AGENT",
        action: "ACCEPT",
        quantity: Number(merchantOffer.quantity || quantity || 1),
        unitPriceInPaise: Number(merchantOffer.unitPriceInPaise),
        deliveryDays: Number(merchantOffer.deliveryDays || deliveryDays || 3),
        notes: `Accepted merchant counter offer of ${formatRupee(merchantOffer.unitPriceInPaise)}`,
      });

      setNegotiation(res.data);
    } catch (err) {
      console.error("Accepting counter offer failed:", err);
      alert("Accept counter offer failed: " + (err.response?.data?.error || err.message));
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
      <Card hasGradientAccent className="bg-surface-alt border-surface-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase bg-surface-border px-2 py-0.5 rounded text-brand-400 font-bold">
                {product.attributes?.category || "Product"}
              </span>
              <span className="text-xs text-ink-400">Merchant: {product.merchantId?.name || "Verified Merchant"}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{product.name}</h2>
          </div>

          <div className="flex items-center space-x-6 text-right">
            <div>
              <span className="text-xs text-ink-400 block uppercase">Standard Price</span>
              <span className="text-lg font-bold font-mono text-white">{formatRupee(product.priceInPaise)}</span>
            </div>
            <div>
              <span className="text-xs text-ink-400 block uppercase">Floor Price</span>
              <span className="text-sm font-mono text-brand-500">{formatRupee(product.minPriceInPaise)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Negotiation History & Control Section */}
      {!negotiation ? (
        /* Initial Offer Creation Panel */
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-white border-b border-surface-border pb-2">
            Initiate Autonomous AI Negotiation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase text-ink-400 mb-1">
                Target Unit Price (₹)
              </label>
              <input
                type="number"
                value={targetPriceRupees}
                onChange={(e) => setTargetPriceRupees(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-surface-border bg-surface font-mono text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase text-ink-400 mb-1">
                Quantity Required
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-surface-border bg-surface font-mono text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase text-ink-400 mb-1">
                Delivery SLA (Days)
              </label>
              <input
                type="number"
                min="1"
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-surface-border bg-surface font-mono text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase text-ink-400 mb-1">
              Buyer Agent Note / Offer Context
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Requesting bulk discount for upfront payment terms"
              className="w-full px-3.5 py-2 rounded-lg border border-surface-border bg-surface text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                <h3 className="text-base font-bold text-white">Negotiation Thread</h3>
                <span className="text-xs font-mono text-ink-400">#{String(negotiation._id).slice(-8)}</span>
              </div>
              <Badge status={negotiation.status}>{negotiation.status}</Badge>
            </div>

            {/* Offer Timeline Bubbles */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
              {negotiation.offers.map((offer, idx) => (
                <OfferBubble
                  key={idx}
                  offer={offer}
                  onAccept={negotiation.status === "OPEN" ? handleAcceptMerchantCounterOffer : null}
                />
              ))}
              <div ref={offersEndRef} />
            </div>

            {/* Status-specific Action Bar */}
            {negotiation.status === "OPEN" && (() => {
              const lastMerchantOffer = negotiation.offers?.slice().reverse().find(
                (o) => (o.sender === "MERCHANT_AGENT" || o.sender === "POLICY_ENGINE") && (o.action?.toUpperCase() === "COUNTER" || o.action?.toUpperCase() === "OFFER")
              );

              return (
                <div className="pt-4 border-t border-surface-border space-y-4">
                  {/* Accept Merchant Counter Offer Quick Action Banner */}
                  {lastMerchantOffer && (
                    <div className="p-3.5 bg-success-dark/30 border border-success/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-glow">
                      <div>
                        <span className="text-xs font-bold text-success flex items-center gap-1.5">
                          <span>⚡</span> Merchant Counter Offer Available
                        </span>
                        <p className="text-xs text-ink-400 mt-0.5">
                          Unit Price: <strong className="text-white font-mono">{formatRupee(lastMerchantOffer.unitPriceInPaise)}</strong> | Quantity: <strong className="text-white font-mono">{lastMerchantOffer.quantity}</strong> | Delivery: <strong className="text-white font-mono">{lastMerchantOffer.deliveryDays} days</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleAcceptMerchantCounterOffer(lastMerchantOffer)}
                        className="px-4 py-2 bg-success text-white font-bold rounded-xl text-xs hover:bg-success-dark transition-all shadow-glow flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                      >
                        <span>{isLoading ? "Accepting..." : `✅ Accept Merchant Offer (${formatRupee(lastMerchantOffer.unitPriceInPaise)})`}</span>
                      </button>
                    </div>
                  )}

                  <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Or Submit Buyer Counter Offer</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-ink-400 mb-1">Counter Unit Price (₹)</label>
                      <input
                        type="number"
                        value={targetPriceRupees}
                        onChange={(e) => setTargetPriceRupees(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-surface-border bg-surface text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-400 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-surface-border bg-surface text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-400 mb-1">Delivery (Days)</label>
                      <input
                        type="number"
                        value={deliveryDays}
                        onChange={(e) => setDeliveryDays(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-surface-border bg-surface text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="primary" size="sm" disabled={isLoading} onClick={handleSubmitCounterOffer}>
                      {isLoading ? "Sending Counter..." : "💬 Send Custom Counter Offer"}
                    </Button>
                  </div>
                </div>
              );
            })()}

            {negotiation.status === "AGREED" && !activeQuote && (
              <div className="space-y-4">
                <PriceComparisonBar
                  askingPriceInPaise={product.priceInPaise}
                  offerPriceInPaise={initialTargetPriceInPaise || negotiation.agreedOffer?.unitPriceInPaise}
                  agreedPriceInPaise={negotiation.agreedOffer?.unitPriceInPaise}
                />
                <div className="p-4 bg-success-dark/40 border border-success/30 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-success">🎉 Terms Agreed by Merchant AI!</h4>
                    <p className="text-xs text-ink-400 mt-0.5">
                      Final Agreed Unit Price: {formatRupee(negotiation.agreedOffer?.unitPriceInPaise)} | Qty: {negotiation.agreedOffer?.quantity}
                    </p>
                  </div>
                  <Button variant="primary" disabled={isLoading} onClick={handleGenerateQuote}>
                    {isLoading ? "Generating Quote..." : "📜 Lock & Generate Immutable Quote"}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Render Active Quote Card once generated */}
          {activeQuote && !acceptedTxn && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-ink-400">
                Generated Binding Quote
              </h3>
              <QuoteCard quote={activeQuote} onAcceptQuote={handleAcceptQuote} />
            </div>
          )}

          {/* Render Escrow Payment Checkout Card once accepted */}
          {acceptedTxn && (
            <PaymentCheckoutCard
              transaction={acceptedTxn}
              onStateUpdated={(updated) => setAcceptedTxn(updated)}
            />
          )}
        </div>
      )}
    </div>
  );
}
