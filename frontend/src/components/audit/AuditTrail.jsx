import { useState, useEffect } from "react";
import Card from "../common/Card.jsx";
import { api } from "../../lib/api.js";

function getActorNodeInfo(actor, action, result) {
  const isRejected = result === "REJECTED" || result === "POLICY_REJECTED" || result === "FAILED";

  let icon = "⚡";
  let defaultTitle = action || "Pipeline Execution";

  switch (actor) {
    case "BUYER_AGENT":
      icon = "🧠";
      break;
    case "MERCHANT_AGENT":
      icon = "🏪";
      break;
    case "POLICY_ENGINE":
      icon = "🛡️";
      break;
    case "HUMAN":
      icon = "👤";
      break;
    default:
      icon = "🔗";
  }

  return { icon, isRejected };
}

export default function AuditTrail({ transactionId }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (transactionId) {
      fetchLogs();
    }
  }, [transactionId]);

  function fetchLogs() {
    setIsLoading(true);
    api
      .get(`/approvals/audit/${transactionId || "all"}`)
      .then((res) => setLogs(res.data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  return (
    <Card className="space-y-6 bg-[#0c101d] border border-[#1e2638]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e2638] pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-amber-500 font-bold text-base">⚡</span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Workflow Node Execution Graph
            </h3>
          </div>
          <p className="text-xs text-[#828fa3] mt-0.5">
            Real-time agent decision pipeline & policy evaluation graph nodes.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="text-xs text-brand-400 font-semibold border border-[#1e2638] bg-surface-alt px-2.5 py-1 rounded-xl hover:bg-surface-border hover:text-white transition-all shadow-sm"
        >
          🔄 Refresh Graph
        </button>
      </div>

      {isLoading ? (
        <p className="text-xs text-[#828fa3] py-6 italic text-center">Loading workflow node pipeline...</p>
      ) : logs.length === 0 ? (
        <p className="text-xs text-[#828fa3] py-6 italic text-center">No node execution logs recorded yet.</p>
      ) : (
        /* Vertical Node Flow Graph */
        <div className="flex flex-col items-center space-y-0 py-2 relative">
          {logs.map((log, index) => {
            const isLatest = index === logs.length - 1;
            const { icon, isRejected } = getActorNodeInfo(log.actor, log.action, log.result);

            // Theme card colors based on status & execution step
            let cardBg = "bg-[#090d16] border-[#10b981]/80 shadow-[0_0_15px_rgba(16,185,129,0.2)] ring-1 ring-[#10b981]/40";
            let textColor = "text-white";
            let badgeBg = "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40";

            if (isRejected) {
              cardBg = "bg-[#160b0f] border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/40";
              badgeBg = "bg-rose-500/20 text-rose-400 border-rose-500/40";
            } else if (!isLatest) {
              cardBg = "bg-[#0b0f19] border-[#6366f1]/60 shadow-[0_0_10px_rgba(99,102,241,0.15)] ring-1 ring-[#6366f1]/30";
              badgeBg = "bg-[#6366f1]/20 text-[#818cf8] border-[#6366f1]/40";
            }

            return (
              <div key={log._id} className="w-full flex flex-col items-center group">
                {/* Workflow Node Box */}
                <div
                  className={`w-full max-w-md p-4 rounded-2xl border transition-all duration-300 ${cardBg}`}
                >
                  {/* Icon & Title */}
                  <div className="flex flex-col items-center text-center space-y-1">
                    <span className="text-xl mb-0.5 inline-block transform group-hover:scale-110 transition-transform">
                      {icon}
                    </span>
                    <h4 className={`text-sm font-extrabold font-mono tracking-tight ${textColor}`}>
                      {log.action || log.actor}
                    </h4>
                    <p className="text-xs text-[#828fa3] font-sans max-w-xs line-clamp-2">
                      {log.reason || "Executed node step in transaction pipeline."}
                    </p>
                  </div>

                  {/* Node Badges Footer */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-border/50 text-[10px] font-mono">
                    <span className="text-[#828fa3]">
                      Actor: <strong className="text-white">{log.actor}</strong>
                    </span>
                    {log.result && (
                      <span className={`px-2 py-0.5 rounded-full border font-bold uppercase ${badgeBg}`}>
                        {log.result}
                      </span>
                    )}
                    <span className="text-[#828fa3]">
                      {new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false })}
                    </span>
                  </div>
                </div>

                {/* Vertical Connecting Line to Next Node */}
                {index < logs.length - 1 && (
                  <div className="w-0.5 h-6 bg-gradient-to-b from-[#10b981] to-[#6366f1] shadow-[0_0_8px_rgba(16,185,129,0.5)] my-0.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
