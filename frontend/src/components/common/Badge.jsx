export default function Badge({ children, status = "default", className = "" }) {
  const normalizedStatus = String(status).toUpperCase();

  let colorClasses = "bg-slate-100 text-slate-600"; // default

  if (["PAID", "COMPLETED", "VERIFIED", "SUCCESS"].includes(normalizedStatus)) {
    colorClasses = "bg-success-light text-success-dark";
  } else if (["AGREED", "RESERVED", "PAYMENT_PENDING", "PENDING"].includes(normalizedStatus)) {
    colorClasses = "bg-warning-light text-warning-dark";
  } else if (["PAYMENT_FAILED", "QUOTE_EXPIRED", "POLICY_REJECTED", "DISPUTED", "FAILED", "REJECTED"].includes(normalizedStatus)) {
    colorClasses = "bg-danger-light text-danger-dark";
  } else if (["HUMAN_APPROVAL_REQUIRED", "BRAND", "INFO"].includes(normalizedStatus)) {
    colorClasses = "bg-brand-50 text-brand-700";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses} ${className}`}>
      {children || status}
    </span>
  );
}
