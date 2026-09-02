import Card from "../components/common/Card.jsx";
import Button from "../components/common/Button.jsx";

export default function LandingPage({ onNavigate }) {
  return (
    <div className="space-y-12 animate-slideIn">
      {/* Hero Section (design.md Section 5.1) */}
      <div className="bg-gradient-to-b from-white to-surface-alt border border-surface-border p-8 md:p-12 rounded-3xl shadow-card text-center space-y-6">
        <div className="inline-flex items-center space-x-2 bg-brand-50 border border-brand-200 px-3.5 py-1.5 rounded-full text-brand-700 text-xs font-semibold font-mono">
          <span>⚡</span>
          <span>AgentPay Protocol v1.0 • Built for Hackathon Judges</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-ink-900 tracking-tight max-w-4xl mx-auto leading-tight">
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

      {/* Architecture Value Pillars */}
      <div>
        <h2 className="text-center text-xs font-bold uppercase tracking-wider text-ink-400 mb-6">
          Core Protocol Architecture Pillars
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="space-y-3 hover:border-brand-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-xl">
              🛡️
            </div>
            <h3 className="text-base font-bold text-ink-900">Non-LLM Policy Engine</h3>
            <p className="text-xs text-ink-400 leading-relaxed">
              Pure, deterministic JavaScript governance layer ensuring zero LLM financial hallucination. Enforces spending limits & category blacklists.
            </p>
          </Card>

          <Card className="space-y-3 hover:border-brand-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 font-bold flex items-center justify-center text-xl">
              ⏱️
            </div>
            <h3 className="text-base font-bold text-ink-900">Mongo Idempotency</h3>
            <p className="text-xs text-ink-400 leading-relaxed">
              Atomic unique-index constraint pattern guaranteeing zero double-charging on network retries without Redis or Docker dependencies.
            </p>
          </Card>

          <Card className="space-y-3 hover:border-brand-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 font-bold flex items-center justify-center text-xl">
              📜
            </div>
            <h3 className="text-base font-bold text-ink-900">Immutable Audit Trail</h3>
            <p className="text-xs text-ink-400 leading-relaxed">
              Verifiable database changelog and real-time Socket.IO stream logging every agent offer, policy evaluation, and payment event.
            </p>
          </Card>

          <Card className="space-y-3 hover:border-brand-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-xl">
              💳
            </div>
            <h3 className="text-base font-bold text-ink-900">Razorpay Escrow Protocol</h3>
            <p className="text-xs text-ink-400 leading-relaxed">
              Seamless test-mode escrow order creation, signature-verified webhooks, and payment timeout recovery state holding.
            </p>
          </Card>
        </div>
      </div>

      {/* Protocol Quick-Start Guide Callout */}
      <Card className="bg-surface-alt border-surface-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-base font-bold text-ink-900">Ready to test the full AgentPay lifecycle?</h3>
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
