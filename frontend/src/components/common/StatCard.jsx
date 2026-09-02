import Card from "./Card.jsx";

export default function StatCard({ label, value, subtext, trend, className = "" }) {
  return (
    <Card className={className}>
      <div className="text-xs text-ink-400 uppercase tracking-wide font-medium mb-1">
        {label}
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-semibold text-ink-900 tracking-tight">
          {value}
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.startsWith("+") ? "text-success" : "text-danger"}`}>
            {trend}
          </span>
        )}
      </div>
      {subtext && <div className="text-xs text-ink-400 mt-2">{subtext}</div>}
    </Card>
  );
}
