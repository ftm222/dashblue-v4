"use client";

import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useKPIs } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { Skeleton } from "@/components/ui/skeleton";
import type { KPI } from "@/types";

function brl(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function findKPI(kpis: KPI[], key: string) {
  return kpis.find((k) => k.key === key);
}

interface GoalRowProps {
  label: string;
  current: number;
  target: number;
  format: "currency" | "number";
  invertColor?: boolean;
}

function GoalRow({ label, current, target, format, invertColor }: GoalRowProps) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const formatted =
    format === "currency"
      ? brl(current)
      : current.toLocaleString("pt-BR");
  const formattedTarget =
    format === "currency"
      ? brl(target)
      : target.toLocaleString("pt-BR");

  const isOver = current > target;
  const colorClass = invertColor
    ? isOver
      ? "text-red-500"
      : "text-emerald-600 dark:text-emerald-400"
    : isOver
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-muted-foreground";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={colorClass}>
          {formatted} / {formattedTarget}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-xs text-muted-foreground text-right">
        {pct.toFixed(0)}% da meta
      </p>
    </div>
  );
}

export function TrafficGoals() {
  const { period } = usePeriodFilter();
  const { data: kpis, isLoading } = useKPIs(period, { role: "marketing" });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const investmentKPI = findKPI(kpis ?? [], "investment");
  const leadsKPI = findKPI(kpis ?? [], "leads");
  const cacKPI = findKPI(kpis ?? [], "cac");

  const investmentTarget = 50000;
  const leadsTarget = 300;
  const cacMax = 800;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-4">
        <Target className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base font-semibold">Metas de Tráfego</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <GoalRow
          label="Investimento"
          current={investmentKPI?.value ?? 0}
          target={investmentTarget}
          format="currency"
        />
        <GoalRow
          label="Leads"
          current={leadsKPI?.value ?? 0}
          target={leadsTarget}
          format="number"
        />
        <GoalRow
          label="CAC Máximo"
          current={cacKPI?.value ?? 0}
          target={cacMax}
          format="currency"
          invertColor
        />
      </CardContent>
    </Card>
  );
}
