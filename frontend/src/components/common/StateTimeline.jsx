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
          AgentPay Lifecycle Protocol
        </h4>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-surface border border-surface-border text-brand-500">
          State: {currentState}
        </span>
      </div>

      {/* Horizontal Step Timeline */}
      <div className="flex items-center justify-between overflow-x-auto py-2 gap-1">
        {ORDERED_STEPS.map((step, idx) => {
          const isCompleted = activeIndex > idx || currentState === "PAID" || currentState === "COMPLETED";
          const isCurrent = step.key === currentState || (isHumanApproval && step.key === "POLICY_EVALUATED");

          let dotClass = "bg-surface border-surface-border text-ink-400";
          let labelClass = "text-ink-400 font-normal";

          if (isCompleted) {
            dotClass = "bg-success border-success text-white shadow-sm";
            labelClass = "text-white font-semibold";
          } else if (isCurrent) {
            dotClass = isHumanApproval
              ? "bg-warning border-warning text-white ring-4 ring-warning/20 animate-pulse"
              : "bg-brand-500 border-brand-500 text-white ring-4 ring-brand-500/20 animate-pulse";
            labelClass = "text-brand-500 font-bold";
          }

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center min-w-[75px]">
              <div className="flex items-center w-full">
                {/* Connecting Line Left */}
                {idx > 0 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      isCompleted || (isCurrent && idx <= activeIndex) ? "bg-success" : "bg-surface-border"
                    }`}
                  />
                )}

                {/* Node Circle */}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-mono font-bold transition-all ${dotClass}`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>

                {/* Connecting Line Right */}
                {idx < ORDERED_STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      isCompleted ? "bg-success" : "bg-surface-border"
                    }`}
                  />
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
