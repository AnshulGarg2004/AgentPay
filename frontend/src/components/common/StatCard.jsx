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
  icon: Icon,
}) {
  const displayLabel = label || title;
  const displaySubtext = subtext || subtitle;

  return (
    <Card
      hoverable
      className={`${
        highlight ? "border-brand-500/50 bg-brand-500/10" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-ink-400 uppercase tracking-wide font-semibold flex items-center space-x-1.5 font-mono">
          {Icon && <Icon className="w-3.5 h-3.5 text-brand-500" />}
          <span>{displayLabel}</span>
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold font-mono ${
              trend.startsWith("+") ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      <div className="text-2xl lg:text-3xl font-bold text-white tracking-tight font-mono my-1">
        {value}
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3">
          <Sparkline data={sparklineData} color={sparklineColor} height={32} />
        </div>
      )}

      {displaySubtext && <div className="text-xs text-ink-400 mt-2">{displaySubtext}</div>}
    </Card>
  );
}
