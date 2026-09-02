import { useState } from "react";
import Button from "../common/Button.jsx";
import Badge from "../common/Badge.jsx";
import { formatRupee } from "../../lib/format.js";
import { api } from "../../lib/api.js";

export default function ApprovalModal({ txn, onClose, onActionComplete }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!txn) return null;

  const product = txn.productId || {};
  const merchant = txn.merchantId || {};
  const buyer = txn.buyerId || {};

  async function handleApprove() {
    setIsSubmitting(true);
    try {
      await api.post(`/approvals/${txn._id}/approve`, {
        approvedBy: "Human Operations Manager",
      });
      alert("Transaction approved successfully!");
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err) {
      console.error("Approval error:", err);
      alert("Failed to approve transaction: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    setIsSubmitting(true);
    try {
      await api.post(`/approvals/${txn._id}/reject`, {
        rejectedBy: "Human Operations Manager",
        reason: rejectReason || "Manual rejection by human operations reviewer.",
      });
      alert("Transaction rejected.");
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err) {
      console.error("Rejection error:", err);
      alert("Failed to reject transaction: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-surface-border max-w-xl w-full p-6 space-y-6 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div>
            <span className="text-xs font-mono text-ink-400">TXN #{String(txn._id).slice(-8).toUpperCase()}</span>
            <h2 className="text-lg font-bold text-ink-900">Human Governance Review Required</h2>
          </div>
          <Badge status={txn.riskLevel === "HIGH" ? "FAILED" : "PENDING"}>
            Risk: {txn.riskLevel || "MEDIUM"} ({txn.riskScore || 50}/100)
          </Badge>
        </div>

        {/* Transaction Summary Grid */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-surface-alt rounded-xl border border-surface-border text-xs">
          <div>
            <span className="text-ink-400 block uppercase font-medium">Buyer Organization</span>
            <span className="font-bold text-ink-900">{buyer.ownerOrg || "Enterprise Buyer"}</span>
          </div>
          <div>
            <span className="text-ink-400 block uppercase font-medium">Merchant Seller</span>
            <span className="font-bold text-ink-900">{merchant.name || "Verified Merchant"}</span>
          </div>
          <div>
            <span className="text-ink-400 block uppercase font-medium">Product Item</span>
            <span className="font-medium text-ink-900">{product.name || "B2B Product"}</span>
          </div>
          <div>
            <span className="text-ink-400 block uppercase font-medium">Total Transaction Amount</span>
            <span className="font-bold font-mono text-brand-600 text-sm">{formatRupee(txn.amountInPaise)}</span>
          </div>
        </div>

        {/* POLICY ENGINE REASON STRINGS */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-700">
            Policy Engine Governance Flags ({txn.approvalReasons?.length || 0})
          </h3>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {txn.approvalReasons && txn.approvalReasons.length > 0 ? (
              txn.approvalReasons.map((reason, idx) => (
                <div key={idx} className="p-3 bg-warning-light/70 border border-warning/30 text-warning-dark rounded-xl text-xs flex items-start space-x-2">
                  <span className="font-bold text-warning-dark">⚠️</span>
                  <span>{reason}</span>
                </div>
              ))
            ) : (
              <div className="p-3 bg-slate-100 text-slate-700 text-xs rounded-xl">
                Transaction flagged due to risk score criteria.
              </div>
            )}
          </div>
        </div>

        {/* Risk Factors */}
        {txn.riskFactors && txn.riskFactors.length > 0 && (
          <div className="text-xs text-ink-400 space-y-1">
            <span className="font-medium text-ink-700 block">Risk Evaluation Factors:</span>
            <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px]">
              {txn.riskFactors.map((rf, idx) => (
                <li key={idx}>{rf}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Reject Reason Form Toggle */}
        {showRejectForm && (
          <div className="space-y-2 pt-2 border-t border-surface-border">
            <label className="block text-xs font-medium text-ink-700">Rejection Reason Note</label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Exceeds current quarter budget cap"
              className="w-full p-2.5 rounded-lg border border-surface-border text-xs focus:outline-none focus:ring-2 focus:ring-danger"
            />
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-surface-border">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center space-x-3">
            {!showRejectForm ? (
              <Button variant="danger" size="sm" disabled={isSubmitting} onClick={() => setShowRejectForm(true)}>
                Reject Transaction
              </Button>
            ) : (
              <Button variant="danger" size="sm" disabled={isSubmitting} onClick={handleReject}>
                Confirm Rejection
              </Button>
            )}

            <Button variant="primary" size="sm" disabled={isSubmitting} onClick={handleApprove}>
              {isSubmitting ? "Processing..." : "✓ Approve Transaction"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
