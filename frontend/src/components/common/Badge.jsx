export default function Badge({ children, status = "default", className = "" }) {
  const normalizedStatus = String(status).toUpperCase();

  let colorClasses = "bg-surface-border text-ink-400 border border-surface-border"; // default

  if (["PAID", "COMPLETED", "VERIFIED", "SUCCESS"].includes(normalizedStatus)) {
    colorClasses = "bg-success-dark/40 text-success border border-success/30";
  } else if (["AGREED", "RESERVED", "PAYMENT_PENDING", "PENDING"].includes(normalizedStatus)) {
    colorClasses = "bg-warning-dark/40 text-warning border border-warning/30";
  } else if (["PAYMENT_FAILED", "QUOTE_EXPIRED", "POLICY_REJECTED", "DISPUTED", "FAILED", "REJECTED"].includes(normalizedStatus)) {
    colorClasses = "bg-danger-dark/40 text-danger border border-danger/30";
  } else if (["HUMAN_APPROVAL_REQUIRED", "BRAND", "INFO"].includes(normalizedStatus)) {
    colorClasses = "bg-brand-500/20 text-brand-500 border border-brand-500/30";
  }

  return (
    <span className={`inline-flex items-center justify-center whitespace-nowrap shrink-0 px-3 py-1 rounded-full text-xs font-semibold font-mono tracking-wide ${colorClasses} ${className}`}>
      {children || status}
    </span>
  );
}
