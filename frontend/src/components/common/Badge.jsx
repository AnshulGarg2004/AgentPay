export default function Badge({ children, status = "default", className = "", pulse = false }) {
  const normalizedStatus = String(status).toUpperCase();

  let colorClasses = "bg-surface-border/60 text-ink-400 border border-surface-border"; // default
  let dotColor = "bg-ink-400";

  if (["PAID", "COMPLETED", "VERIFIED", "SUCCESS"].includes(normalizedStatus)) {
    colorClasses = "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40";
    dotColor = "bg-emerald-400";
  } else if (["AGREED", "RESERVED", "PAYMENT_PENDING", "PENDING"].includes(normalizedStatus)) {
    colorClasses = "bg-amber-950/60 text-amber-400 border border-amber-800/40";
    dotColor = "bg-amber-400";
  } else if (
    ["PAYMENT_FAILED", "QUOTE_EXPIRED", "POLICY_REJECTED", "DISPUTED", "FAILED", "REJECTED"].includes(normalizedStatus)
  ) {
    colorClasses = "bg-rose-950/60 text-rose-400 border border-rose-800/40";
    dotColor = "bg-rose-400";
  } else if (["HUMAN_APPROVAL_REQUIRED", "BRAND", "INFO"].includes(normalizedStatus)) {
    colorClasses = "bg-indigo-950/60 text-indigo-300 border border-indigo-800/40";
    dotColor = "bg-indigo-400";
  }

  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap shrink-0 px-2.5 py-0.5 rounded-md text-[11px] font-semibold font-mono tracking-wide ${colorClasses} ${className}`}
    >
      {(pulse || ["PAYMENT_PENDING", "PENDING", "HUMAN_APPROVAL_REQUIRED"].includes(normalizedStatus)) && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulseDot mr-1.5 shrink-0`} />
      )}
      {children || status}
    </span>
  );
}
