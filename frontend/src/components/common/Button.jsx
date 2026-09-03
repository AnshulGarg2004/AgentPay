export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 ease-out focus:outline-none whitespace-nowrap shrink-0 select-none hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]";

  const variants = {
    primary:
      "bg-brand-500 hover:bg-brand-600 text-white shadow-sm border border-brand-400/30 hover:shadow-md",
    secondary:
      "bg-surface-alt border border-surface-border text-white hover:bg-surface-border hover:border-slate-500/50 hover:shadow-sm",
    danger:
      "bg-danger hover:bg-danger/90 text-white shadow-sm hover:shadow-md",
    ghost:
      "text-brand-500 hover:text-white hover:bg-brand-500/10 bg-transparent border border-transparent",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-sm md:text-base gap-2",
  };

  const disabledClass = disabled ? "opacity-50 cursor-not-allowed pointer-events-none hover:scale-100 hover:translate-y-0" : "cursor-pointer";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${disabledClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
