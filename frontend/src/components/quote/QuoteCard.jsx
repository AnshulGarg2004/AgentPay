import { useState } from "react";
import Card from "../common/Card.jsx";
import Badge from "../common/Badge.jsx";
import Button from "../common/Button.jsx";
import QuoteExpiryTimer from "./QuoteExpiryTimer.jsx";
import { formatRupee } from "../../lib/format.js";

export default function QuoteCard({ quote, onAcceptQuote }) {
  const [isExpired, setIsExpired] = useState(quote.status === "EXPIRED");

  const product = quote.productId || {};
  const merchant = quote.merchantId || {};

  function handleExpire() {
    setIsExpired(true);
  }

  const effectiveStatus = isExpired ? "EXPIRED" : quote.status;

  return (
    <Card className="space-y-4 border-2 transition-colors">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-surface-border pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-ink-400 font-mono">QUOTE #{String(quote._id).slice(-8).toUpperCase()}</span>
            <Badge status={effectiveStatus}>{effectiveStatus}</Badge>
          </div>
          <h3 className="text-base font-bold text-ink-900 mt-1">{product.name || "B2B Product"}</h3>
          <p className="text-xs text-ink-400">Sold by {merchant.name || "Verified Merchant"}</p>
        </div>

        <div>
          <QuoteExpiryTimer expiresAt={quote.expiresAt} onExpire={handleExpire} />
        </div>
      </div>

      {/* Financial Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-alt rounded-xl border border-surface-border">
        <div>
          <span className="text-[10px] text-ink-400 block uppercase font-medium">Agreed Unit Price</span>
          <span className="text-base font-bold font-mono text-ink-900">{formatRupee(quote.unitPriceInPaise)}</span>
        </div>
        <div>
          <span className="text-[10px] text-ink-400 block uppercase font-medium">Quantity</span>
          <span className="text-base font-bold font-mono text-ink-900">{quote.quantity} units</span>
        </div>
        <div>
          <span className="text-[10px] text-ink-400 block uppercase font-medium">Total Quote Value</span>
          <span className="text-base font-bold font-mono text-brand-600">{formatRupee(quote.subtotalInPaise)}</span>
        </div>
        <div>
          <span className="text-[10px] text-ink-400 block uppercase font-medium">Guaranteed Delivery SLA</span>
          <span className="text-base font-bold font-mono text-ink-900">{quote.deliveryDays} business days</span>
        </div>
      </div>

      {/* Terms & Policies */}
      <div className="text-xs text-ink-400 space-y-1">
        <div>• Warranty: {quote.terms?.warranty || "Standard 1 year"}</div>
        <div>• Returns: {quote.terms?.returnPolicyDays || 7} days return policy included</div>
        <div>• Price Lock: Guaranteed by AgentPay escrow protocol until quote expiration</div>
      </div>

      {/* Expiry Banner or Action Button */}
      {isExpired ? (
        <div className="p-3 bg-danger-light border border-danger/30 rounded-xl text-center">
          <p className="text-xs font-semibold text-danger-dark">
            ⚠️ THIS QUOTE HAS EXPIRED.
          </p>
          <p className="text-[11px] text-danger-dark/80 mt-0.5">
            Price and inventory locks have been released. Please initiate a new negotiation to obtain an active quote.
          </p>
        </div>
      ) : (
        <div className="flex justify-end pt-2 border-t border-surface-border">
          {onAcceptQuote && (
            <Button
              variant="primary"
              disabled={isExpired || quote.status !== "ACTIVE"}
              onClick={() => onAcceptQuote(quote)}
            >
              Proceed to Checkout →
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
