"use client";

import { useMemo, useState, useEffect } from "react";
import { CheckCircle2, TrendingUp, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CLOSER_GOAL_METRICS } from "@/lib/goal-metrics";
import type { Person, IndividualGoalTargets, IndividualGoalConfig } from "@/types";

interface CloserGoalsGridProps {
  closers: Person[];
  onCloserClick?: (personId: string) => void;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatValue(value: number, format: "currency" | "number"): string {
  if (format === "currency") {
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
    return `R$ ${value.toLocaleString("pt-BR")}`;
  }
  return value.toLocaleString("pt-BR");
}

interface GoalData {
  config: IndividualGoalConfig;
  current: number;
  target: number;
  percentage: number;
}

function GoalMiniBar({ goal }: { goal: GoalData }) {
  const done = goal.percentage >= 100;
  const high = goal.percentage >= 70;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{goal.config.label}</span>
        <span
          className={cn(
            "text-[10px] font-medium tabular-nums",
            done
              ? "text-emerald-600 dark:text-emerald-400"
              : high
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground",
          )}
        >
          {goal.percentage}%
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            done
              ? "bg-emerald-500 dark:bg-emerald-400"
              : high
                ? "bg-amber-500 dark:bg-amber-400"
                : "bg-primary/70",
          )}
          style={{ width: `${Math.min(goal.percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function CloserGoalCard({
  closer,
  goals,
  overallPercentage,
  onClick,
}: {
  closer: Person;
  goals: GoalData[];
  overallPercentage: number;
  onClick?: () => void;
}) {
  const allDone = overallPercentage >= 100;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/20",
        allDone && "ring-1 ring-emerald-500/20",
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-9 w-9 rounded-lg">
          <AvatarImage src={closer.avatarUrl} alt={closer.name} />
          <AvatarFallback className="rounded-lg text-[10px] font-medium bg-primary/10 text-primary">
            {initials(closer.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{closer.name}</p>
          {closer.squad && (
            <p className="text-[10px] text-muted-foreground">{closer.squad}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {allDone ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              allDone
                ? "text-emerald-600 dark:text-emerald-400"
                : overallPercentage >= 70
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-foreground",
            )}
          >
            {overallPercentage}%
          </span>
        </div>
      </div>

      {/* Overall progress */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            allDone
              ? "bg-emerald-500 dark:bg-emerald-400"
              : overallPercentage >= 70
                ? "bg-amber-500 dark:bg-amber-400"
                : "bg-primary/70",
          )}
          style={{ width: `${Math.min(overallPercentage, 100)}%` }}
        />
      </div>

      {/* Individual goals */}
      {goals.length > 0 ? (
        <div className="space-y-2">
          {goals.map((goal) => (
            <GoalMiniBar key={goal.config.metric} goal={goal} />
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground/60 text-center py-2">
          Sem metas definidas
        </p>
      )}
    </div>
  );
}

function useGoalTargets(): IndividualGoalTargets {
  const [targets, setTargets] = useState<IndividualGoalTargets>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("dashblue:individual-goals");
      if (raw) setTargets(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  return targets;
}

export function CloserGoalsGrid({ closers, onCloserClick }: CloserGoalsGridProps) {
  const allTargets = useGoalTargets();

  const closersWithGoals = useMemo(() => {
    return closers
      .map((closer) => {
        const personTargets = allTargets[closer.id] ?? {};
        const goals: GoalData[] = CLOSER_GOAL_METRICS.map((config) => {
          const target = personTargets[config.metric] ?? 0;
          const current = closer.kpis.find((k) => k.key === config.metric)?.value ?? 0;
          const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
          return { config, current, target, percentage };
        }).filter((g) => g.target > 0);

        const overallPercentage =
          goals.length > 0
            ? Math.round(goals.reduce((sum, g) => sum + g.percentage, 0) / goals.length)
            : 0;

        return { closer, goals, overallPercentage };
      })
      .sort((a, b) => b.overallPercentage - a.overallPercentage);
  }, [closers, allTargets]);

  const hasAnyGoals = closersWithGoals.some((c) => c.goals.length > 0);

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Metas Individuais
          </h3>
        </div>
        {hasAnyGoals && (
          <div className="flex items-center gap-1.5">
            <Target className="h-3 w-3 text-muted-foreground/60" />
            <span className="text-[10px] text-muted-foreground/60">
              {closersWithGoals.filter((c) => c.overallPercentage >= 100).length}/{closers.length} atingiram
            </span>
          </div>
        )}
      </div>

      {hasAnyGoals ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {closersWithGoals.map(({ closer, goals, overallPercentage }) => (
            <CloserGoalCard
              key={closer.id}
              closer={closer}
              goals={goals}
              overallPercentage={overallPercentage}
              onClick={onCloserClick ? () => onCloserClick(closer.id) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <Target className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground/80">Nenhuma meta individual definida</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Defina metas em Admin → Metas Individuais
          </p>
        </div>
      )}
    </div>
  );
}
