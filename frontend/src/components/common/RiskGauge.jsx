import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

const LEVEL_COLOR = {
  LOW: "#22c55e",
  MEDIUM: "#eab308",
  HIGH: "#f43f5e",
};

export default function RiskGauge({ score = 0, level = "LOW", size = 80 }) {
  const normalizedLevel = String(level).toUpperCase();
  const color = LEVEL_COLOR[normalizedLevel] || LEVEL_COLOR.LOW;
  const data = [{ name: "Risk", value: score, fill: color }];

  return (
    <div className="flex flex-col items-center justify-center inline-flex" style={{ width: size, height: size }}>
      <div className="relative w-full h-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="75%"
            outerRadius="100%"
            barSize={6}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "#222236" }}
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span className="text-xs font-bold font-mono" style={{ color }}>
            {score}
          </span>
          <span className="text-[9px] uppercase font-mono text-ink-400 -mt-0.5">
            {normalizedLevel}
          </span>
        </div>
      </div>
    </div>
  );
}
