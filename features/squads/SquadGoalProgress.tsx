"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  type SquadData,
  SQUAD_COLORS,
  fmtCurrency,
  initials,
} from "@/lib/squad-utils";

const REVENUE_META = 350000;

function SquadGoalCard({
  squad,
  colorIdx,
  squadCount,
}: {
  squad: SquadData;
  colorIdx: number;
  squadCount: number;
}) {
  const color = SQUAD_COLORS[colorIdx % SQUAD_COLORS.length];
  const metaPerSquad = Math.round(REVENUE_META / squadCount);
  const pct = metaPerSquad > 0 ? Math.round((squad.revenue / metaPerSquad) * 100) : 0;
  const clampedPct = Math.min(pct, 100);
  const remaining = Math.max(metaPerSquad - squad.revenue, 0);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white shadow-md",
            color.bg,
          )}
        >
          {initials(squad.name)}
        </div>
        <h4 className="mt-3 text-sm font-bold text-foreground">{squad.name}</h4>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Progresso da Meta</span>
          <span
            className={cn(
              "text-2xl font-extrabold tabular-nums",
              pct >= 80
                ? "text-emerald-600 dark:text-emerald-400"
                : pct >= 40
                  ? "text-amber-500"
                  : "text-red-500",
            )}
          >
            {pct}%
          </span>
        </div>

        <Progress value={clampedPct} className="h-2.5" />

        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Realizado</span>
            <span className="font-bold tabular-nums text-red-500">{fmtCurrency(squad.revenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Meta do Squad</span>
            <span className="font-semibold tabular-nums text-foreground">{fmtCurrency(metaPerSquad)}</span>
          </div>
        </div>

        <p
          className={cn(
            "pt-1 text-center text-sm font-bold tabular-nums",
            remaining > 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {remaining > 0
            ? `Faltam ${fmtCurrency(remaining)}`
            : "Meta atingida!"}
        </p>
      </div>
    </div>
  );
}

export function SquadGoalProgress({ squads }: { squads: SquadData[] }) {
  const now = new Date();
  const monthName = now.toLocaleDateString("pt-BR", { month: "long" });
  const year = now.getFullYear();

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Meta Individual por Squad
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year} • Modelo MRR
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {squads.map((squad, i) => (
          <SquadGoalCard
            key={squad.name}
            squad={squad}
            colorIdx={i}
            squadCount={squads.length}
          />
        ))}
      </div>
    </div>
  );
}
