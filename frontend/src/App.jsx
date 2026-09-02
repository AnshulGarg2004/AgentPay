import { useEffect, useState } from "react";
import MerchantOnboarding from "./pages/merchant/MerchantOnboarding.jsx";
import NegotiationThread from "./components/negotiation/NegotiationThread.jsx";
import Badge from "./components/common/Badge.jsx";
import Card from "./components/common/Card.jsx";
import Button from "./components/common/Button.jsx";
import { api } from "./lib/api.js";
import { socket } from "./lib/socket.js";
import { formatRupee } from "./lib/format.js";

export default function App() {
  const [activeTab, setActiveTab] = useState("negotiation"); // 'onboarding' | 'negotiation'
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

  return (
    <div className="min-h-screen bg-surface-alt font-sans text-ink-700">
      {/* Top Bar Navigation */}
      <header className="bg-white border-b border-surface-border shadow-card px-8 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 text-white font-bold flex items-center justify-center text-xl shadow-sm">
              A
            </div>
            <div>
              <span className="text-lg font-bold text-ink-900 tracking-tight">AgentPay</span>
              <span className="text-xs text-ink-400 block -mt-1 font-mono">Autonomous AI Agent Commerce & Settlement</span>
            </div>
          </div>

          {/* Tab Switcher Navigation */}
          <div className="flex items-center space-x-2 bg-surface-alt p-1 rounded-xl border border-surface-border">
            <button
              onClick={() => setActiveTab("negotiation")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "negotiation"
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-400 hover:text-ink-900"
              }`}
            >
              🤝 AI Negotiation & Quotes (Phase 3)
            </button>
            <button
              onClick={() => setActiveTab("onboarding")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "onboarding"
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-400 hover:text-ink-900"
              }`}
            >
              🏬 Merchant Onboarding & Catalog (Phase 1)
            </button>
          </div>

          {/* System Health Indicators */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-ink-400">Backend API:</span>
              <Badge status={health?.status === "ok" ? "PAID" : "FAILED"}>
                {health?.status === "ok" ? "GET /api/health OK" : "API Offline"}
              </Badge>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-ink-400">Socket.IO:</span>
              <Badge status={socketConnected ? "PAID" : "PENDING"}>
                {socketConnected ? "Live Connected" : "Connecting..."}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === "onboarding" && <MerchantOnboarding />}

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
              <NegotiationThread productId={selectedProductId} />
            ) : (
              <Card>
                <p className="text-xs text-ink-400">Please seed products first by running `npm run seed` in backend directory.</p>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}