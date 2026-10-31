"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/components/theme/theme-provider";

export function VendorChart({ data }: { data: { name: string; value: number }[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const axisColor = isDark ? "#9EA4C8" : "#5D6389";
  const gridColor = isDark ? "#2C3C68" : "#DAD4E0";
  const tooltipBg = isDark ? "#0E0D15" : "#ffffff";
  const tooltipText = isDark ? "#F3F0F6" : "#182346";
  const barFill = isDark ? "#BFA9BA" : "#3D5387";

  return (
    <div className="h-72 w-full rounded-lg bg-secondary/20 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 45 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.45} />
          <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11, fill: axisColor }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: axisColor }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
          <Tooltip cursor={{ fill: isDark ? "rgba(191,169,186,0.08)" : "rgba(61,83,135,0.08)" }} contentStyle={{ background: tooltipBg, border: `1px solid ${gridColor}`, color: tooltipText, borderRadius: "0.75rem" }} labelStyle={{ color: tooltipText }} itemStyle={{ color: tooltipText }} />
          <Bar dataKey="value" fill={barFill} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
