import { ResponsiveContainer, AreaChart, Area } from "recharts";

const COLOR_MAP = {
  brand: "#7c5cff",
  success: "#22c55e",
  danger: "#f43f5e",
  warning: "#eab308",
};

export default function Sparkline({ data = [], color = "brand", height = 36 }) {
  if (!data || data.length === 0) return null;

  const hexColor = COLOR_MAP[color] || COLOR_MAP.brand;
  const chartData = data.map((val, i) => ({ index: i, value: typeof val === "number" ? val : val.value || 0 }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`sparklineGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={hexColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={hexColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={hexColor}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#sparklineGrad-${color})`}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
