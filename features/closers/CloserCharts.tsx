"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import type { Person } from "@/types";

interface CloserChartsProps {
  closers: Person[];
}

const CHART_COLORS = [
  "hsl(213, 94%, 58%)",
  "hsl(160, 60%, 50%)",
  "hsl(38, 92%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(350, 70%, 55%)",
  "hsl(190, 70%, 50%)",
];

function fmt(value: number): string {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return `R$ ${value.toLocaleString("pt-BR")}`;
}

function fmtFull(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function firstName(name: string): string {
  return name.split(" ")[0];
}

interface ChartItem {
  name: string;
  fullName: string;
  revenue: number;
  percentage: number;
  color: string;
}

function CustomBarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartItem }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="text-sm font-medium">{item.fullName}</p>
      <p className="text-xs text-muted-foreground">{fmtFull(item.revenue)}</p>
    </div>
  );
}

function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartItem }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="text-sm font-medium">{item.fullName}</p>
      <p className="text-xs text-muted-foreground">
        {fmtFull(item.revenue)} ({item.percentage.toFixed(1)}%)
      </p>
    </div>
  );
}

function CustomPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percentage,
  name,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percentage: number;
  name: string;
}) {
  if (percentage < 8) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--foreground))"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[10px] font-medium"
    >
      {percentage.toFixed(0)}%
    </text>
  );
}

export function CloserCharts({ closers }: CloserChartsProps) {
  const data = useMemo<ChartItem[]>(() => {
    const items = closers
      .map((c, i) => {
        const revenue = c.kpis.find((k) => k.key === "revenue")?.value ?? 0;
        return {
          name: firstName(c.name),
          fullName: c.name,
          revenue,
          percentage: 0,
          color: CHART_COLORS[i % CHART_COLORS.length],
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const total = items.reduce((sum, i) => sum + i.revenue, 0);
    for (const item of items) {
      item.percentage = total > 0 ? (item.revenue / total) * 100 : 0;
    }
    return items;
  }, [closers]);

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  if (!data.length) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Bar Chart */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Receita por Closer
          </h3>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                type="number"
                tickFormatter={fmt}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={70}
                tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={24}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Distribuição de Receita
          </h3>
        </div>
        <div className="h-[280px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={110}
                dataKey="revenue"
                strokeWidth={2}
                stroke="hsl(var(--card))"
                label={CustomPieLabel}
                labelLine={false}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-lg font-semibold tracking-tight">{fmtFull(totalRevenue)}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] text-muted-foreground">
                {item.name} <span className="tabular-nums font-medium">{item.percentage.toFixed(1)}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
