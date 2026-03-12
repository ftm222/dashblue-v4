"use client";

import { cn } from "@/lib/utils";
import {
  type SquadData,
  SQUAD_COLORS,
  fmtCurrency,
  initials,
} from "@/lib/squad-utils";

interface MetricDef {
  key: keyof SquadData;
  label: string;
  format: "currency" | "number" | "percent";
}

const METRICS: MetricDef[] = [
  { key: "revenue", label: "Receita Total", format: "currency" },
  { key: "contracts", label: "Contratos", format: "number" },
  { key: "ticketMedio", label: "Ticket Médio", format: "currency" },
  { key: "conversionRate", label: "Taxa Conversão", format: "percent" },
  { key: "callsRealized", label: "Calls Realizadas", format: "number" },
  { key: "callsQualified", label: "Calls Qualificadas", format: "number" },
  { key: "qualificationRate", label: "Taxa Qualificação", format: "percent" },
  { key: "showRate", label: "Taxa Show", format: "percent" },
];

function formatMetricValue(value: number, format: "currency" | "number" | "percent"): string {
  if (format === "currency") return fmtCurrency(value);
  if (format === "percent") return `${value.toFixed(1)}%`;
  return value.toLocaleString("pt-BR");
}

function MetricSection({
  metric,
  squads,
}: {
  metric: MetricDef;
  squads: SquadData[];
}) {
  const values = squads.map((s) => s[metric.key] as number);
  const maxValue = Math.max(...values);
  const leaderIdx = values.indexOf(maxValue);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-center text-sm font-bold text-foreground">
        {metric.label}
      </h3>

      <div className="space-y-2">
        {squads.map((squad, i) => {
          const value = squad[metric.key] as number;
          const isLeader = i === leaderIdx && maxValue > 0;
          const color = SQUAD_COLORS[i % SQUAD_COLORS.length];

          return (
            <div
              key={squad.name}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
                isLeader
                  ? `${color.bg}/10 border border-${color.hex ? "" : ""}${color.bg.replace("bg-", "border-")}/30`
                  : "bg-muted/30",
              )}
              style={isLeader ? { backgroundColor: `${color.hex}10`, borderColor: `${color.hex}30` } : {}}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                  color.bg,
                )}
              >
                {initials(squad.name)}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {squad.name}
              </span>
              <span className="ml-auto text-base font-extrabold tabular-nums text-foreground">
                {formatMetricValue(value, metric.format)}
              </span>
              {isLeader && (
                <span className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  🟢 Líder
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SquadMetricsComparison({ squads }: { squads: SquadData[] }) {
  if (squads.length === 0) return null;

  return (
    <div className="space-y-5">
      <h2 className="text-center text-lg font-bold tracking-tight text-foreground">
        Comparação de Métricas
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {METRICS.map((metric) => (
          <MetricSection key={metric.key} metric={metric} squads={squads} />
        ))}
      </div>
    </div>
  );
}
