import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Card from "../common/Card.jsx";

const BAR_COLORS = [
  "#10b981", // Emerald Green (WhatsApp AI style)
  "#6366f1", // Indigo Blue (SMS style)
  "#8b5cf6", // Purple (HTML Email style)
  "#f59e0b", // Amber Gold (In-App Push style)
  "#06b6d4", // Cyan
  "#ec4899", // Pink
];

const STATE_LABEL_MAP = {
  DISCOVERED: "Discovered (AI)",
  QUOTED: "Quoted",
  NEGOTIATING: "Negotiating",
  AGREED: "Terms Agreed",
  PAID: "Escrow Paid",
  COMPLETED: "Completed",
};

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const color = payload[0].payload.color || "#10b981";
    const displayName = STATE_LABEL_MAP[label] || label;
    return (
      <div className="bg-[#0b0f19] border border-[#1e293b] px-3.5 py-2.5 rounded-xl shadow-2xl text-xs space-y-1.5 font-sans">
        <p className="text-white font-bold">{displayName}</p>
        <div className="flex items-center space-x-2 text-white font-semibold">
          <span className="w-3 h-3 rounded-[3px] inline-block shrink-0" style={{ backgroundColor: color }} />
          <span>Count: {val} transactions</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function ConversionChart({ data = [] }) {
  const chartData = (data.length > 0 ? data : generateSampleFunnel()).map((item, idx) => ({
    ...item,
    displayLabel: STATE_LABEL_MAP[item.state] || item.state,
    color: BAR_COLORS[idx % BAR_COLORS.length],
  }));

  return (
    <Card className="space-y-6 bg-[#0c101d] border border-[#1e2638]">
      {/* Header matching user reference UI */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="text-amber-500 font-bold text-base">⚡</span>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Multi-Channel Conversion & Funnel Benchmark
          </h3>
        </div>
        <p className="text-xs text-[#828fa3] mt-1">
          Autonomous lifecycle progression and state performance benchmark.
        </p>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: -15, bottom: 10 }} barSize={56}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1b2333" vertical={false} />
            <XAxis
              dataKey="displayLabel"
              stroke="#828fa3"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#828fa3"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="count" radius={[12, 12, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function generateSampleFunnel() {
  return [
    { state: "DISCOVERED", count: 78 },
    { state: "QUOTED", count: 45 },
    { state: "NEGOTIATING", count: 35 },
    { state: "AGREED", count: 26 },
    { state: "PAID", count: 22 },
  ];
}
