"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/components/theme/theme-provider";

export function VendorChart({ data }: { data: { name: string; value: number }[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const axisColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "#334155" : "#cbd5e1";
  const tooltipBg = isDark ? "#020617" : "#ffffff";
  const tooltipText = isDark ? "#e2e8f0" : "#0f172a";
  const barFill = isDark ? "#22c55e" : "#059669";

  return (
    <div className="h-72 w-full rounded-lg bg-secondary/20 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 45 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.45} />
          <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11, fill: axisColor }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: axisColor }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
          <Tooltip cursor={{ fill: isDark ? "rgba(34,197,94,0.08)" : "rgba(5,150,105,0.10)" }} contentStyle={{ background: tooltipBg, border: `1px solid ${gridColor}`, color: tooltipText, borderRadius: "0.75rem" }} labelStyle={{ color: tooltipText }} itemStyle={{ color: tooltipText }} />
          <Bar dataKey="value" fill={barFill} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
