import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage.jsx";
import MerchantOnboarding from "./pages/merchant/MerchantOnboarding.jsx";
import MerchantDashboard from "./pages/merchant/MerchantDashboard.jsx";
import BuyerDashboard from "./pages/buyer/BuyerDashboard.jsx";
import BuyerConsole from "./pages/buyer/BuyerConsole.jsx";
import TransactionExplorer from "./pages/transaction/TransactionExplorer.jsx";
import TransactionDetailPage from "./pages/transaction/TransactionDetailPage.jsx";
import NegotiationThread from "./components/negotiation/NegotiationThread.jsx";
import ApprovalQueue from "./components/approval/ApprovalQueue.jsx";
import LiveActivityFeed from "./components/audit/LiveActivityFeed.jsx";
import AuditTrail from "./components/audit/AuditTrail.jsx";
import Card from "./components/common/Card.jsx";
import Sidebar, { NAV_ITEMS } from "./components/layout/Sidebar.jsx";
import Topbar from "./components/layout/Topbar.jsx";
import PageShell from "./components/layout/PageShell.jsx";
import { api } from "./lib/api.js";
import { socket } from "./lib/socket.js";
import { formatRupee } from "./lib/format.js";

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem("agentpay_active_tab");
    return saved || "buyer-console";
  });
  const [selectedTxnId, setSelectedTxnId] = useState(() => {
    return localStorage.getItem("agentpay_selected_txn_id") || null;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [health, setHealth] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Products available for demo negotiation
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [negotiationPreFill, setNegotiationPreFill] = useState(null);

  // Sync activeTab & selectedTxnId to localStorage
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem("agentpay_active_tab", activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedTxnId) {
      localStorage.setItem("agentpay_selected_txn_id", selectedTxnId);
    } else {
      localStorage.removeItem("agentpay_selected_txn_id");
    }
  }, [selectedTxnId]);

  useEffect(() => {
    api
      .get("/health")
      .then((res) => setHealth(res.data))
      .catch((err) => setHealth({ status: "error", message: err.message }));

    api
      .get("/products/search")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.products || [];
        setProducts(list);
        if (list.length > 0) {
          setSelectedProductId(list[0]._id);
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

  function handleInitiateNegotiationFromConsole(params) {
    if (params.productId) {
      setSelectedProductId(params.productId);
      setNegotiationPreFill(params);
    }
    setActiveTab("negotiation");
  }

  const activeNavItem = NAV_ITEMS.find((n) => n.id === activeTab);
  const activeTabName = activeNavItem ? activeNavItem.label : activeTab === "detail" ? "Transaction Detail" : "Dashboard";

  return (
    <div className="min-h-screen bg-surface font-sans text-white flex flex-col relative overflow-x-hidden">
      {/* Ambient Blurred Background Glow Circles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Left Brand Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/15 rounded-full blur-[120px]" />
        {/* Top-Right Purple Glow */}
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px]" />
        {/* Bottom-Center Cyan Glow */}
        <div className="absolute -bottom-24 left-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Sidebar Layout */}
      <Sidebar
        activeTab={activeTab}
        onNavigate={(tab) => setActiveTab(tab)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="md:pl-16 lg:pl-64 flex flex-col flex-1 min-h-screen transition-all duration-200">
        <Topbar
          onToggleMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          activeTabName={activeTabName}
          health={health}
          socketConnected={socketConnected}
          onNavigate={(tab) => setActiveTab(tab)}
        />

        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 flex-1 w-full">
          {activeTab === "home" && (
            <PageShell key="home">
              <LandingPage onNavigate={(tab) => setActiveTab(tab)} />
            </PageShell>
          )}

          {activeTab === "buyer-console" && (
            <PageShell key="buyer-console">
              <BuyerConsole onInitiateNegotiation={handleInitiateNegotiationFromConsole} />
            </PageShell>
          )}

          {activeTab === "onboarding" && (
            <PageShell key="onboarding">
              <MerchantOnboarding />
            </PageShell>
          )}

          {activeTab === "approvals" && (
            <PageShell key="approvals">
              <ApprovalQueue />
            </PageShell>
          )}

          {activeTab === "merchant-dashboard" && (
            <PageShell key="merchant-dashboard">
              <MerchantDashboard onSelectTransaction={handleSelectTransaction} />
            </PageShell>
          )}

          {activeTab === "buyer-dashboard" && (
            <PageShell key="buyer-dashboard">
              <BuyerDashboard onSelectTransaction={handleSelectTransaction} />
            </PageShell>
          )}

          {activeTab === "explorer" && (
            <PageShell key="explorer">
              <TransactionExplorer onSelectTransaction={handleSelectTransaction} />
            </PageShell>
          )}

          {activeTab === "detail" && selectedTxnId && (
            <PageShell key="detail">
              <div className="space-y-4">
                <button
                  onClick={() => setActiveTab("explorer")}
                  className="text-xs font-semibold text-brand-500 hover:text-brand-400 flex items-center space-x-1 transition-colors"
                >
                  <span>← Back to Transaction Explorer</span>
                </button>
                <TransactionDetailPage transactionId={selectedTxnId} />
              </div>
            </PageShell>
          )}

          {activeTab === "audit" && (
            <PageShell key="audit">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Live Protocol Audit & Activity Stream</h1>
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
            </PageShell>
          )}

          {activeTab === "negotiation" && (
            <PageShell key="negotiation">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Autonomous AI Negotiation Studio</h1>
                  <p className="text-sm text-ink-400 mt-1">
                    Select a product from the catalog to initiate real-time AI negotiation between Buyer Agent and Merchant Policy Engine.
                  </p>
                </div>

                {/* Product Selector Ribbon */}
                <Card hasGradientAccent className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-ink-400">
                    Select Product for Negotiation Demo ({products.length} Products Available)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {products.map((p) => {
                      const isSelected = p._id === selectedProductId;
                      return (
                        <button
                          key={p._id}
                          onClick={() => {
                            setSelectedProductId(p._id);
                            setNegotiationPreFill(null);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                            isSelected
                              ? "bg-brand-500/20 border-brand-500 text-white ring-2 ring-brand-500/30"
                              : "bg-surface-alt border-surface-border text-ink-700 hover:bg-surface-border hover:text-white"
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
                </Card>

                {/* Negotiation Thread Component */}
                {selectedProductId ? (
                  <NegotiationThread
                    productId={selectedProductId}
                    initialQuantity={negotiationPreFill?.quantity}
                    initialTargetPriceInPaise={negotiationPreFill?.targetPriceInPaise}
                    initialDeliveryDays={negotiationPreFill?.requestedDeliveryDays}
                    initialNotes={negotiationPreFill?.notes}
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
            </PageShell>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-surface border-t border-surface-border py-6 px-8 text-center text-xs text-ink-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-brand-500 shadow-glow" />
              <span>
                Agent<span className="brand-pay">Pay</span> Protocol • Non-LLM Governance & Escrow Settlement
              </span>
            </div>
            <div>Built with React, Vite, Tailwind CSS, Express, MongoDB & Socket.IO</div>
          </div>
        </footer>
      </div>
    </div>
  );
}