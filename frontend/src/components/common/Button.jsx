import { motion } from "framer-motion";

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
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none whitespace-nowrap shrink-0";

  const variants = {
    primary: "bg-gradient-to-r from-brand-500 via-brand-600 to-glow-cyan text-white shadow-md hover:shadow-glow border border-brand-500/30",
    secondary: "bg-surface-alt border border-surface-border text-white hover:bg-surface-border shadow-sm",
    danger: "bg-danger hover:bg-danger-dark text-white shadow-sm",
    ghost: "text-brand-500 hover:text-white hover:bg-white/5 bg-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const disabledClass = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer";

  const motionProps = (variant === "primary" && !disabled)
    ? { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } }
    : {};

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${disabledClass} ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.button>
  );
}
