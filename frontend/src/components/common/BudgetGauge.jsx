import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Card from "./Card.jsx";
import { formatRupee } from "../../lib/format.js";

export default function BudgetGauge({ spentInPaise = 0, limitInPaise = 50000000 }) {
  const safeLimit = Math.max(limitInPaise, 1);
  const safeSpent = Math.min(spentInPaise, safeLimit);
  const remainingInPaise = Math.max(0, safeLimit - safeSpent);

  const spentPct = Math.round((safeSpent / safeLimit) * 100);
  const remainingPct = 100 - spentPct;

  const data = [
    { name: "Spent", value: safeSpent, color: "#7c5cff" },
    { name: "Remaining", value: remainingInPaise, color: "#22c55e" },
  ];

  return (
    <Card hasGradientAccent className="space-y-4">
      <div className="flex items-center justify-between border-b border-surface-border pb-3">
        <div>
          <h3 className="text-base font-bold text-white">Buyer Budget Utilization</h3>
          <p className="text-xs text-ink-400 mt-0.5">Autonomous Spending Limit vs Escrow Settled</p>
        </div>
        <span className="text-xs font-mono font-bold text-success bg-success-dark/30 px-2.5 py-1 rounded-full border border-success/30">
          {remainingPct}% Available
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Donut Chart */}
        <div className="w-36 h-36 relative flex items-center justify-center shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={45}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold font-mono text-white">{spentPct}%</span>
            <span className="text-[9px] uppercase text-ink-400 font-mono">Utilized</span>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="flex-1 space-y-2 text-xs font-mono w-full">
          <div className="flex justify-between items-center p-2 rounded-lg bg-surface border border-surface-border">
            <span className="text-ink-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block" />
              Settled Spend
            </span>
            <span className="text-white font-bold">{formatRupee(spentInPaise)}</span>
          </div>

          <div className="flex justify-between items-center p-2 rounded-lg bg-surface border border-surface-border">
            <span className="text-ink-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success inline-block" />
              Budget Remaining
            </span>
            <span className="text-success font-bold">{formatRupee(remainingInPaise)}</span>
          </div>

          <div className="flex justify-between items-center p-2 rounded-lg bg-surface border border-surface-border">
            <span className="text-ink-400">Total Authority Limit</span>
            <span className="text-white font-bold">{formatRupee(limitInPaise)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
