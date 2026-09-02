export default function Card({ children, className = "", hoverable = false, onClick, hasGradientAccent = false }) {
  const hoverClasses = hoverable ? "hover:shadow-glow hover:border-brand-500/40 transition-all cursor-pointer" : "";

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-surface-alt rounded-2xl border border-surface-border p-6 shadow-card ${hoverClasses} ${className}`}
    >
      {hasGradientAccent && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 via-glow-cyan to-glow-rose" />
      )}
      {children}
    </div>
  );
}
