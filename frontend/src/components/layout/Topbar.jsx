import { Menu, Zap } from "lucide-react";

export default function Topbar({
  onToggleMobile,
  activeTabName = "Dashboard",
  health,
  socketConnected,
  onNavigate,
}) {
  return (
    <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur-md border-b border-surface-border px-4 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Clickable Brand Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobile}
            className="md:hidden p-2 rounded-xl border border-surface-border bg-surface-alt text-ink-400 hover:text-white hover:border-brand-500/40 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* EscrowAI Brand Logo - Clicking takes back to Home */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition-opacity group"
            onClick={() => onNavigate && onNavigate("home")}
            title="Return to Home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 via-glow-cyan to-glow-rose p-0.5 shadow-sm group-hover:scale-105 transition-transform md:hidden">
              <div className="w-full h-full bg-surface rounded-[6px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-brand-500 fill-brand-500/20" />
              </div>
            </div>
            <div>
              <h1 className="text-base lg:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>
                  Escrow<span className="brand-pay">AI</span>
                </span>
                <span className="text-ink-400 font-normal text-xs hidden sm:inline">• {activeTabName}</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Protocol Telemetry Status Indicator */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 bg-surface-alt border border-surface-border px-3 py-1.5 rounded-xl text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                socketConnected || health?.status === "ok"
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse"
                  : "bg-amber-400"
              }`}
            />
            <span className="text-ink-400 text-[11px]">
              {socketConnected ? "Engine Live" : health?.status === "ok" ? "API Ready" : "Connecting..."}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
