import Card from "./Card.jsx";
import Sparkline from "./Sparkline.jsx";

export default function StatCard({
  label,
  title,
  value,
  subtext,
  subtitle,
  trend,
  highlight = false,
  sparklineData,
  sparklineColor = "brand",
  className = "",
}) {
  const displayLabel = label || title;
  const displaySubtext = subtext || subtitle;

  return (
    <Card hasGradientAccent className={`${highlight ? "border-brand-500/50 bg-brand-500/10" : ""} ${className}`}>
      <div className="text-xs text-ink-400 uppercase tracking-wide font-semibold mb-1">
        {displayLabel}
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">
          {value}
        </div>
        {trend && (
          <span className={`text-xs font-semibold ${trend.startsWith("+") ? "text-success" : "text-danger"}`}>
            {trend}
          </span>
        )}
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-2.5">
          <Sparkline data={sparklineData} color={sparklineColor} height={32} />
        </div>
      )}

      {displaySubtext && <div className="text-xs text-ink-400 mt-2">{displaySubtext}</div>}
    </Card>
  );
}
