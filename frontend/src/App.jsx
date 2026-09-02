import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage.jsx";
import MerchantOnboarding from "./pages/merchant/MerchantOnboarding.jsx";
import MerchantDashboard from "./pages/merchant/MerchantDashboard.jsx";
import BuyerDashboard from "./pages/buyer/BuyerDashboard.jsx";
import TransactionExplorer from "./pages/transaction/TransactionExplorer.jsx";
import TransactionDetailPage from "./pages/transaction/TransactionDetailPage.jsx";
import NegotiationThread from "./components/negotiation/NegotiationThread.jsx";
import ApprovalQueue from "./components/approval/ApprovalQueue.jsx";
import LiveActivityFeed from "./components/audit/LiveActivityFeed.jsx";
import AuditTrail from "./components/audit/AuditTrail.jsx";
import Badge from "./components/common/Badge.jsx";
import Card from "./components/common/Card.jsx";
import { api } from "./lib/api.js";
import { socket } from "./lib/socket.js";
import { formatRupee } from "./lib/format.js";

export default function App() {
  const [activeTab, setActiveTab] = useState("home"); // 'home' | 'negotiation' | 'approvals' | 'explorer' | 'merchant-dashboard' | 'buyer-dashboard' | 'audit' | 'onboarding' | 'detail'
  const [selectedTxnId, setSelectedTxnId] = useState(null);

  const [health, setHealth] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Products available for demo negotiation
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);

  useEffect(() => {
    api
      .get("/health")
      .then((res) => setHealth(res.data))
      .catch((err) => setHealth({ status: "error", message: err.message }));

    api
      .get("/products/search")
      .then((res) => {
        setProducts(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedProductId(res.data[0]._id);
        }
      })
      .catch(console.error);

    function onConnect() {
      setSocketConnected(true);
    }
    function onDisconnect() {
      setSocketConnected(false);
    }

    if (socket.connected) {
      setSocketConnected(true);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  function handleSelectTransaction(txnId) {
    setSelectedTxnId(txnId);
    setActiveTab("detail");
  }

  return (
    <div className="min-h-screen bg-surface-alt font-sans text-ink-700 flex flex-col">
      {/* Top Bar Navigation */}
      <header className="bg-white border-b border-surface-border shadow-card px-6 py-3.5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("home")}>
            <div className="w-9 h-9 rounded-xl bg-brand-500 text-white font-bold flex items-center justify-center text-xl shadow-sm">
              A
            </div>
            <div>
              <span className="text-lg font-bold text-ink-900 tracking-tight">AgentPay</span>
              <span className="text-xs text-ink-400 block -mt-1 font-mono">Autonomous AI Agent Governance & Escrow</span>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex items-center flex-wrap gap-1 bg-surface-alt p-1 rounded-xl border border-surface-border text-xs">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "home" ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-900"
              }`}
            >
              🏠 Home
            </button>
            <button
              onClick={() => setActiveTab("negotiation")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "negotiation" ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-900"
              }`}
            >
              🤝 AI Studio
            </button>
            <button
              onClick={() => setActiveTab("approvals")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "approvals" ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-900"
              }`}
            >
              🛡️ Approval Queue
            </button>
            <button
              onClick={() => setActiveTab("explorer")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "explorer" || activeTab === "detail" ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-900"
              }`}
            >
              🔍 Explorer
            </button>
            <button
              onClick={() => setActiveTab("merchant-dashboard")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "merchant-dashboard" ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-900"
              }`}
            >
              📊 Merchant Ops
            </button>
            <button
              onClick={() => setActiveTab("buyer-dashboard")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "buyer-dashboard" ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-900"
              }`}
            >
              💼 Buyer Portal
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "audit" ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-900"
              }`}
            >
              📜 Live Audit
            </button>
            <button
              onClick={() => setActiveTab("onboarding")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "onboarding" ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-900"
              }`}
            >
              🏬 Onboarding
            </button>
          </div>

          {/* Health Badges */}
          <div className="hidden xl:flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="text-ink-400">API:</span>
              <Badge status={health?.status === "ok" ? "PAID" : "FAILED"}>
                {health?.status === "ok" ? "OK" : "Offline"}
              </Badge>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="text-ink-400">Socket:</span>
              <Badge status={socketConnected ? "PAID" : "PENDING"}>
                {socketConnected ? "Connected" : "Connecting"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {activeTab === "home" && <LandingPage onNavigate={(tab) => setActiveTab(tab)} />}

        {activeTab === "onboarding" && <MerchantOnboarding />}

        {activeTab === "approvals" && <ApprovalQueue />}

        {activeTab === "merchant-dashboard" && (
          <MerchantDashboard onSelectTransaction={handleSelectTransaction} />
        )}

        {activeTab === "buyer-dashboard" && (
          <BuyerDashboard onSelectTransaction={handleSelectTransaction} />
        )}

        {activeTab === "explorer" && (
          <TransactionExplorer onSelectTransaction={handleSelectTransaction} />
        )}

        {activeTab === "detail" && selectedTxnId && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveTab("explorer")}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
            >
              <span>← Back to Transaction Explorer</span>
            </button>
            <TransactionDetailPage transactionId={selectedTxnId} />
          </div>
        )}

        {activeTab === "audit" && (
          <div className="space-y-6 animate-slideIn">
            <div>
              <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Live Protocol Audit & Activity Stream</h1>
              <p className="text-sm text-ink-400 mt-1">
                Real-time Socket.IO stream and immutable database audit logs for all AI decision steps.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <LiveActivityFeed />
              </div>
              <div className="lg:col-span-6">
                <AuditTrail />
              </div>
            </div>
          </div>
        )}

        {activeTab === "negotiation" && (
          <div className="space-y-6 animate-slideIn">
            <div>
              <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Autonomous AI Negotiation Studio</h1>
              <p className="text-sm text-ink-400 mt-1">
                Select a product from the catalog to initiate real-time AI negotiation between Buyer Agent and Merchant Policy Engine.
              </p>
            </div>

            {/* Product Selector Ribbon */}
            <div className="bg-white p-4 rounded-2xl shadow-card border border-surface-border space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-700">
                Select Product for Negotiation Demo ({products.length} Products Available)
              </label>
              <div className="flex flex-wrap gap-2">
                {products.map((p) => {
                  const isSelected = p._id === selectedProductId;
                  return (
                    <button
                      key={p._id}
                      onClick={() => setSelectedProductId(p._id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        isSelected
                          ? "bg-brand-50 border-brand-500 text-brand-700 ring-2 ring-brand-500/20"
                          : "bg-white border-surface-border text-ink-700 hover:bg-surface-alt"
                      }`}
                    >
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-[11px] font-mono text-ink-400 mt-0.5">
                        Base: {formatRupee(p.priceInPaise)} | Floor: {formatRupee(p.minPriceInPaise)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Negotiation Thread Component */}
            {selectedProductId ? (
              <NegotiationThread
                productId={selectedProductId}
                onQuoteGenerated={(quote) => {
                  console.log("Quote created:", quote);
                }}
              />
            ) : (
              <Card>
                <p className="text-xs text-ink-400">Please seed products first by running `npm run seed` in backend directory.</p>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-surface-border py-6 px-8 text-center text-xs text-ink-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            <span>AgentPay Protocol • Non-LLM Governance & Escrow Settlement</span>
          </div>
          <div>Built with React, Vite, Tailwind CSS, Express, MongoDB & Socket.IO</div>
        </div>
      </footer>
    </div>
  );
}