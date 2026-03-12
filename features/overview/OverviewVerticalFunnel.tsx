"use client";

import { useMemo } from "react";
import { ArrowDown } from "lucide-react";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useFunnel, useKPIs } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useDrillDown } from "@/providers/DrillDownProvider";
import { cn } from "@/lib/utils";
import type { FunnelStep } from "@/types";

const STEP_COLORS = [
  "from-blue-600 to-blue-500",
  "from-blue-500 to-sky-500",
  "from-sky-500 to-cyan-500",
  "from-cyan-500 to-teal-500",
  "from-teal-500 to-emerald-500",
];

const STEP_LABELS: Record<string, string> = {
  leads: "Leads",
  booked: "Calls Agendadas (MQL)",
  received: "Calls Realizadas",
  negotiation: "Calls Qualificadas",
  won: "Contratos Fechados",
};

const CONVERSION_LABELS: Record<string, string> = {
  booked: "qualificação",
  received: "comparecimento",
  negotiation: "qualificação",
  won: "conversão",
};

function fmt(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function FunnelStep({
  step,
  topCount,
  colorClass,
  isLast,
  onClick,
}: {
  step: FunnelStep;
  topCount: number;
  colorClass: string;
  isLast: boolean;
  onClick?: () => void;
}) {
  const pctOfTotal = topCount > 0 ? ((step.count / topCount) * 100).toFixed(0) : "0";

  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-xl bg-gradient-to-r px-5 py-4 text-left text-white shadow-sm transition-all duration-200",
        colorClass,
        onClick && "cursor-pointer hover:shadow-md hover:scale-[1.01]",
      )}
      onClick={onClick}
      disabled={!onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
            {STEP_LABELS[step.key] ?? step.label}
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {step.count.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-white/80">
            {pctOfTotal}% do total
          </p>
        </div>
      </div>
    </button>
  );
}

export function OverviewVerticalFunnel() {
  const { period } = usePeriodFilter();
  const drillDown = useDrillDown();
  const { data: steps, isLoading, isError, refetch } = useFunnel(period);
  const { data: kpis } = useKPIs(period, { role: "overview" });

  const revenue = useMemo(() => {
    return kpis?.find((k) => k.key === "revenue")?.value ?? 0;
  }, [kpis]);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (isLoading || !steps) {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  const topCount = steps.length > 0 ? steps[0].count : 1;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Funil de Conversão
        </h3>
      </div>

      <div className="space-y-1">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;

          return (
            <div key={step.key}>
              <FunnelStep
                step={step}
                topCount={topCount}
                colorClass={STEP_COLORS[i % STEP_COLORS.length]}
                isLast={isLast}
                onClick={() => drillDown.openEvidence(step.label, { funnelStep: step.key })}
              />

              {!isLast && step.conversionFromPrevious !== undefined && (
                <div className="flex items-center justify-center gap-1.5 py-1.5">
                  <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                    {steps[i + 1]?.conversionFromPrevious?.toFixed(1) ?? "—"}%{" "}
                    {CONVERSION_LABELS[steps[i + 1]?.key] ?? "conversão"} ↓
                  </span>
                </div>
              )}

              {isLast && revenue > 0 && (
                <div className="mt-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-5 py-4 text-white shadow-sm">
                  <p className="text-2xl font-bold tabular-nums">{fmt(revenue)}</p>
                  <p className="text-sm font-medium text-white/80">Receita Fechada</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
