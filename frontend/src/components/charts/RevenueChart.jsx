import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Card from "../common/Card.jsx";
import { formatRupee } from "../../lib/format.js";

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-[#0b0f19] border border-[#1e293b] px-3.5 py-2.5 rounded-xl shadow-2xl text-xs space-y-1.5 font-sans">
        <p className="text-[#828fa3] font-medium">{label}</p>
        <div className="flex items-center space-x-2 text-white font-bold">
          <span className="w-3 h-3 rounded-[3px] bg-[#6366f1] inline-block shrink-0" />
          <span>Revenue: {formatRupee(val * 100)}</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function RevenueChart({ data = [] }) {
  const formattedData = (data.length > 0 ? data : generateSampleData()).map((item) => ({
    date: item.date ? formatDateLabel(item.date) : "N/A",
    revenueRupees: Math.round((item.revenueInPaise || item.revenue || 0) / 100),
  }));

  return (
    <Card className="space-y-6 bg-[#0c101d] border border-[#1e2638]">
      <div>
        <div className="flex items-center space-x-2">
          <span className="text-amber-500 font-bold text-base">⚡</span>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Gross Escrow Revenue Velocity
          </h3>
        </div>
        <p className="text-xs text-[#828fa3] mt-1">
          30-day cumulative settled & escrow paid transaction volume (in ₹).
        </p>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1b2333" vertical={false} />
            <XAxis
              dataKey="date"
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
              tickFormatter={(val) => `₹${val.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Area
              type="monotone"
              dataKey="revenueRupees"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function formatDateLabel(dateStr) {
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function generateSampleData() {
  const result = [];
  const today = new Date();
  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    result.push({
      date: d.toISOString().split("T")[0],
      revenueInPaise: Math.floor(Math.random() * 4500000) + 1000000,
    });
  }
  return result;
}
