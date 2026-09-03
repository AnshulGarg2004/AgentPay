import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import { formatRupee } from "../../lib/format.js";
import { api } from "../../lib/api.js";

const QUICK_PROMPTS = [
  "50 ergonomic office chairs, black, under ₹7,500 each, delivered within 10 days",
  "I need 20 laptops under ₹80,000 each with 16GB RAM.",
  "Find me 100 office chairs with delivery within 7 days.",
  "I need 30 black monitors below ₹25,000.",
];

export default function BuyerConsole({ onInitiateNegotiation }) {
  const [promptInput, setPromptInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "AGENT",
      type: "SYSTEM_WELCOME",
      text: "Hello! I am your EscrowAI Buyer Agent. Describe what products you need in natural English (e.g. quantity, budget, specifications, delivery deadline), and I will analyze your intent and rank matching catalog items for negotiation.",
      timestamp: new Date(),
    },
  ]);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current && messages.length > 1) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    const query = promptInput.trim();
    if (!query || isLoading) return;

    // Add Human Message
    const userMessage = {
      id: `usr_${Date.now()}`,
      sender: "HUMAN",
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPromptInput("");
    setIsLoading(true);

    try {
      // Call Backend Natural-Language Search API
      const res = await api.get(`/products/search?q=${encodeURIComponent(query)}`);
      const data = res.data;

      // Add Agent Response Message with Parsed Intent & Ranked Matching Products
      const agentMessage = {
        id: `agt_${Date.now()}`,
        sender: "AGENT",
        type: "SEARCH_RESULTS",
        originalPrompt: query,
        intent: data.intent,
        matches: data.matches || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      console.error("Search API error:", err);
      const errorMessage = {
        id: `err_${Date.now()}`,
        sender: "AGENT",
        type: "ERROR",
        text: "Failed to connect to Buyer Intent AI agent or process query: " + (err.response?.data?.error || err.message),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Escrow<span className="brand-pay">AI</span> Buyer Console
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Describe your B2B procurement needs in plain English. Our Buyer & Merchant agents parse structured intent, query real inventory, and prepare terms for negotiation.
        </p>
      </div>

      {/* Main Conversational Chat Container */}
      <Card className="flex flex-col h-[560px] sm:h-[640px] p-0 overflow-hidden border border-surface-border shadow-card">
        {/* Chat Header Bar */}
        <div className="bg-surface-alt border-b border-surface-border px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-glow-cyan text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
              🤖
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">EscrowAI Autonomous Procurement Assistant</h3>
              <p className="text-[10px] sm:text-[11px] text-ink-400 font-mono">buyerIntentAgent • merchantAgent • Real Mongo Catalog</p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[10px] text-brand-500 bg-brand-500/10 border border-brand-500/30 px-2.5 py-1 rounded-full font-semibold font-mono shrink-0">
            ● READY FOR INQUIRIES
          </span>
        </div>

        {/* Message Scrollable Body */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 bg-surface">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-3"
              >
                {/* Human Buyer Message */}
                {msg.sender === "HUMAN" && (
                  <div className="flex justify-end">
                    <div className="max-w-full sm:max-w-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white p-3.5 sm:p-4 rounded-2xl rounded-tr-none shadow-md space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-brand-100 font-mono">
                        <span>HUMAN BUYER</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                )}

                {/* System Welcome Message */}
                {msg.sender === "AGENT" && msg.type === "SYSTEM_WELCOME" && (
                  <div className="flex justify-start">
                    <div className="max-w-full sm:max-w-2xl bg-surface-alt border border-surface-border p-3.5 sm:p-4 rounded-2xl rounded-tl-none shadow-sm space-y-2">
                      <div className="flex items-center space-x-2 text-[10px] text-brand-500 font-mono font-bold">
                        <span>🤖 BUYER AGENT</span>
                      </div>
                      <p className="text-sm text-ink-700 leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {msg.sender === "AGENT" && msg.type === "ERROR" && (
                  <div className="flex justify-start">
                    <div className="max-w-full sm:max-w-2xl bg-danger-dark/40 border border-danger/30 text-danger p-3.5 sm:p-4 rounded-2xl rounded-tl-none shadow-sm">
                      <p className="text-sm font-semibold">{msg.text}</p>
                    </div>
                  </div>
                )}

                {/* Agent Search Results Message */}
                {msg.sender === "AGENT" && msg.type === "SEARCH_RESULTS" && (
                  <div className="flex justify-start space-y-3 w-full">
                    <div className="w-full max-w-3xl bg-surface-alt border border-surface-border p-3.5 sm:p-5 rounded-2xl rounded-tl-none shadow-sm space-y-4">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-brand-500 shadow-glow inline-block animate-pulseDot shrink-0" />
                          <span className="text-xs font-bold text-white uppercase tracking-wide font-mono">
                            Agent Intent Analysis & Catalog Match
                          </span>
                        </div>
                        <span className="text-[11px] text-ink-400 font-mono">
                          Found {msg.matches.length} matching product(s)
                        </span>
                      </div>

                      {/* Parsed Intent Summary Pill */}
                      {msg.intent && (
                        <div className="bg-surface p-3 rounded-xl border border-surface-border space-y-2">
                          <div className="text-[11px] font-bold text-brand-500 uppercase tracking-wide font-mono">
                            Parsed Intent (Structured JSON):
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                            <span className="bg-surface-alt border border-surface-border px-2 py-1 rounded truncate">
                              Category: <strong>{msg.intent.category || "all"}</strong>
                            </span>
                            <span className="bg-surface-alt border border-surface-border px-2 py-1 rounded truncate">
                              Qty: <strong>{msg.intent.quantity} units</strong>
                            </span>
                            <span className="bg-surface-alt border border-surface-border px-2 py-1 rounded truncate">
                              Max Price: <strong>{msg.intent.maxUnitPriceInPaise ? formatRupee(msg.intent.maxUnitPriceInPaise) : "Any"}</strong>
                            </span>
                            <span className="bg-surface-alt border border-surface-border px-2 py-1 rounded truncate">
                              Deadline: <strong>{msg.intent.deliveryDeadline ? `${msg.intent.deliveryDeadline} days` : "Any"}</strong>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Product Matching Cards */}
                      {msg.matches.length === 0 ? (
                        <div className="p-4 text-center text-xs text-ink-400 italic bg-surface rounded-xl border border-surface-border">
                          No products in the real catalog matched your exact constraints. Try adjusting target price or quantity.
                        </div>
                      ) : (
                        <div className="space-y-4 pt-1">
                          <div className="text-xs font-bold text-white">
                            Matching Catalog Products (Ranked by Merchant Agent):
                          </div>

                          {msg.matches.map((item, idx) => {
                            const p = item.product;
                            return (
                              <div
                                key={p._id || idx}
                                className="p-3.5 sm:p-4 bg-surface border border-surface-border rounded-xl shadow-sm space-y-3 hover:border-brand-500/40 transition-colors"
                              >
                                {/* Product Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div>
                                    <h4 className="text-base font-bold text-white">{p.name}</h4>
                                    <p className="text-xs text-ink-400">
                                      Merchant: <strong className="text-ink-700">{p.merchantId?.name || "Verified Merchant"}</strong>
                                    </p>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <span className="text-lg font-extrabold text-brand-500 font-mono block">
                                      {formatRupee(p.priceInPaise)} / unit
                                    </span>
                                    {p.minPriceInPaise < p.priceInPaise && (
                                      <span className="text-[10px] text-ink-400 font-mono block">
                                        Negotiable down to {formatRupee(p.minPriceInPaise)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Badges Ribbon */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs border-y border-surface-border py-2">
                                  <span className="font-mono text-ink-700">
                                    📦 Stock: <strong>{p.inventory} available</strong>
                                  </span>
                                  <span className="font-mono text-ink-700">
                                    🚚 SLA: <strong>{p.deliveryMinDays}-{p.deliveryMaxDays} days</strong>
                                  </span>
                                  <span className="font-mono text-ink-700">
                                    🛡️ Warranty: <strong>{p.warranty || "1 year"}</strong>
                                  </span>
                                </div>

                                {/* Fact-based Explanation Callout */}
                                <div className="bg-brand-500/10 border border-brand-500/30 p-2.5 rounded-lg text-xs text-brand-500 leading-relaxed font-sans">
                                  <span className="font-bold text-white">💡 Merchant Agent Match Analysis: </span>
                                  {item.explanation}
                                </div>

                                {/* Action Button */}
                                <div className="flex justify-start sm:justify-end pt-1">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="w-full sm:w-auto justify-center"
                                    onClick={() => {
                                      if (onInitiateNegotiation) {
                                        onInitiateNegotiation({
                                          productId: p._id,
                                          quantity: msg.intent?.quantity || 1,
                                          targetPriceInPaise: msg.intent?.maxUnitPriceInPaise || p.priceInPaise,
                                          requestedDeliveryDays: msg.intent?.deliveryDeadline || p.deliveryMinDays || 3,
                                          notes: msg.originalPrompt,
                                        });
                                      }
                                    }}
                                  >
                                    🤝 Initiate AI Negotiation →
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-surface-alt border border-surface-border p-3.5 sm:p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-3">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping shrink-0" />
                <span className="text-xs text-ink-400 font-mono animate-pulse">
                  Buyer & Merchant AI Agents parsing intent and ranking Mongo catalog matches...
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick Prompts & Chat Input Form Footer */}
        <div className="bg-surface-alt border-t border-surface-border p-3 sm:p-4 space-y-3">
          {/* Quick Demo Prompts */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-ink-400 text-[10px] font-bold uppercase shrink-0 font-mono">Demo Examples:</span>
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => setPromptInput(qp)}
                className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-border border border-surface-border text-ink-700 hover:text-white whitespace-nowrap text-[11px] transition-all duration-150 hover:scale-[1.02] hover:-translate-y-0.5 hover:border-slate-500/40 hover:shadow-sm font-medium shrink-0"
              >
                "{qp}"
              </button>
            ))}
          </div>

          {/* Input Textarea & Send Button */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 sm:gap-3">
            <div className="flex-1 space-y-1">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell me what you need... (e.g. 50 ergonomic office chairs, black, under ₹7,500 each, delivered within 10 days)"
                rows={2}
                disabled={isLoading}
                className="w-full p-3 rounded-xl border border-surface-border bg-surface text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-surface-alt resize-none shadow-inner"
              />
              <div className="hidden sm:flex justify-end">
                <span className="text-[10px] text-ink-400 font-mono">
                  Press Enter to send (Shift+Enter for newline)
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading || !promptInput.trim()}
              className="h-11 w-full sm:w-auto shrink-0 px-5 flex items-center justify-center"
            >
              {isLoading ? "Analyzing..." : "Send Request 🚀"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
