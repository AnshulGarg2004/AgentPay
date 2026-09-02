import { useEffect, useState } from "react";
import MerchantOnboarding from "./pages/merchant/MerchantOnboarding.jsx";
import Badge from "./components/common/Badge.jsx";
import { api } from "./lib/api.js";
import { socket } from "./lib/socket.js";

export default function App() {
  const [health, setHealth] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    api
      .get("/health")
      .then((res) => setHealth(res.data))
      .catch((err) => setHealth({ status: "error", message: err.message }));

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
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500 text-white font-bold flex items-center justify-center text-lg shadow-sm">
              A
            </div>
            <div>
              <span className="text-lg font-bold text-ink-900 tracking-tight">AgentPay</span>
              <span className="text-xs text-ink-400 block -mt-1 font-mono">Monorepo Phase 1 · Scaffolding & Data Layer</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
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
      <main className="px-8 py-8">
        <MerchantOnboarding />
      </main>
    </div>
  );
}