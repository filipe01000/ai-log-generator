"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "@/components/theme/theme-provider";

const COLORS_DARK: Record<string, string> = {
  informational: "#38bdf8",
  low: "#34d399",
  medium: "#facc15",
  high: "#fb923c",
  critical: "#f87171"
};

const COLORS_LIGHT: Record<string, string> = {
  informational: "#0284c7",
  low: "#059669",
  medium: "#ca8a04",
  high: "#ea580c",
  critical: "#dc2626"
};

export function SeverityChart({ data }: { data: { name: string; value: number }[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = isDark ? COLORS_DARK : COLORS_LIGHT;
  const tooltipBg = isDark ? "#020617" : "#ffffff";
  const tooltipText = isDark ? "#e2e8f0" : "#0f172a";
  const border = isDark ? "#334155" : "#cbd5e1";

  return (
    <div className="h-72 w-full rounded-lg bg-secondary/20 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3} label={{ fill: tooltipText, fontSize: 12 }}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={colors[entry.name] || "#64748b"} stroke={isDark ? "#020617" : "#ffffff"} strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${border}`, color: tooltipText, borderRadius: "0.75rem" }} itemStyle={{ color: tooltipText }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
