import { motion } from "framer-motion";
import { formatRupee } from "../../lib/format.js";

export default function PriceComparisonBar({
  askingPriceInPaise = 0,
  offerPriceInPaise = 0,
  agreedPriceInPaise = 0,
}) {
  const maxPrice = Math.max(askingPriceInPaise, offerPriceInPaise, agreedPriceInPaise, 1);

  const askingPct = Math.min(100, Math.round((askingPriceInPaise / maxPrice) * 100));
  const offerPct = Math.min(100, Math.round((offerPriceInPaise / maxPrice) * 100));
  const agreedPct = Math.min(100, Math.round((agreedPriceInPaise / maxPrice) * 100));

  const discountPaise = askingPriceInPaise - agreedPriceInPaise;
  const discountPct = askingPriceInPaise > 0 ? ((discountPaise / askingPriceInPaise) * 100).toFixed(1) : 0;

  return (
    <div className="p-4 bg-surface border border-surface-border rounded-2xl space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Price Negotiation Settlement Scale</h4>
          <p className="text-[11px] text-ink-400 mt-0.5">Original ask vs buyer target vs final negotiated quote</p>
        </div>
        {discountPaise > 0 && (
          <span className="text-xs font-mono font-bold text-success bg-success-dark/30 border border-success/30 px-2.5 py-1 rounded-full shrink-0 self-start sm:self-auto">
            Saved {formatRupee(discountPaise)} ({discountPct}% discount)
          </span>
        )}
      </div>

      {/* Horizontal Bar Container */}
      <div className="space-y-2">
        <div className="relative w-full bg-surface-alt h-4 rounded-full overflow-hidden border border-surface-border">
          {/* Asking Price Bar (Background 100%) */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${askingPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-ink-400/20 rounded-full"
          />

          {/* Agreed Price Bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${agreedPct}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-500 to-success rounded-full shadow-glow"
          />

          {/* Offer Price Marker Line */}
          {offerPriceInPaise > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ left: `${offerPct}%` }}
              className="absolute top-0 bottom-0 w-1 bg-cyan-400 z-10 shadow-glow"
            />
          )}
        </div>

        {/* Legend / Labels Row */}
        <div className="grid grid-cols-3 text-[11px] font-mono pt-1 border-t border-surface-border/50">
          <div>
            <span className="text-cyan-400 font-semibold block">Buyer Target</span>
            <span className="text-white font-bold">{formatRupee(offerPriceInPaise)}</span>
          </div>
          <div className="text-center">
            <span className="text-success font-semibold block">Agreed Final</span>
            <span className="text-white font-bold">{formatRupee(agreedPriceInPaise)}</span>
          </div>
          <div className="text-right">
            <span className="text-ink-400 font-semibold block">List Price</span>
            <span className="text-white font-bold">{formatRupee(askingPriceInPaise)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
