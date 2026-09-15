"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface ArchChartProps {
  data: Record<string, number>;
  title: string;
  type?: "bar" | "pie";
}

const GRADIENT_COLORS = [
  "#7c3aed", "#6d28d9", "#4f46e5", "#2563eb", "#0ea5e9",
  "#06b6d4", "#10b981", "#059669", "#f59e0b", "#f97316",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(15,15,35,0.95)",
          border: "1px solid rgba(124,58,237,0.3)",
          borderRadius: 8,
          padding: "8px 14px",
          fontSize: "0.82rem",
          color: "var(--foreground)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: 2 }}>{label || payload[0]?.name}</p>
        <p style={{ color: "#a78bfa" }}>Count: {payload[0]?.value}</p>
      </div>
    );
  }
  return null;
};

export default function ArchitectureChart({ data, title, type = "bar" }: ArchChartProps) {
  const entries = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, type === "pie" ? 8 : 15);

  const chartData = entries.map(([name, value]) => ({ name, value }));

  return (
    <div>
      <p
        className="section-label"
        style={{ marginBottom: 16, display: "block" }}
      >
        {title}
      </p>

      {type === "bar" ? (
        <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 8, bottom: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fill: "rgba(200,200,230,0.4)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={170}
              tick={{ fill: "rgba(200,200,230,0.7)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(124,58,237,0.07)" }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
              {chartData.map((_, i) => (
                <Cell
                  key={i}
                  fill={GRADIENT_COLORS[i % GRADIENT_COLORS.length]}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((_, i) => (
                <Cell
                  key={i}
                  fill={GRADIENT_COLORS[i % GRADIENT_COLORS.length]}
                  fillOpacity={0.9}
                  stroke="rgba(7,7,17,0.5)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value: string) => (
                <span style={{ color: "rgba(200,200,230,0.7)", fontSize: "0.78rem" }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
