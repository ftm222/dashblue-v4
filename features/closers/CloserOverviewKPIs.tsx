"use client";

import { useMemo } from "react";
import { DollarSign, BarChart3, Target, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Person } from "@/types";

const TICKET_META = 5000;
const CONVERSION_META = 30;

interface CloserOverviewKPIsProps {
  closers: Person[];
}

function fmt(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function KPIStatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  meta,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  meta?: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {label}
          </p>
          <p className="text-xl font-semibold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {meta && (
            <p className="text-[11px] tabular-nums text-muted-foreground/60">
              Meta: <span className="font-medium text-muted-foreground">{meta}</span>
            </p>
          )}
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export function CloserOverviewKPIs({ closers }: CloserOverviewKPIsProps) {
  const stats = useMemo(() => {
    if (!closers.length) return null;

    let totalRevenue = 0;
    let totalWon = 0;
    let totalReceived = 0;
    let topCloser: Person | null = null;
    let topRevenue = 0;

    for (const c of closers) {
      const rev = c.kpis.find((k) => k.key === "revenue")?.value ?? 0;
      const won = c.kpis.find((k) => k.key === "won")?.value ?? 0;
      const received = c.kpis.find((k) => k.key === "received")?.value ?? 0;

      totalRevenue += rev;
      totalWon += won;
      totalReceived += received;

      if (rev > topRevenue) {
        topRevenue = rev;
        topCloser = c;
      }
    }

    const avgTicket = totalWon > 0 ? totalRevenue / totalWon : 0;
    const avgConversion = totalReceived > 0 ? (totalWon / totalReceived) * 100 : 0;

    return { totalRevenue, totalWon, avgTicket, avgConversion, topCloser, topRevenue };
  }, [closers]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KPIStatCard
        icon={DollarSign}
        label="Receita Total"
        value={fmt(stats.totalRevenue)}
        subtitle={`${stats.totalWon} contratos fechados`}
        iconColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <KPIStatCard
        icon={BarChart3}
        label="Ticket Médio"
        value={fmt(stats.avgTicket)}
        meta={fmt(TICKET_META)}
        iconColor="bg-primary/10 text-primary"
      />
      <KPIStatCard
        icon={Target}
        label="Conversão Média"
        value={`${stats.avgConversion.toFixed(1)}%`}
        meta={`${CONVERSION_META}%`}
        iconColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />

      {stats.topCloser && (
        <div className="rounded-xl border bg-card p-5 shadow-sm ring-1 ring-amber-500/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-3 w-3 text-amber-500" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Closer Destaque
                </p>
              </div>
              <p className="text-base font-semibold tracking-tight">{stats.topCloser.name}</p>
              <p className="text-xs text-muted-foreground">{fmt(stats.topRevenue)}</p>
            </div>
            <Avatar className="h-9 w-9 rounded-lg">
              <AvatarImage src={stats.topCloser.avatarUrl} alt={stats.topCloser.name} />
              <AvatarFallback className="rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-600">
                {initials(stats.topCloser.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      )}
    </div>
  );
}
