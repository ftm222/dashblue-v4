"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  type SquadData,
  SQUAD_COLORS,
  fmtCurrency,
  fmtShortCurrency,
  initials,
} from "@/lib/squad-utils";

const REVENUE_META = 350000;

interface Scenario {
  label: string;
  emoji: string;
  multiplier: number;
  borderColor: string;
  bgColor: string;
}

const SCENARIOS: Scenario[] = [
  { label: "PESSIMISTA", emoji: "😰", multiplier: 0.8, borderColor: "border-rose-300", bgColor: "bg-rose-50 dark:bg-rose-500/5" },
  { label: "REALISTA", emoji: "🤩", multiplier: 1.0, borderColor: "border-blue-400", bgColor: "bg-blue-50 dark:bg-blue-500/5" },
  { label: "OTIMISTA", emoji: "🤩", multiplier: 1.2, borderColor: "border-emerald-300", bgColor: "bg-emerald-50 dark:bg-emerald-500/5" },
];

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

function getWorkingDaysElapsed(): number {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  let count = 0;
  const d = new Date(firstDay);
  while (d <= today) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return Math.max(count, 1);
}

function SquadProjectionCard({
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
  const daysElapsed = getWorkingDaysElapsed();
  const daysRemaining = getWorkingDaysRemaining();
  const totalDays = daysElapsed + daysRemaining;
  const dailyRate = squad.revenue / daysElapsed;

  const projections = SCENARIOS.map((s) => {
    const projected = Math.round(squad.revenue + dailyRate * daysRemaining * s.multiplier);
    const pct = metaPerSquad > 0 ? Math.round((projected / metaPerSquad) * 100) : 0;
    const belowMeta = projected < metaPerSquad;

    const showRate = squad.showRate * (s.multiplier === 1 ? 1 : s.multiplier === 0.8 ? 0.9 : 1.1);
    const convRate = squad.conversionRate * (s.multiplier === 1 ? 1 : s.multiplier === 0.8 ? 0.8 : 1.2);
    const ticket = squad.ticketMedio * (s.multiplier === 1 ? 1 : s.multiplier === 0.8 ? 0.9 : 1.15);

    return { ...s, projected, pct, belowMeta, showRate, convRate, ticket };
  });

  const minProj = projections[0].projected;
  const maxProj = projections[2].projected;
  const metaPct = metaPerSquad > 0 ? Math.min((squad.revenue / metaPerSquad) * 100, 100) : 0;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white",
            color.bg,
          )}
        >
          {initials(squad.name)}
        </div>
        <h3 className="text-sm font-bold text-foreground">{squad.name}</h3>
        <div className="ml-auto text-right">
          <p className="text-[10px] text-muted-foreground/60">Range de Projeção</p>
          <p className="text-xs font-semibold tabular-nums text-foreground">
            {fmtCurrency(minProj)} - {fmtCurrency(maxProj)}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium text-muted-foreground tabular-nums">
            Meta {fmtCurrency(metaPerSquad)}
          </span>
        </div>
        <Progress value={metaPct} className="h-2" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {projections.map((p) => (
          <div
            key={p.label}
            className={cn(
              "rounded-xl border p-3 text-center",
              p.borderColor,
              p.bgColor,
            )}
          >
            <span className="text-lg">{p.emoji}</span>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {p.label}
            </p>
            <p className="mt-2 text-base font-extrabold tabular-nums text-foreground">
              {fmtCurrency(p.projected)}
            </p>
            <p className="mt-1 text-xs font-medium tabular-nums text-muted-foreground">
              {p.pct}%
            </p>
            <p
              className={cn(
                "mt-1 text-[10px] font-bold",
                p.belowMeta ? "text-amber-600" : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {p.belowMeta ? "⚠️ Abaixo da meta" : "✅ No caminho"}
            </p>
            <p className="mt-2 text-[9px] leading-snug text-muted-foreground/70">
              Show {p.showRate.toFixed(1)}% • Conv {p.convRate.toFixed(1)}% • Ticket {fmtShortCurrency(p.ticket)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SquadProjections({ squads }: { squads: SquadData[] }) {
  if (squads.length === 0) return null;

  return (
    <div className="space-y-5">
      <h2 className="text-center text-lg font-bold tracking-tight text-foreground">
        📊 Projeções para Fim do Mês
      </h2>

      <div className="space-y-4">
        {squads.map((squad, i) => (
          <SquadProjectionCard
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
