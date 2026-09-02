import { motion } from "framer-motion";
import Card from "../components/common/Card.jsx";
import Button from "../components/common/Button.jsx";

export default function LandingPage({ onNavigate }) {
  return (
    <div className="space-y-12">
      {/* Hero Section with slow animated gradient background */}
      <div className="relative overflow-hidden bg-surface-alt border border-surface-border p-8 md:p-14 rounded-3xl shadow-card text-center space-y-6">
        {/* Animated Gradient Background */}
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-500 via-glow-cyan to-glow-rose bg-[length:200%_200%]"
        />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-brand-500/10 border border-brand-500/30 px-3.5 py-1.5 rounded-full text-brand-500 text-xs font-semibold font-mono">
            <span>⚡</span>
            <span>Agent<span className="brand-pay">Pay</span> Protocol v1.0 • Autonomous Escrow Engine</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Autonomous AI Agent Governance & Escrow Settlement Protocol
          </h1>

          <p className="text-base text-ink-400 max-w-2xl mx-auto leading-relaxed">
            Enable autonomous buyer & merchant AI agents to negotiate prices, enforce non-LLM constitutional constraints, and execute idempotent escrow payments with zero human bottleneck.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button variant="primary" size="lg" onClick={() => onNavigate("negotiation")}>
              🤝 Launch AI Negotiation Studio
            </Button>

            <Button variant="secondary" size="lg" onClick={() => onNavigate("merchant-dashboard")}>
              📊 Merchant Operations Dashboard
            </Button>

            <Button variant="secondary" size="lg" onClick={() => onNavigate("approvals")}>
              🛡️ Operations Approval Queue
            </Button>
          </div>
        </div>
      </div>

      {/* Architecture Value Pillars */}
      <div>
        <h2 className="text-center text-xs font-bold uppercase tracking-wider text-ink-400 mb-6">
          Core Protocol Architecture Pillars
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hasGradientAccent className="space-y-3 hover:border-brand-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 font-bold flex items-center justify-center text-xl">
              🛡️
            </div>
            <h3 className="text-base font-bold text-white">Non-LLM Policy Engine</h3>
            <p className="text-xs text-ink-400 leading-relaxed">
              Pure, deterministic JavaScript governance layer ensuring zero LLM financial hallucination. Enforces spending limits & category blacklists.
            </p>
          </Card>

          <Card hasGradientAccent className="space-y-3 hover:border-brand-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 font-bold flex items-center justify-center text-xl">
              ⏱️
            </div>
            <h3 className="text-base font-bold text-white">Mongo Idempotency</h3>
            <p className="text-xs text-ink-400 leading-relaxed">
              Atomic unique-index constraint pattern guaranteeing zero double-charging on network retries without Redis or Docker dependencies.
            </p>
          </Card>

          <Card hasGradientAccent className="space-y-3 hover:border-brand-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center text-xl">
              📜
            </div>
            <h3 className="text-base font-bold text-white">Immutable Audit Trail</h3>
            <p className="text-xs text-ink-400 leading-relaxed">
              Verifiable database changelog and real-time Socket.IO stream logging every agent offer, policy evaluation, and payment event.
            </p>
          </Card>

          <Card hasGradientAccent className="space-y-3 hover:border-brand-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center text-xl">
              💳
            </div>
            <h3 className="text-base font-bold text-white">Razorpay Escrow Protocol</h3>
            <p className="text-xs text-ink-400 leading-relaxed">
              Seamless test-mode escrow order creation, signature-verified webhooks, and payment timeout recovery state holding.
            </p>
          </Card>
        </div>
      </div>

      {/* Protocol Quick-Start Guide Callout */}
      <Card className="bg-surface-alt border-surface-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-base font-bold text-white">Ready to test the full AgentPay lifecycle?</h3>
          <p className="text-xs text-ink-400 mt-1">
            Initiate a negotiation, accept a quote, trigger policy engine evaluation, and execute idempotent escrow payment.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Button variant="primary" size="sm" onClick={() => onNavigate("explorer")}>
            🔍 Open Transaction Explorer
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onNavigate("buyer-dashboard")}>
            💼 Buyer Portal
          </Button>
        </div>
      </Card>
    </div>
  );
}
