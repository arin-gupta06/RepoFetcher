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

const BOLD_COLORS = [
  "#7c3aed",
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0284c7",
  "#7c2d12",
  "#4338ca",
  "#047857",
  "#b45309",
  "#be123c",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#000000",
          border: "1px solid #7c3aed",
          borderRadius: 6,
          padding: "8px 12px",
          fontSize: "0.82rem",
          color: "#ffffff",
        }}
      >
        <p style={{ fontWeight: 700, marginBottom: 2 }}>{label || payload[0]?.name}</p>
        <p style={{ color: "#c4b5fd", fontWeight: 600 }}>Count: {payload[0]?.value}</p>
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
              tick={{ fill: "#a1a1aa", fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: "#27272a" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={180}
              tick={{ fill: "#f4f4f5", fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#18181b" }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {chartData.map((_, i) => (
                <Cell
                  key={i}
                  fill={BOLD_COLORS[i % BOLD_COLORS.length]}
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
              innerRadius={55}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell
                  key={i}
                  fill={BOLD_COLORS[i % BOLD_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span style={{ color: "#f4f4f5", fontSize: "0.78rem", fontWeight: 600 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
