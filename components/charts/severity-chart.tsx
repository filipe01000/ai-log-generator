"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  informational: "#38bdf8",
  low: "#34d399",
  medium: "#facc15",
  high: "#fb923c",
  critical: "#f87171"
};

export function SeverityChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3} label>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b", color: "#fff" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
