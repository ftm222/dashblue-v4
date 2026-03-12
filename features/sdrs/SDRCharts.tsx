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
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
} from "recharts";
import type { Person } from "@/types";

interface SDRChartsProps {
  sdrs: Person[];
}

const CHART_COLORS = [
  "hsl(213, 94%, 58%)",
  "hsl(38, 92%, 55%)",
  "hsl(350, 70%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(160, 60%, 50%)",
  "hsl(190, 70%, 50%)",
];

const SHOW_META = 75;

function firstName(name: string): string {
  return name.split(" ")[0];
}

interface BarItem {
  name: string;
  fullName: string;
  calls: number;
  color: string;
}

interface BubbleItem {
  name: string;
  fullName: string;
  calls: number;
  showRate: number;
  revenue: number;
  color: string;
}

function BarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: BarItem }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="text-sm font-medium">{item.fullName}</p>
      <p className="text-xs text-muted-foreground">{item.calls} calls</p>
    </div>
  );
}

function BubbleTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: BubbleItem }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const fmtRev = `R$ ${item.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="text-sm font-medium">{item.fullName}</p>
      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
        <p>Calls: {item.calls}</p>
        <p>Taxa Show: {item.showRate.toFixed(1)}%</p>
        <p>Receita: {fmtRev}</p>
      </div>
    </div>
  );
}

function CustomBubbleShape(props: {
  cx?: number;
  cy?: number;
  payload?: BubbleItem;
  r?: number;
}) {
  const { cx = 0, cy = 0, payload, r = 6 } = props;
  if (!payload) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={payload.color}
      fillOpacity={0.75}
      stroke={payload.color}
      strokeWidth={1.5}
      strokeOpacity={0.4}
    />
  );
}

export function SDRCharts({ sdrs }: SDRChartsProps) {
  const barData = useMemo<BarItem[]>(() => {
    return sdrs
      .map((s, i) => ({
        name: firstName(s.name),
        fullName: s.name,
        calls: s.callMetrics?.totalCalls ?? 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }))
      .sort((a, b) => b.calls - a.calls);
  }, [sdrs]);

  const bubbleData = useMemo<BubbleItem[]>(() => {
    return sdrs.map((s, i) => ({
      name: firstName(s.name),
      fullName: s.name,
      calls: s.callMetrics?.totalCalls ?? 0,
      showRate: s.kpis.find((k) => k.key === "show_rate")?.value ?? 0,
      revenue: s.salesOriginated ?? 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [sdrs]);

  const maxRevenue = Math.max(...bubbleData.map((b) => b.revenue), 1);
  const minBubble = 80;
  const maxBubble = 600;

  if (!barData.length) return null;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Análise Gráfica Comparativa
        </h3>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Horizontal Bar Chart - Calls por SDR */}
        <div>
          <h4 className="mb-3 text-sm font-semibold">
            Calls por SDR
          </h4>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  type="number"
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
                <Tooltip content={<BarTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
                <Bar dataKey="calls" radius={[0, 4, 4, 0]} barSize={24}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter/Bubble Chart - Volume vs Qualidade */}
        <div>
          <h4 className="mb-1 text-sm font-semibold">
            Volume vs Qualidade
          </h4>
          <p className="mb-3 text-[10px] text-muted-foreground">
            Tamanho da bolha = receita originada
          </p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  type="number"
                  dataKey="calls"
                  name="Calls"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Número de Calls",
                    position: "insideBottom",
                    offset: -5,
                    style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="showRate"
                  name="Taxa Show"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  label={{
                    value: "Taxa de Show (%)",
                    angle: -90,
                    position: "insideLeft",
                    offset: 15,
                    style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
                  }}
                />
                <ZAxis
                  type="number"
                  dataKey="revenue"
                  range={[minBubble, maxBubble]}
                  domain={[0, maxRevenue]}
                />
                <Tooltip content={<BubbleTooltip />} />
                <ReferenceLine
                  y={SHOW_META}
                  stroke="hsl(38, 92%, 55%)"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{
                    value: "Meta",
                    position: "right",
                    style: { fontSize: 10, fill: "hsl(38, 92%, 55%)", fontWeight: 600 },
                  }}
                />
                <Scatter data={bubbleData} shape={<CustomBubbleShape />} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 justify-center">
            {bubbleData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
