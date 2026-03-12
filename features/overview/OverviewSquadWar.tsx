"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { usePeople } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Person } from "@/types";

interface SquadData {
  name: string;
  revenue: number;
  contracts: number;
  members: { name: string; role: "sdr" | "closer" }[];
}

const SQUAD_COLORS = [
  { border: "border-l-rose-500", bg: "bg-rose-500", text: "text-rose-500" },
  { border: "border-l-blue-500", bg: "bg-blue-500", text: "text-blue-500" },
  { border: "border-l-orange-500", bg: "bg-orange-500", text: "text-orange-500" },
  { border: "border-l-violet-500", bg: "bg-violet-500", text: "text-violet-500" },
  { border: "border-l-emerald-500", bg: "bg-emerald-500", text: "text-emerald-500" },
];

function fmtCurrency(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(".", ",")}k`;
  }
  return value.toLocaleString("pt-BR");
}

function fmtFull(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function groupBySquad(sdrs: Person[], closers: Person[]): SquadData[] {
  const all = [...sdrs, ...closers];
  const map = new Map<string, SquadData>();

  for (const p of all) {
    const squad = p.squad ?? "Sem Squad";
    if (!map.has(squad)) {
      map.set(squad, { name: squad, revenue: 0, contracts: 0, members: [] });
    }
    const s = map.get(squad)!;
    const rev = p.kpis.find((k) => k.key === "revenue")?.value ?? 0;
    const won = p.kpis.find((k) => k.key === "won")?.value ?? 0;
    s.revenue += rev;
    s.contracts += won;
    s.members.push({ name: p.name, role: p.role });
  }

  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

function SquadCard({
  squad,
  rank,
  colorIdx,
  isLeader,
}: {
  squad: SquadData;
  rank: number;
  colorIdx: number;
  isLeader: boolean;
}) {
  const color = SQUAD_COLORS[colorIdx % SQUAD_COLORS.length];

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border-l-4 bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        color.border,
      )}
    >
      {isLeader && (
        <Badge
          className="absolute -top-2.5 left-4 bg-amber-500 text-white shadow-sm hover:bg-amber-500"
        >
          <Crown className="mr-1 h-3 w-3" />
          LÍDER
        </Badge>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white",
            color.bg,
          )}
        >
          {initials(squad.name)}
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            SQUAD {squad.name.toUpperCase()}
          </h4>
        </div>
      </div>

      <p className="text-4xl font-extrabold tabular-nums tracking-tight text-foreground">
        {fmtCurrency(squad.revenue)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {squad.contracts} contratos fechados
      </p>

      <div className="mt-5 border-t pt-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          Membros
        </p>
        <ul className="space-y-1.5">
          {squad.members.map((m, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground/40">•</span>
              <span className="font-medium text-foreground">{m.name}</span>
              <span className="text-xs text-muted-foreground">
                ({m.role === "sdr" ? "SDR" : "Closer"})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function LeaderBanner({
  leader,
  runnerUp,
}: {
  leader: SquadData;
  runnerUp?: SquadData;
}) {
  const advantage = runnerUp ? leader.revenue - runnerUp.revenue : leader.revenue;
  const advantagePct = runnerUp && runnerUp.revenue > 0
    ? ((advantage / runnerUp.revenue) * 100).toFixed(1)
    : "100";

  return (
    <div className="mt-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-5 text-center text-white shadow-md">
      <div className="flex items-center justify-center gap-2">
        <Trophy className="h-5 w-5" />
        <p className="text-lg font-extrabold uppercase tracking-wide">
          Squad {leader.name} está na liderança
        </p>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-white/90">
        Vantagem: {fmtFull(advantage)} ({advantagePct}%)
      </p>
    </div>
  );
}

export function OverviewSquadWar() {
  const { period } = usePeriodFilter();
  const sdrs = usePeople("sdr", period);
  const closers = usePeople("closer", period);

  const isLoading = sdrs.isLoading || closers.isLoading;
  const hasError = sdrs.isError || closers.isError;

  const squads = useMemo(
    () => groupBySquad(sdrs.data ?? [], closers.data ?? []),
    [sdrs.data, closers.data],
  );

  if (hasError) {
    return (
      <ErrorState
        onRetry={() => {
          sdrs.refetch();
          closers.refetch();
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-5">
        <Skeleton className="h-5 w-44" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  if (squads.length === 0) return null;

  return (
    <div className="space-y-0">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          Guerra de Squads
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {squads.map((squad, i) => (
          <SquadCard
            key={squad.name}
            squad={squad}
            rank={i + 1}
            colorIdx={i}
            isLeader={i === 0}
          />
        ))}
      </div>

      <LeaderBanner leader={squads[0]} runnerUp={squads[1]} />
    </div>
  );
}
