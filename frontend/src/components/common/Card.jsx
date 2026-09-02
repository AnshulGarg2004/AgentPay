export default function Card({ children, className = "", hoverable = false, onClick }) {
  const hoverClasses = hoverable ? "hover:shadow-cardHover transition-shadow cursor-pointer" : "";

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-card border border-surface-border p-6 ${hoverClasses} ${className}`}
    >
      {children}
    </div>
  );
}
