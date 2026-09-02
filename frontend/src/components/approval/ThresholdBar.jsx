import { motion } from "framer-motion";
import { formatRupee } from "../../lib/format.js";

export default function ThresholdBar({
  amountInPaise = 0,
  thresholdInPaise = 5000000, // ₹50,000 default threshold
}) {
  const safeThreshold = Math.max(thresholdInPaise, 1);
  const maxScale = Math.max(amountInPaise, safeThreshold * 1.2, 1);

  const amountPct = Math.min(100, Math.round((amountInPaise / maxScale) * 100));
  const thresholdPct = Math.min(100, Math.round((safeThreshold / maxScale) * 100));

  const isExceeded = amountInPaise > safeThreshold;
  const barColor = isExceeded ? "bg-warning" : "bg-success";

  return (
    <div className="space-y-1.5 font-mono text-xs">
      <div className="flex justify-between items-center text-[11px]">
        <span className="text-ink-400">Auto-Approval Threshold Comparison</span>
        <span className={isExceeded ? "text-warning font-bold" : "text-success font-bold"}>
          {isExceeded ? "⚠️ Exceeds Threshold" : "✓ Within Limit"}
        </span>
      </div>

      <div className="relative w-full bg-surface-alt h-3.5 rounded-full overflow-hidden border border-surface-border">
        {/* Filled Amount Segment */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${amountPct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${barColor}`}
        />

        {/* Threshold Marker Line */}
        <div
          style={{ left: `${thresholdPct}%` }}
          className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow-glow"
        >
          <div className="absolute -top-1 -left-1 w-2.5 h-1 bg-white rounded-full" />
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] text-ink-400">
        <span>Amount: {formatRupee(amountInPaise)}</span>
        <span>Auto-Approve Max: {formatRupee(safeThreshold)}</span>
      </div>
    </div>
  );
}
