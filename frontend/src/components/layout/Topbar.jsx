import { Menu, Zap } from "lucide-react";
import Badge from "../common/Badge.jsx";

export default function Topbar({ onToggleMobile, activeTabName = "Dashboard", health, socketConnected, onNavigate }) {
  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-surface-border px-4 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobile}
            className="md:hidden p-2 rounded-xl border border-surface-border bg-surface-alt text-ink-400 hover:text-white hover:border-brand-500/40 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className="flex items-center space-x-2.5 cursor-pointer md:cursor-default"
            onClick={() => onNavigate && onNavigate("home")}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 via-glow-cyan to-glow-rose p-0.5 shadow-sm md:hidden">
              <div className="w-full h-full bg-surface rounded-[6px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-brand-500" />
              </div>
            </div>
            <div>
              <h1 className="text-base lg:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>
                  Agent<span className="brand-pay">Pay</span>
                </span>
                <span className="text-ink-400 font-normal text-xs hidden sm:inline">• {activeTabName}</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Health & System Badges */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-2 bg-surface-alt px-3 py-1.5 rounded-xl border border-surface-border">
            <span className="text-ink-400 text-[11px]">API:</span>
            <Badge status={health?.status === "ok" ? "PAID" : "FAILED"}>
              {health?.status === "ok" ? "OK" : "Offline"}
            </Badge>
          </div>

          <div className="flex items-center space-x-2 bg-surface-alt px-3 py-1.5 rounded-xl border border-surface-border">
            <span className="text-ink-400 text-[11px]">Socket:</span>
            <Badge status={socketConnected ? "PAID" : "PENDING"}>
              {socketConnected ? "Connected" : "Connecting"}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
