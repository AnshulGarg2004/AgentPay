import Card from "../components/common/Card.jsx";
import Button from "../components/common/Button.jsx";

export default function LandingPage({ onNavigate }) {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-surface-alt border border-surface-border p-8 md:p-14 rounded-3xl shadow-sm text-center space-y-6">
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-brand-500/10 border border-brand-500/30 px-3.5 py-1.5 rounded-full text-brand-400 text-xs font-semibold font-mono">
            <span>⚡</span>
            <span>
              Escrow<span className="brand-pay">AI</span> Protocol v1.0 • Autonomous Escrow Engine
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Autonomous AI Agent Governance & Escrow Settlement Protocol
          </h1>

          <p className="text-sm md:text-base text-ink-400 max-w-2xl mx-auto leading-relaxed">
            Enable autonomous buyer & merchant AI agents to negotiate prices, enforce non-LLM constitutional constraints, and execute idempotent escrow payments with zero human bottleneck.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button variant="primary" size="lg" onClick={() => onNavigate("negotiation")}>
              🤝 Launch AI Negotiation Studio
            </Button>

            <Button variant="secondary" size="lg" onClick={() => onNavigate("buyer-console")}>
              💬 Buyer Console
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
        <h2 className="text-center text-xs font-bold uppercase tracking-wider text-ink-400 mb-6 font-mono">
          Core Protocol Architecture Pillars
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hoverable hasGradientAccent className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold flex items-center justify-center text-lg">
              🛡️
            </div>
            <h3 className="text-base font-bold text-white">Non-LLM Policy Engine</h3>
            <p className="text-xs text-ink-400 leading-relaxed">
              Pure, deterministic JavaScript governance layer ensuring zero LLM financial hallucination. Enforces spending limits & category blacklists.
            </p>
          </Card>

          <Card hoverable hasGradientAccent className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-lg">
              ⏱️
            </div>
            <h3 className="text-base font-bold text-white">Mongo Idempotency</h3>
            <p className="text-xs text-ink-400 leading-relaxed">
              Atomic unique-index constraint pattern guaranteeing zero double-charging on network retries without Redis or Docker dependencies.
            </p>
          </Card>

          <Card hoverable hasGradientAccent className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-lg">
              📜
            </div>
            <h3 className="text-base font-bold text-white">Immutable Audit Trail</h3>
            <p className="text-xs text-ink-400 leading-relaxed">
              Verifiable database changelog and real-time Socket.IO stream logging every agent offer, policy evaluation, and payment event.
            </p>
          </Card>

          <Card hoverable hasGradientAccent className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-lg">
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
      <div>
        <Card hoverable className="bg-surface-alt border-surface-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-base font-bold text-white">Ready to test the full EscrowAI lifecycle?</h3>
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
    </div>
  );
}
