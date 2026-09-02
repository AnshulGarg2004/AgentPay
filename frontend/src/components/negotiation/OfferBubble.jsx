import Badge from "../common/Badge.jsx";
import { formatRupee } from "../../lib/format.js";

export default function OfferBubble({ offer }) {
  const isBuyer = offer.sender === "BUYER_AGENT";
  const isMerchant = offer.sender === "MERCHANT_AGENT";

  let actionBadgeStatus = "default";
  if (offer.action === "ACCEPT") actionBadgeStatus = "PAID";
  else if (offer.action === "REJECT") actionBadgeStatus = "FAILED";
  else if (offer.action === "COUNTER") actionBadgeStatus = "PENDING";
  else actionBadgeStatus = "BRAND";

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isBuyer
          ? "bg-brand-500/10 border-brand-500/30 ml-4 md:ml-12"
          : isMerchant
          ? "bg-surface-alt border-surface-border shadow-card mr-4 md:mr-12"
          : "bg-surface border-surface-border"
      }`}
    >
      {/* Sender & Action Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isBuyer ? "bg-brand-500 shadow-glow" : isMerchant ? "bg-purple-400" : "bg-warning"
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wide text-white">
            {offer.sender === "BUYER_AGENT"
              ? "Buyer Agent"
              : offer.sender === "MERCHANT_AGENT"
              ? "Merchant Agent"
              : "Policy Engine"}
          </span>
        </div>
        <Badge status={actionBadgeStatus}>{offer.action}</Badge>
      </div>

      {/* Financial terms grid */}
      <div className="grid grid-cols-3 gap-2 my-2 py-2 px-3 bg-surface rounded-xl border border-surface-border text-xs">
        <div>
          <span className="text-[10px] text-ink-400 block uppercase">Unit Price</span>
          <span className="font-mono font-semibold text-white">{formatRupee(offer.unitPriceInPaise)}</span>
        </div>
        <div>
          <span className="text-[10px] text-ink-400 block uppercase">Quantity</span>
          <span className="font-mono text-ink-700">{offer.quantity} units</span>
        </div>
        <div>
          <span className="text-[10px] text-ink-400 block uppercase">Delivery SLA</span>
          <span className="font-mono text-ink-700">{offer.deliveryDays} days</span>
        </div>
      </div>

      {/* Reasoning text */}
      {offer.reasoning && (
        <p className="text-xs text-ink-700 italic mt-2 bg-surface-alt p-2.5 rounded-lg border border-surface-border">
          "{offer.reasoning}"
        </p>
      )}

      {/* Timestamp */}
      <div className="text-[10px] text-ink-400 text-right mt-2 font-mono">
        {offer.timestamp ? new Date(offer.timestamp).toLocaleTimeString() : "Just now"}
      </div>
    </div>
  );
}
