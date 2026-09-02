import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "../../lib/socket.js";
import Card from "../common/Card.jsx";

function getActorNodeInfo(actor, action, result) {
  const isRejected = result === "REJECTED" || result === "POLICY_REJECTED" || result === "FAILED";

  let icon = "⚡";
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

export default function LiveActivityFeed({ transactionId = null }) {
  const [logs, setLogs] = useState([]);
  const feedEndRef = useRef(null);

  useEffect(() => {
    function handleAction(data) {
      if (transactionId && data.transactionId && String(data.transactionId) !== String(transactionId)) {
        return;
      }
      setLogs((prev) => [...prev.slice(-19), { ...data, id: Math.random() }]);
    }

    function handlePolicyCheck(data) {
      if (transactionId && String(data.transactionId) !== String(transactionId)) return;
      setLogs((prev) => [
        ...prev.slice(-19),
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
        ...prev.slice(-19),
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

  return (
    <Card className="space-y-4 bg-[#0c101d] border border-[#1e2638]">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#1e2638] pb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Live Stream Node Execution Graph
          </h3>
        </div>
        <span className="text-[10px] text-[#10b981] bg-[#10b981]/20 px-2 py-0.5 rounded border border-[#10b981]/30 font-mono font-bold">
          SOCKET.IO ACTIVE
        </span>
      </div>

      {/* Node Stream Container */}
      <div className="max-h-96 overflow-y-auto pr-1 space-y-0 relative">
        {logs.length === 0 ? (
          <p className="text-xs text-[#828fa3] italic text-center py-8">
            Awaiting real-time socket events & workflow execution nodes...
          </p>
        ) : (
          <div className="flex flex-col items-center">
            <AnimatePresence initial={false}>
              {logs.map((log, index) => {
                const isLatest = index === logs.length - 1;
                const { icon, isRejected } = getActorNodeInfo(log.actor, log.action, log.result);

                let cardBg = "bg-[#090d16] border-[#10b981]/80 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-[#10b981]/40";
                let badgeBg = "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40";

                if (isRejected) {
                  cardBg = "bg-[#160b0f] border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/40";
                  badgeBg = "bg-rose-500/20 text-rose-400 border-rose-500/40";
                } else if (!isLatest) {
                  cardBg = "bg-[#0b0f19] border-[#6366f1]/60 shadow-[0_0_10px_rgba(99,102,241,0.15)] ring-1 ring-[#6366f1]/30 opacity-90";
                  badgeBg = "bg-[#6366f1]/20 text-[#818cf8] border-[#6366f1]/40";
                }

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full flex flex-col items-center group"
                  >
                    {/* Node Card Box */}
                    <div className={`w-full p-3.5 rounded-2xl border transition-all duration-300 ${cardBg}`}>
                      <div className="flex flex-col items-center text-center space-y-1">
                        <span className="text-lg">{icon}</span>
                        <h4 className="text-xs font-bold font-mono text-white tracking-tight">
                          {log.action || log.actor}
                        </h4>
                        <p className="text-[11px] text-[#828fa3] font-sans line-clamp-2">
                          {log.reason}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-surface-border/50 text-[10px] font-mono">
                        <span className="text-[#828fa3]">{log.actor}</span>
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

                    {/* Connecting Line */}
                    {index < logs.length - 1 && (
                      <div className="w-0.5 h-5 bg-gradient-to-b from-[#10b981] to-[#6366f1] shadow-[0_0_6px_rgba(16,185,129,0.4)] my-0.5" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        <div ref={feedEndRef} />
      </div>
    </Card>
  );
}
