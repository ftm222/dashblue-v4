"use client";

import { useMemo } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Person } from "@/types";

interface CloserPodiumProps {
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

function fmt(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface RankedCloser {
  id: string;
  name: string;
  avatarUrl?: string;
  revenue: number;
  won: number;
  conversion: number;
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
  closer,
  config,
  onClick,
}: {
  closer: RankedCloser;
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
      {/* Avatar + badge */}
      <div className="relative group">
        <Avatar
          className={cn(
            config.avatarSize,
            "rounded-xl ring-2 transition-transform duration-200 group-hover:scale-105",
            config.ring,
          )}
        >
          <AvatarImage src={closer.avatarUrl} alt={closer.name} />
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
            {initials(closer.name)}
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

      {/* Name + stats */}
      <div className="text-center space-y-0.5">
        <p className={cn("font-semibold tracking-tight leading-tight", config.nameSize)}>
          {closer.name.split(" ")[0]}
        </p>
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
          {fmt(closer.revenue)}
        </p>
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {closer.won} contratos · {closer.conversion.toFixed(0)}%
        </p>
      </div>

      {/* Pedestal bar */}
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

      {/* Top Closer badge - only for 1st place */}
      {config.position === 1 && (
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 ring-1 ring-amber-500/30">
          <Trophy className="h-3 w-3 text-amber-500" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Top Closer do Mês
          </span>
        </div>
      )}
    </div>
  );
}

export function CloserPodium({ closers, onCloserClick }: CloserPodiumProps) {
  const top3 = useMemo<RankedCloser[]>(() => {
    return closers
      .map((c) => {
        const revenue = c.kpis.find((k) => k.key === "revenue")?.value ?? 0;
        const won = c.kpis.find((k) => k.key === "won")?.value ?? 0;
        const received = c.kpis.find((k) => k.key === "received")?.value ?? 0;
        const conversion = received > 0 ? (won / received) * 100 : 0;
        return {
          id: c.id,
          name: c.name,
          avatarUrl: c.avatarUrl,
          revenue,
          won,
          conversion,
          squad: c.squad,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
  }, [closers]);

  if (top3.length < 3) return null;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Top 3 Closers
        </h3>
      </div>
      <div className="flex items-end justify-center gap-6">
        {top3.map((closer, i) => (
          <PodiumSlot
            key={closer.id}
            closer={closer}
            config={podiumConfig[i]}
            onClick={onCloserClick ? () => onCloserClick(closer.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
