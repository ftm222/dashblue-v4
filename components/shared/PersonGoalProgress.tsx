"use client";

import { CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KPI, IndividualGoalConfig } from "@/types";

interface PersonGoalProgressProps {
  kpis: KPI[];
  goalConfigs: IndividualGoalConfig[];
  targets: Record<string, number>;
}

function formatGoalValue(value: number, format: "currency" | "number"): string {
  if (format === "currency") {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return value.toLocaleString("pt-BR");
}

function GoalProgressItem({
  goal,
}: {
  goal: IndividualGoalConfig & { current: number; target: number; percentage: number };
}) {
  const done = goal.percentage >= 100;
  const high = goal.percentage >= 70;

  return (
    <div className="group flex items-center gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 transition-colors group-hover:bg-muted">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
        ) : (
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium truncate">{goal.label}</span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatGoalValue(goal.current, goal.format)}{" "}
            <span className="text-muted-foreground/50">de</span>{" "}
            {formatGoalValue(goal.target, goal.format)}
          </span>
        </div>

        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              done
                ? "bg-emerald-500 dark:bg-emerald-400"
                : high
                  ? "bg-amber-500 dark:bg-amber-400"
                  : "bg-primary/80",
            )}
            style={{ width: `${goal.percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-[11px] font-medium leading-none",
              done
                ? "text-emerald-600 dark:text-emerald-400"
                : high
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground",
            )}
          >
            {done ? "Meta atingida" : `${goal.percentage}%`}
          </span>
          {!done && (
            <span className="text-[11px] tabular-nums text-muted-foreground/60 leading-none">
              falta {formatGoalValue(goal.target - goal.current, goal.format)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function PersonGoalProgress({ kpis, goalConfigs, targets }: PersonGoalProgressProps) {
  const goalsWithData = goalConfigs
    .map((config) => {
      const kpi = kpis.find((k) => k.key === config.metric);
      const target = targets[config.metric];
      if (!target || target <= 0) return null;
      const current = kpi?.value ?? 0;
      const percentage = Math.min(Math.round((current / target) * 100), 100);
      return { ...config, current, target, percentage };
    })
    .filter(Boolean) as Array<IndividualGoalConfig & { current: number; target: number; percentage: number }>;

  if (goalsWithData.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Metas do período
        </h3>
      </div>
      <div className="space-y-4">
        {goalsWithData.map((goal) => (
          <GoalProgressItem key={goal.metric} goal={goal} />
        ))}
      </div>
    </div>
  );
}
