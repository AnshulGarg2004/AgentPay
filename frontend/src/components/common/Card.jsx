export default function Card({
  children,
  className = "",
  hoverable = false,
  onClick,
  hasGradientAccent = false,
  ...props
}) {
  const isInteractive = hoverable || Boolean(onClick);

  const hoverClasses = isInteractive
    ? "cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.45)] hover:border-brand-500/40 transition-all duration-200 ease-out"
    : "";

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-surface-alt rounded-2xl border border-surface-border p-6 shadow-sm ${hoverClasses} ${className}`}
      {...props}
    >
      {hasGradientAccent && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand-500/60" />
      )}
      {children}
    </div>
  );
}
