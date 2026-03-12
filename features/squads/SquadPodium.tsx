"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type SquadData,
  SQUAD_COLORS,
  fmtCurrency,
  fmtShortCurrency,
  initials,
} from "@/lib/squad-utils";

const REVENUE_META = 350000;

function SquadPodiumCard({
  squad,
  colorIdx,
  isLeader,
  totalRevenue,
}: {
  squad: SquadData;
  colorIdx: number;
  isLeader: boolean;
  totalRevenue: number;
}) {
  const color = SQUAD_COLORS[colorIdx % SQUAD_COLORS.length];
  const metaPerSquad = Math.round(REVENUE_META / 3);
  const pctOfMeta = metaPerSquad > 0 ? ((squad.revenue / metaPerSquad) * 100).toFixed(1) : "0";
  const pctOfTotal = totalRevenue > 0 ? ((squad.revenue / totalRevenue) * 100).toFixed(1) : "0";

  return (
    <div className="relative flex flex-col items-center rounded-2xl border bg-card p-6 shadow-sm text-center">
      {isLeader && (
        <Badge className="absolute -top-2.5 left-4 bg-amber-500 text-white shadow-sm hover:bg-amber-500">
          <Crown className="mr-1 h-3 w-3" />
          LÍDER
        </Badge>
      )}

      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white shadow-md",
          color.bg,
        )}
      >
        {initials(squad.name)}
      </div>

      <h3 className="mt-3 text-sm font-extrabold uppercase tracking-wider text-foreground">
        {squad.name}
      </h3>

      <div className={cn("mt-4 w-full rounded-xl px-4 py-3", `${color.bg}/10`)}>
        <p className="text-2xl font-extrabold tabular-nums text-foreground">
          {fmtCurrency(squad.revenue)}
        </p>
        <p className="text-xs text-muted-foreground">
          {squad.contracts} contratos
        </p>
      </div>

      <p className={cn("mt-3 text-2xl font-bold tabular-nums", color.text)}>
        {pctOfMeta}%
      </p>
      <p className="text-[10px] text-muted-foreground/60">da meta</p>

      {isLeader && (
        <div className="mt-2">
          <span className="text-lg">🏆</span>
        </div>
      )}
    </div>
  );
}

export function SquadPodium({ squads }: { squads: SquadData[] }) {
  if (squads.length === 0) return null;

  const totalRevenue = squads.reduce((s, sq) => s + sq.revenue, 0);
  const leader = squads[0];
  const runnerUp = squads[1];
  const advantage = runnerUp ? leader.revenue - runnerUp.revenue : leader.revenue;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-center text-lg font-bold tracking-tight text-foreground">
          Guerra de Squads
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {squads.map((squad, i) => (
            <SquadPodiumCard
              key={squad.name}
              squad={squad}
              colorIdx={i}
              isLeader={i === 0}
              totalRevenue={totalRevenue}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-center dark:bg-amber-500/10">
          <Trophy className="h-4 w-4 text-amber-600" />
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
            {leader.name} lidera com +{fmtCurrency(advantage)} de vantagem
          </p>
        </div>
      </div>
    </div>
  );
}
