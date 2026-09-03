import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Search,
  BarChart3,
  Briefcase,
  ScrollText,
  Store,
  X,
  Zap,
} from "lucide-react";

export const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "buyer-console", label: "Buyer Console", icon: MessageSquare },
  { id: "negotiation", label: "AI Studio", icon: Sparkles },
  { id: "approvals", label: "Approval Queue", icon: ShieldCheck },
  { id: "explorer", label: "Explorer", icon: Search },
  { id: "merchant-dashboard", label: "Merchant Ops", icon: BarChart3 },
  { id: "buyer-dashboard", label: "Buyer Portal", icon: Briefcase },
  { id: "audit", label: "Live Audit", icon: ScrollText },
  { id: "onboarding", label: "Onboarding", icon: Store },
];

export default function Sidebar({ activeTab, onNavigate, mobileOpen = false, onCloseMobile }) {
  const isTabActive = (item) => {
    if (activeTab === item.id) return true;
    if (item.id === "explorer" && activeTab === "detail") return true;
    return false;
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-surface border-r border-surface-border py-5 px-3">
      {/* Header Logo (Clicking EscrowAI navigates to Home) */}
      <div>
        <div
          onClick={() => {
            onNavigate("home");
            if (onCloseMobile) onCloseMobile();
          }}
          className="flex items-center space-x-3 px-3 pb-6 border-b border-surface-border cursor-pointer hover:opacity-90 transition-opacity group"
          title="Go to Home"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 via-glow-cyan to-glow-rose p-0.5 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-brand-500 fill-brand-500/20" />
            </div>
          </div>
          <div className="hidden lg:block overflow-hidden">
            <span className="text-xl font-bold text-white tracking-tight block">
              Escrow<span className="brand-pay">AI</span>
            </span>
            <span className="text-[10px] text-ink-400 font-mono block -mt-0.5 tracking-wider">ESCROW PROTOCOL</span>
          </div>
          {mobileOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onCloseMobile) onCloseMobile();
              }}
              className="ml-auto md:hidden p-1.5 rounded-lg text-ink-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isTabActive(item);

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`relative w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 group ${
                  active ? "text-white" : "text-ink-400 hover:text-ink-700 hover:bg-white/5"
                }`}
              >
                {/* Active Indicator Bar & Pill via Framer Motion layoutId */}
                {active && (
                  <>
                    {/* Background Pill */}
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500/20 via-brand-500/10 to-transparent border border-brand-500/30"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                    {/* Left 3px Gradient Bar */}
                    <motion.div
                      layoutId="sidebar-active-bar"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-brand-500 via-glow-cyan to-glow-rose"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  </>
                )}

                <Icon className={`w-4 h-4 z-10 transition-transform group-hover:scale-110 ${active ? "text-brand-500" : "text-ink-400"}`} />
                <span className="hidden lg:inline z-10 tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-surface-border px-3 text-center lg:text-left">
        <div className="hidden lg:flex items-center space-x-2 text-[11px] font-mono text-ink-400">
          <span className="w-2 h-2 rounded-full bg-success shadow-sm animate-pulse" />
          <span>Protocol Active</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 z-40 w-16 lg:w-64 transition-all duration-200">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
