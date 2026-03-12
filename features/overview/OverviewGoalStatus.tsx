"use client";

import { useMemo } from "react";
import { Target, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useGoals } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { Skeleton } from "@/components/ui/skeleton";

function fmt(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtShort(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getWorkingDaysRemaining(): number {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  let count = 0;
  const d = new Date(today);
  d.setDate(d.getDate() + 1);
  while (d <= lastDay) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

interface GoalCardProps {
  label: string;
  target: number;
  current: number;
  subtitle?: string;
}

function GoalCard({ label, target, current, subtitle }: GoalCardProps) {
  const pct = target > 0 ? Math.round((current / target) * 100) : 0;
  const remaining = Math.max(target - current, 0);
  const clampedPct = Math.min(pct, 100);

  const isOnTrack = pct >= 60;
  const isDanger = pct < 30;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            {label}
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums tracking-tight">
            {fmtShort(target)}
          </p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "text-2xl font-bold tabular-nums",
              isOnTrack
                ? "text-emerald-600 dark:text-emerald-400"
                : isDanger
                  ? "text-red-500"
                  : "text-amber-500",
            )}
          >
            {pct}%
          </p>
          <p className="text-[10px] text-muted-foreground/60">do objetivo</p>
        </div>
      </div>

      <Progress value={clampedPct} className="h-2" />

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground tabular-nums">
          Faltam{" "}
          <span className="font-semibold text-foreground">
            {fmt(remaining)}
          </span>{" "}
          para a meta
        </p>
        {subtitle && (
          <div className="flex items-center gap-1.5">
            {isOnTrack ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-3 w-3 text-amber-500" />
            )}
            <span
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wide",
                isOnTrack
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isDanger
                    ? "text-red-500"
                    : "text-amber-600 dark:text-amber-400",
              )}
            >
              {isOnTrack ? "No caminho" : isDanger ? "Atenção" : "Atenção"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function OverviewGoalStatus() {
  const { period } = usePeriodFilter();
  const { data: goals, isLoading } = useGoals(period);

  const workingDays = useMemo(() => getWorkingDaysRemaining(), []);

  const revenueGoal = goals?.find((g) => g.type === "revenue");

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!revenueGoal) return null;

  const monthlyTarget = revenueGoal.target;
  const monthlyCurrent = revenueGoal.current;
  const weeklyTarget = Math.round(monthlyTarget / 4);
  const weeklyCurrent = Math.round(monthlyCurrent * 0.25);
  const totalWorkingDaysInMonth = 22;
  const dailyTarget = Math.round(monthlyTarget / totalWorkingDaysInMonth);
  const dailyCurrent = Math.round(monthlyCurrent / Math.max(totalWorkingDaysInMonth - workingDays, 1));

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight">Status das Metas</h3>
        <div className="ml-auto flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span className="text-[11px] tabular-nums">{workingDays} dias úteis restantes</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <GoalCard
          label="Meta Mensal"
          target={monthlyTarget}
          current={monthlyCurrent}
          subtitle="status"
        />
        <GoalCard
          label="Meta Semanal"
          target={weeklyTarget}
          current={weeklyCurrent}
          subtitle="status"
        />
        <GoalCard
          label="Meta Diária"
          target={dailyTarget}
          current={dailyCurrent}
          subtitle="status"
        />
      </div>
    </div>
  );
}
