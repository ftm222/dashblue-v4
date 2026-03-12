"use client";

import { useMemo } from "react";
import { KPICard } from "@/components/shared/KPICard";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useKPIs } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useDrillDown } from "@/providers/DrillDownProvider";
import type { KPI, KPIKey } from "@/types";

const OVERVIEW_KEYS: KPIKey[] = [
  "revenue",
  "ticket",
  "won",
  "leads",
  "show_rate",
  "conversion_rate",
];

const CONTRACTS_META = 88;
const TICKET_META = 4200;

function fmtCurrency(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function computeSubtitle(key: KPIKey, kpis: KPI[]): string | undefined {
  const val = (k: KPIKey) => kpis.find((kpi) => kpi.key === k)?.value ?? 0;

  switch (key) {
    case "revenue": {
      const won = val("won");
      return `${won} contratos fechados`;
    }
    case "ticket":
      return `Meta: ${fmtCurrency(TICKET_META)}`;
    case "won": {
      const pct = CONTRACTS_META > 0 ? Math.round((val("won") / CONTRACTS_META) * 100) : 0;
      return `Meta mensal: ${CONTRACTS_META} (${pct}%)`;
    }
    case "leads": {
      const booked = val("booked");
      const leads = val("leads");
      const pct = leads > 0 ? Math.round((booked / leads) * 100) : 0;
      return `${booked} MQLs (${pct}%)`;
    }
    case "show_rate": {
      const received = val("received");
      const booked = val("booked");
      return `${received} realizadas / ${booked} agendadas`;
    }
    case "conversion_rate": {
      const won = val("won");
      const received = val("received");
      return `${won} fechados / ${received} qualificados`;
    }
    default:
      return undefined;
  }
}

export function OverviewKPIGrid() {
  const { period } = usePeriodFilter();
  const drillDown = useDrillDown();
  const { data: kpis, isLoading, isError, refetch } = useKPIs(period, { role: "overview" });

  const enriched = useMemo(() => {
    if (!kpis) return [];
    return OVERVIEW_KEYS
      .map((key) => {
        const kpi = kpis.find((k) => k.key === key);
        if (!kpi) return null;
        return { kpi, subtitle: computeSubtitle(key, kpis) };
      })
      .filter(Boolean) as { kpi: KPI; subtitle?: string }[];
  }, [kpis]);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (isLoading || !kpis) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Indicadores Principais
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Indicadores Principais
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {enriched.map(({ kpi, subtitle }) => (
          <KPICard
            key={kpi.key}
            kpi={kpi}
            subtitle={subtitle}
            onClick={() => drillDown.openCalc(kpi.label, kpi.key)}
          />
        ))}
      </div>
    </div>
  );
}
