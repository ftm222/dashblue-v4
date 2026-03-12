"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Trophy, Zap } from "lucide-react";
import {
  type SquadData,
  SQUAD_COLORS,
  fmtCurrency,
  initials,
} from "@/lib/squad-utils";

const REVENUE_META = 350000;

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

export function SquadComparativeAnalysis({ squads }: { squads: SquadData[] }) {
  if (squads.length === 0) return null;

  const maxRevenue = Math.max(...squads.map((s) => s.revenue), 1);
  const metaPerSquad = Math.round(REVENUE_META / squads.length);
  const daysRemaining = getWorkingDaysRemaining();

  const leader = squads[0];
  const runnerUp = squads[1];
  const advantage = runnerUp ? leader.revenue - runnerUp.revenue : leader.revenue;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-sidebar/5 p-6 shadow-sm dark:bg-sidebar/20">
        <h3 className="mb-5 text-center text-sm font-bold tracking-tight text-foreground">
          📊 Análise Comparativa dos Cenários
        </h3>

        <div className="space-y-3">
          {squads.map((squad, i) => {
            const color = SQUAD_COLORS[i % SQUAD_COLORS.length];
            const barPct = (squad.revenue / maxRevenue) * 100;

            return (
              <div key={squad.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white",
                        color.bg,
                      )}
                    >
                      {initials(squad.name)}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{squad.name}</span>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    Projeção: {fmtCurrency(squad.revenue)}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted/50">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700 ease-out", color.bg)}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-2 border-l-4 border-amber-500 pl-3">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            Meta por Squad: {fmtCurrency(metaPerSquad)}
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-50/50 p-4 dark:bg-cyan-500/5">
          <h4 className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-400">
            🎯 Insights Estratégicos:
          </h4>
          <div className="mt-2 flex items-start gap-1.5">
            <Zap className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
            <p className="text-xs text-muted-foreground">
              Faltam <span className="font-bold text-foreground">{daysRemaining} dias</span> para decidir o campeão deste mês!
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 px-6 py-8 text-center text-white shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl">🏆</span>
          <p className="text-2xl font-extrabold uppercase tracking-wide">
            {leader.name} na Liderança!
          </p>
        </div>
        <p className="mt-3 text-lg font-bold text-white/90">
          +{fmtCurrency(advantage)} na frente!
        </p>
        <p className="mt-2 text-sm font-semibold text-white/70">
          Faltam {daysRemaining} dias para decidir o campeão deste mês!
        </p>
      </div>
    </div>
  );
}
