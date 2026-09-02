import { useState, useEffect } from "react";
import Card from "../common/Card.jsx";
import { api } from "../../lib/api.js";

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

  function getActorBadge(actor) {
    switch (actor) {
      case "BUYER_AGENT":
        return { dot: "bg-brand-500 shadow-glow", label: "Buyer Agent", badge: "bg-brand-500/20 text-brand-400 border-brand-500/30" };
      case "MERCHANT_AGENT":
        return { dot: "bg-purple-500", label: "Merchant Agent", badge: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
      case "POLICY_ENGINE":
        return { dot: "bg-warning", label: "Policy Engine", badge: "bg-warning-dark/40 text-warning border-warning/30" };
      case "HUMAN":
        return { dot: "bg-success", label: "Human Reviewer", badge: "bg-success-dark/40 text-success border-success/30" };
      default:
        return { dot: "bg-slate-400", label: actor, badge: "bg-surface border-surface-border text-ink-400" };
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-surface-border pb-3">
        <div>
          <h3 className="text-base font-bold text-white">Immutable Governance Audit Trail</h3>
          <p className="text-xs text-ink-400">Verifiable changelog of all agent decisions and policy evaluations</p>
        </div>
        <button
          onClick={fetchLogs}
          className="text-xs text-brand-500 hover:text-brand-400 font-semibold border border-surface-border px-2.5 py-1 rounded-lg hover:bg-surface-border transition-colors"
        >
          🔄 Refresh Log
        </button>
      </div>

      {isLoading ? (
        <p className="text-xs text-ink-400 py-4 italic">Loading audit trail records...</p>
      ) : logs.length === 0 ? (
        <p className="text-xs text-ink-400 py-4 italic">No audit trail records found for this transaction.</p>
      ) : (
        /* Vertical Changelog Timeline */
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-border">
          {logs.map((log) => {
            const actorStyle = getActorBadge(log.actor);
            return (
              <div key={log._id} className="relative group">
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-surface-alt ring-2 ring-surface-border ${actorStyle.dot}`}
                />

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${actorStyle.badge}`}>
                      {actorStyle.label}
                    </span>
                    <span className="text-xs font-bold text-white">{log.action}</span>
                    <span className="text-[10px] text-ink-400 font-mono ml-auto">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs text-ink-700 bg-surface-alt p-2.5 rounded-xl border border-surface-border font-mono">
                    {log.reason}
                  </p>

                  {log.result && (
                    <div className="flex items-center space-x-2 text-[10px] text-ink-400">
                      <span>Result:</span>
                      <span className="font-semibold font-mono text-white">{log.result}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
