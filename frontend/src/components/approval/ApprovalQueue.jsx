import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Card from "../common/Card.jsx";
import Button from "../common/Button.jsx";
import Badge from "../common/Badge.jsx";
import ApprovalModal from "./ApprovalModal.jsx";
import ThresholdBar from "./ThresholdBar.jsx";
import { formatRupee } from "../../lib/format.js";
import { api } from "../../lib/api.js";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function ApprovalQueue() {
  const [pendingTxns, setPendingTxns] = useState([]);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  async function fetchPendingApprovals() {
    setIsLoading(true);
    try {
      const res = await api.get("/approvals/pending");
      setPendingTxns(res.data || []);
    } catch (err) {
      console.error("Failed to fetch pending approvals:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Queue Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Human Operations Approval Queue</h1>
          <p className="text-sm text-ink-400 mt-1">
            Autonomous transactions flagged by the Policy Engine or Risk Scoring system requiring human sign-off.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Badge status={pendingTxns.length > 0 ? "PENDING" : "PAID"}>
            {pendingTxns.length} Pending Review{pendingTxns.length === 1 ? "" : "s"}
          </Badge>
          <Button variant="secondary" size="sm" onClick={fetchPendingApprovals}>
            🔄 Refresh Queue
          </Button>
        </div>
      </div>

      {/* Pending Items List */}
      {isLoading ? (
        <Card><p className="text-xs text-ink-400">Loading pending approvals queue...</p></Card>
      ) : pendingTxns.length === 0 ? (
        <Card className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-full bg-success-dark/40 border border-success/30 text-success flex items-center justify-center text-xl font-bold mx-auto">
            ✓
          </div>
          <h2 className="text-base font-bold text-white">Approval Queue is Clear</h2>
          <p className="text-xs text-ink-400 max-w-sm mx-auto">
            All AI transactions are within standard policy limits or have been reviewed.
          </p>
        </Card>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
          {pendingTxns.map((txn) => {
            const product = txn.productId || {};
            const merchant = txn.merchantId || {};
            const buyer = txn.buyerId || {};

            return (
              <motion.div key={txn._id} variants={itemVariants}>
                <Card hoverable className="space-y-4 border-surface-border hover:border-brand-500/40">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-ink-400">TXN #{String(txn._id).slice(-8).toUpperCase()}</span>
                        <Badge status="PENDING">HUMAN_APPROVAL_REQUIRED</Badge>
                        <Badge status={txn.riskLevel === "HIGH" ? "FAILED" : "PENDING"}>
                          Risk: {txn.riskLevel || "MEDIUM"} ({txn.riskScore || 50}/100)
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">{product.name || "B2B Product Item"}</h3>
                      <p className="text-xs text-ink-400">
                        Buyer: <strong className="text-ink-700">{buyer.ownerOrg || "Enterprise Buyer"}</strong> → Merchant:{" "}
                        <strong className="text-ink-700">{merchant.name || "Verified Merchant"}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-ink-400 uppercase block font-medium">Transaction Value</span>
                      <span className="text-xl font-bold font-mono text-brand-500">{formatRupee(txn.amountInPaise)}</span>
                    </div>
                  </div>

                  {/* Threshold Bar Component */}
                  <div className="p-3 bg-surface rounded-xl border border-surface-border">
                    <ThresholdBar
                      amountInPaise={txn.amountInPaise || 0}
                      thresholdInPaise={buyer.constitution?.autoApproveLimitInPaise || 5000000}
                    />
                  </div>

                  {/* EXACT POLICY ENGINE REASON STRINGS DISPLAY */}
                  <div className="bg-warning-dark/40 border border-warning/30 p-3.5 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-warning block">
                      Policy Engine Trigger Reasons:
                    </span>
                    <ul className="space-y-1">
                      {txn.approvalReasons && txn.approvalReasons.length > 0 ? (
                        txn.approvalReasons.map((reason, idx) => (
                          <li key={idx} className="text-xs font-medium text-warning flex items-start space-x-1.5">
                            <span>•</span>
                            <span>{reason}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-warning font-medium">• Flagged by transaction risk scoring model.</li>
                      )}
                    </ul>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button variant="primary" size="sm" onClick={() => setSelectedTxn(txn)}>
                      Review & Decide →
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Review Modal */}
      {selectedTxn && (
        <ApprovalModal
          txn={selectedTxn}
          onClose={() => setSelectedTxn(null)}
          onActionComplete={fetchPendingApprovals}
        />
      )}
    </div>
  );
}
