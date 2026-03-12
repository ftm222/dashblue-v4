"use client";

import { useMemo } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Person } from "@/types";

interface SDRPodiumProps {
  sdrs: Person[];
  onSDRClick?: (personId: string) => void;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fmt(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface RankedSDR {
  id: string;
  name: string;
  avatarUrl?: string;
  revenue: number;
  calls: number;
  contracts: number;
  squad?: string;
}

const podiumConfig = [
  {
    position: 1,
    icon: Trophy,
    gradient: "from-amber-500/20 via-amber-400/10 to-transparent",
    ring: "ring-amber-500/40",
    iconColor: "text-amber-500",
    badgeBg: "bg-amber-500",
    heightClass: "h-36",
    avatarSize: "h-16 w-16",
    initialsSize: "text-lg",
    nameSize: "text-sm",
    order: "order-2",
  },
  {
    position: 2,
    icon: Medal,
    gradient: "from-slate-400/15 via-slate-300/5 to-transparent",
    ring: "ring-slate-400/30",
    iconColor: "text-slate-400",
    badgeBg: "bg-slate-400",
    heightClass: "h-24",
    avatarSize: "h-14 w-14",
    initialsSize: "text-base",
    nameSize: "text-sm",
    order: "order-1",
  },
  {
    position: 3,
    icon: Award,
    gradient: "from-orange-700/15 via-orange-600/5 to-transparent",
    ring: "ring-orange-700/30",
    iconColor: "text-orange-700 dark:text-orange-500",
    badgeBg: "bg-orange-700 dark:bg-orange-600",
    heightClass: "h-16",
    avatarSize: "h-12 w-12",
    initialsSize: "text-sm",
    nameSize: "text-xs",
    order: "order-3",
  },
];

function PodiumSlot({
  sdr,
  config,
  onClick,
}: {
  sdr: RankedSDR;
  config: (typeof podiumConfig)[number];
  onClick?: () => void;
}) {
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3",
        config.order,
        onClick && "cursor-pointer",
      )}
      onClick={onClick}
    >
      <div className="relative group">
        <Avatar
          className={cn(
            config.avatarSize,
            "rounded-xl ring-2 transition-transform duration-200 group-hover:scale-105",
            config.ring,
          )}
        >
          <AvatarImage src={sdr.avatarUrl} alt={sdr.name} />
          <AvatarFallback
            className={cn(
              "rounded-xl font-semibold",
              config.initialsSize,
              config.position === 1
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : config.position === 2
                  ? "bg-slate-400/15 text-slate-500 dark:text-slate-300"
                  : "bg-orange-700/15 text-orange-700 dark:text-orange-400",
            )}
          >
            {initials(sdr.name)}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm",
            config.badgeBg,
          )}
        >
          {config.position}
        </div>
      </div>

      <div className="text-center space-y-0.5">
        <p className={cn("font-semibold tracking-tight leading-tight", config.nameSize)}>
          {sdr.name.split(" ")[0]}
        </p>
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
          {fmt(sdr.revenue)}
        </p>
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {sdr.calls} calls realizadas
        </p>
      </div>

      <div
        className={cn(
          "w-20 rounded-t-lg bg-gradient-to-b transition-all duration-300",
          config.gradient,
          config.heightClass,
        )}
      >
        <div className="flex h-full items-start justify-center pt-2">
          <Icon className={cn("h-4 w-4", config.iconColor)} />
        </div>
      </div>

      {config.position === 1 && (
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 ring-1 ring-amber-500/30">
          <Trophy className="h-3 w-3 text-amber-500" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Destaque do Mês
          </span>
        </div>
      )}
    </div>
  );
}

export function SDRPodium({ sdrs, onSDRClick }: SDRPodiumProps) {
  const top3 = useMemo<RankedSDR[]>(() => {
    return sdrs
      .map((s) => ({
        id: s.id,
        name: s.name,
        avatarUrl: s.avatarUrl,
        revenue: s.salesOriginated ?? 0,
        calls: s.callMetrics?.totalCalls ?? 0,
        contracts: s.contractsOriginated ?? 0,
        squad: s.squad,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
  }, [sdrs]);

  if (top3.length < 3) return null;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pódio Top 3 SDRs
        </h3>
      </div>
      <div className="flex items-end justify-center gap-6">
        {top3.map((sdr, i) => (
          <PodiumSlot
            key={sdr.id}
            sdr={sdr}
            config={podiumConfig[i]}
            onClick={onSDRClick ? () => onSDRClick(sdr.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
