"use client";

import { useMemo } from "react";
import { Phone, PhoneOff, Clock, Repeat, PhoneCall, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Person } from "@/types";

interface CloserCallMetricsProps {
  closers: Person[];
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  iconColor: string;
  highlight?: boolean;
}

function MetricCard({ icon: Icon, label, value, subtitle, iconColor, highlight }: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-lg p-3 transition-colors",
        highlight ? "bg-amber-500/[0.06]" : "bg-muted/30",
      )}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground/60">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function CloserCallMetrics({ closers }: CloserCallMetricsProps) {
  const stats = useMemo(() => {
    let totalCalls = 0;
    let totalAnswered = 0;
    let totalMissed = 0;
    let totalDuration = 0;
    let totalCallsToClose = 0;
    let totalFollowUps = 0;
    let count = 0;

    for (const c of closers) {
      if (!c.callMetrics) continue;
      count++;
      totalCalls += c.callMetrics.totalCalls;
      totalAnswered += c.callMetrics.answeredCalls;
      totalMissed += c.callMetrics.missedCalls;
      totalDuration += c.callMetrics.avgDurationMinutes;
      totalCallsToClose += c.callMetrics.callsToClose;
      totalFollowUps += c.callMetrics.followUps;
    }

    if (count === 0) return null;

    const answerRate = totalCalls > 0 ? (totalAnswered / totalCalls) * 100 : 0;

    return {
      totalCalls,
      totalAnswered,
      totalMissed,
      answerRate,
      avgDuration: totalDuration / count,
      avgCallsToClose: totalCallsToClose / count,
      totalFollowUps,
    };
  }, [closers]);

  if (!stats) return null;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Métricas de Ligações
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 p-4 lg:grid-cols-3">
        <MetricCard
          icon={Phone}
          label="Total de Ligações"
          value={stats.totalCalls.toLocaleString("pt-BR")}
          subtitle={`${stats.answerRate.toFixed(0)}% atendidas`}
          iconColor="bg-primary/10 text-primary"
        />
        <MetricCard
          icon={PhoneCall}
          label="Atendidas"
          value={stats.totalAnswered.toLocaleString("pt-BR")}
          iconColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          icon={PhoneOff}
          label="Não Atendidas"
          value={stats.totalMissed.toLocaleString("pt-BR")}
          iconColor="bg-red-500/10 text-red-600 dark:text-red-400"
          highlight={stats.answerRate < 65}
        />
        <MetricCard
          icon={Clock}
          label="Duração Média"
          value={`${stats.avgDuration.toFixed(0)} min`}
          iconColor="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <MetricCard
          icon={TrendingDown}
          label="Calls até Fechar"
          value={stats.avgCallsToClose.toFixed(1)}
          subtitle="média por contrato"
          iconColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <MetricCard
          icon={Repeat}
          label="Follow-ups"
          value={stats.totalFollowUps.toLocaleString("pt-BR")}
          subtitle="total do time"
          iconColor="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
      </div>
    </div>
  );
}
