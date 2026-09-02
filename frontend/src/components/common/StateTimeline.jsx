import { TRANSACTION_STATES } from "../../constants/transactionStates.js";

const ORDERED_STEPS = [
  { key: "DISCOVERED", label: "Discovered" },
  { key: "QUOTED", label: "Quote Generated" },
  { key: "AGREED", label: "Terms Agreed" },
  { key: "POLICY_EVALUATED", label: "Policy Evaluated" },
  { key: "PAYMENT_PENDING", label: "Payment Pending" },
  { key: "PAYMENT_PROCESSING", label: "Order Created" },
  { key: "PAYMENT_VERIFICATION", label: "Escrow Verification" },
  { key: "PAID", label: "Paid & Settled" },
  { key: "COMPLETED", label: "Fulfillment Complete" },
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
    <div className="space-y-4 bg-white p-4 rounded-2xl border border-surface-border shadow-card">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700">
          AgentPay Transaction Lifecycle Protocol
        </h4>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800">
          State: {currentState}
        </span>
      </div>

      {/* Horizontal Step Timeline */}
      <div className="flex items-center justify-between overflow-x-auto py-2 gap-2">
        {ORDERED_STEPS.map((step, idx) => {
          const isCompleted = activeIndex > idx || currentState === "PAID" || currentState === "COMPLETED";
          const isCurrent = step.key === currentState || (isHumanApproval && step.key === "POLICY_EVALUATED");

          let dotClass = "bg-slate-200 border-slate-300 text-slate-400";
          let labelClass = "text-ink-400 font-normal";

          if (isCompleted) {
            dotClass = "bg-success border-success text-white";
            labelClass = "text-ink-900 font-semibold";
          } else if (isCurrent) {
            dotClass = isHumanApproval
              ? "bg-warning border-warning text-white ring-4 ring-warning/20 animate-pulse"
              : "bg-brand-500 border-brand-500 text-white ring-4 ring-brand-500/20 animate-pulse";
            labelClass = "text-brand-600 font-bold";
          }

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center min-w-[90px]">
              <div className="flex items-center w-full">
                {/* Connecting Line Left */}
                {idx > 0 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      isCompleted || (isCurrent && idx <= activeIndex) ? "bg-success" : "bg-slate-200"
                    }`}
                  />
                )}

                {/* Node Circle */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold transition-all ${dotClass}`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>

                {/* Connecting Line Right */}
                {idx < ORDERED_STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      isCompleted ? "bg-success" : "bg-slate-200"
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
        <div className="p-3 bg-warning-light border border-warning/40 rounded-xl text-xs text-warning-dark flex items-center space-x-2">
          <span>🛡️</span>
          <span><strong>HUMAN_APPROVAL_REQUIRED</strong>: Flagged by Policy Engine. Awaiting human operations manager sign-off in Approval Queue.</span>
        </div>
      )}

      {(isPolicyRejected || isRejected || isFailed) && (
        <div className="p-3 bg-danger-light border border-danger/40 rounded-xl text-xs text-danger-dark flex items-center space-x-2">
          <span>❌</span>
          <span><strong>TRANSACTION STOPPED</strong>: State is {currentState}. Further processing halted.</span>
        </div>
      )}
    </div>
  );
}
