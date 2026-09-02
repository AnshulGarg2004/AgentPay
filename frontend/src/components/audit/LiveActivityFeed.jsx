import { useState, useEffect, useRef } from "react";
import { socket } from "../../lib/socket.js";

export default function LiveActivityFeed({ transactionId = null }) {
  const [logs, setLogs] = useState([]);
  const feedEndRef = useRef(null);

  useEffect(() => {
    function handleAction(data) {
      if (transactionId && data.transactionId && String(data.transactionId) !== String(transactionId)) {
        return;
      }
      setLogs((prev) => [...prev.slice(-49), { ...data, id: Math.random() }]);
    }

    function handlePolicyCheck(data) {
      if (transactionId && String(data.transactionId) !== String(transactionId)) return;
      setLogs((prev) => [
        ...prev.slice(-49),
        {
          id: Math.random(),
          actor: "POLICY_ENGINE",
          action: "POLICY_EVALUATION",
          reason: data.policyResult?.reasons?.join(" | ") || `Risk Level: ${data.riskResult?.riskLevel} (${data.riskResult?.riskScore}/100)`,
          result: data.policyResult?.authorized ? "AUTHORIZED" : "REJECTED",
          timestamp: new Date(),
        },
      ]);
    }

    function handleStateChanged(data) {
      if (transactionId && String(data.transactionId) !== String(transactionId)) return;
      setLogs((prev) => [
        ...prev.slice(-49),
        {
          id: Math.random(),
          actor: "POLICY_ENGINE",
          action: "STATE_TRANSITION",
          reason: `Transaction state transitioned to '${data.state}'`,
          result: data.state,
          timestamp: new Date(),
        },
      ]);
    }

    socket.on("agent.action", handleAction);
    socket.on("policy.check", handlePolicyCheck);
    socket.on("transaction.state_changed", handleStateChanged);

    return () => {
      socket.off("agent.action", handleAction);
      socket.off("policy.check", handlePolicyCheck);
      socket.off("transaction.state_changed", handleStateChanged);
    };
  }, [transactionId]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  function getActorDotColor(actor) {
    switch (actor) {
      case "BUYER_AGENT":
        return "bg-brand-400";
      case "MERCHANT_AGENT":
        return "bg-purple-400";
      case "POLICY_ENGINE":
        return "bg-amber-400";
      case "HUMAN":
        return "bg-emerald-400";
      default:
        return "bg-slate-400";
    }
  }

  return (
    <div className="bg-ink-900 text-slate-100 font-mono rounded-2xl p-4 shadow-card border border-slate-800 space-y-3">
      {/* Terminal Top Window Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
          <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
          <span className="text-xs text-slate-400 ml-2 font-sans font-semibold">
            Live Activity Feed (Socket.IO Stream)
          </span>
        </div>
        <span className="text-[10px] text-green-400 bg-green-950/60 px-2 py-0.5 rounded border border-green-800/40">
          ● LIVE STREAM
        </span>
      </div>

      {/* Terminal Log Output List */}
      <div className="space-y-2 max-h-64 overflow-y-auto text-xs pr-1">
        {logs.length === 0 ? (
          <p className="text-slate-500 italic text-[11px] py-4 text-center">
            Awaiting real-time agent activity & policy socket events...
          </p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-2.5 py-1 border-b border-slate-800/50">
              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                {new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false })}
              </span>

              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getActorDotColor(log.actor)}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-200">{log.actor || "SYSTEM"}</span>
                  <span className="text-slate-400 text-[10px]">[{log.action}]</span>
                </div>
                <p className="text-slate-300 text-[11px] truncate mt-0.5">{log.reason}</p>
              </div>

              {log.result && (
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0 font-sans">
                  {log.result}
                </span>
              )}
            </div>
          ))
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
}
