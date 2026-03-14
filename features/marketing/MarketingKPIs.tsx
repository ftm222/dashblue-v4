"use client";

import { KPICard } from "@/components/shared/KPICard";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useKPIs } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useDrillDown } from "@/providers/DrillDownProvider";
import type { KPIKey } from "@/types";

const MARKETING_KEYS: KPIKey[] = [
  "investment",
  "leads",
  "cpl",
  "cac",
  "conversion_rate",
  "roas",
];

export function MarketingKPIs() {
  const { period } = usePeriodFilter();
  const drillDown = useDrillDown();
  const { data: kpis, isLoading, isError, refetch } = useKPIs(period, { role: "marketing" });

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (isLoading || !kpis) {
    return (
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="min-w-[180px] p-4 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  }

  const filtered = kpis.filter((k) => MARKETING_KEYS.includes(k.key));

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-2">
        {filtered.map((kpi) => (
          <KPICard
            key={kpi.key}
            kpi={kpi}
            onClick={() => drillDown.openCalc(kpi.label, kpi.key)}
            className="min-w-[180px] flex-shrink-0"
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
