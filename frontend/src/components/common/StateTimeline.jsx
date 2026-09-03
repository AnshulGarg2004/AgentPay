import { motion } from "framer-motion";
import { TRANSACTION_STATES } from "../../constants/transactionStates.js";

const ORDERED_STEPS = [
  { key: "DISCOVERED", label: "Discovered" },
  { key: "QUOTED", label: "Quoted" },
  { key: "AGREED", label: "Agreed" },
  { key: "POLICY_EVALUATED", label: "Policy Check" },
  { key: "PAYMENT_PENDING", label: "Payment" },
  { key: "PAYMENT_PROCESSING", label: "Order Created" },
  { key: "PAYMENT_VERIFICATION", label: "Escrow Check" },
  { key: "PAID", label: "Paid & Settled" },
  { key: "COMPLETED", label: "Fulfilled" },
];

export default function StateTimeline({ currentState }) {
  // Handle special side states
  const isHumanApproval = currentState === "HUMAN_APPROVAL_REQUIRED";
  const isPolicyRejected = currentState === "POLICY_REJECTED";
  const isFailed = currentState === "PAYMENT_FAILED";
  const isRejected = currentState === "REJECTED";

  // Find index of current step in standard flow
  let activeIndex = ORDERED_STEPS.findIndex((step) => step.key === currentState);
  if (isHumanApproval) {
    activeIndex = ORDERED_STEPS.findIndex((step) => step.key === "POLICY_EVALUATED");
  }

  return (
    <div className="space-y-4 bg-surface-alt p-4 rounded-2xl border border-surface-border shadow-card relative overflow-hidden">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-400">
          EscrowAI Lifecycle Protocol
        </h4>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          State: {currentState}
        </span>
      </div>

      {/* Horizontal Step Timeline */}
      <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2 gap-1">
        {ORDERED_STEPS.map((step, idx) => {
          const isCompleted = activeIndex > idx || currentState === "PAID" || currentState === "COMPLETED";
          const isCurrent = step.key === currentState || (isHumanApproval && step.key === "POLICY_EVALUATED");

          let dotClass = "bg-surface border-surface-border text-ink-400 opacity-60";
          let labelClass = "text-ink-400 font-normal";

          if (isCompleted) {
            dotClass = "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.75)] font-bold";
            labelClass = "text-emerald-400 font-semibold drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]";
          } else if (isCurrent) {
            dotClass = isHumanApproval
              ? "bg-warning border-amber-300 text-white ring-2 ring-warning/50 shadow-[0_0_12px_rgba(245,158,11,0.75)] animate-pulse font-bold"
              : "bg-emerald-500 border-emerald-300 text-white ring-2 ring-emerald-500/50 shadow-[0_0_14px_rgba(16,185,129,0.85)] animate-pulse font-bold";
            labelClass = isHumanApproval ? "text-warning font-bold drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]" : "text-emerald-400 font-bold drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]";
          }

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center min-w-[75px]">
              <div className="flex items-center w-full">
                {/* Connecting Line Left */}
                {idx > 0 && (
                  <div className="h-0.5 flex-1 bg-surface-border relative overflow-hidden">
                    {(isCompleted || (isCurrent && idx <= activeIndex)) && (
                      <motion.div
                        key={`left-${step.key}-${isCompleted ? "done" : "active"}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.5, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] origin-left"
                      />
                    )}
                  </div>
                )}

                {/* Node Circle */}
                <motion.div
                  key={`node-${step.key}-${isCompleted ? "done" : isCurrent ? "current" : "pending"}`}
                  initial={{ scale: 0.7 }}
                  animate={{ scale: isCurrent ? [1, 1.25, 1] : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={`w-5 h-5 shrink-0 aspect-square rounded-full border flex items-center justify-center text-[9px] font-mono transition-colors z-10 ${dotClass}`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </motion.div>

                {/* Connecting Line Right */}
                {idx < ORDERED_STEPS.length - 1 && (
                  <div className="h-0.5 flex-1 bg-surface-border relative overflow-hidden">
                    {isCompleted && (
                      <motion.div
                        key={`right-${step.key}-${isCompleted ? "done" : "active"}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.5, delay: idx * 0.04 + 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] origin-left"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] text-center mt-1.5 line-clamp-1 ${labelClass}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Side State Alerts */}
      {isHumanApproval && (
        <div className="p-3 bg-warning-dark/40 border border-warning/30 rounded-xl text-xs text-warning flex items-center space-x-2">
          <span>🛡️</span>
          <span><strong>HUMAN_APPROVAL_REQUIRED</strong>: Flagged by Policy Engine. Awaiting human operations manager sign-off in Approval Queue.</span>
        </div>
      )}

      {(isPolicyRejected || isRejected || isFailed) && (
        <div className="p-3 bg-danger-dark/40 border border-danger/30 rounded-xl text-xs text-danger flex items-center space-x-2">
          <span>❌</span>
          <span><strong>TRANSACTION STOPPED</strong>: State is {currentState}. Further processing halted.</span>
        </div>
      )}
    </div>
  );
}
