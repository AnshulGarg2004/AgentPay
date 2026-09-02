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
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none";

  const variants = {
    primary: "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-sm",
    secondary: "bg-white border border-surface-border text-ink-700 hover:bg-surface-alt shadow-sm",
    danger: "bg-danger hover:bg-danger-dark text-white shadow-sm",
    ghost: "text-brand-600 hover:text-brand-700 bg-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const disabledClass = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer";

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
