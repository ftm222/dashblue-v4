"use client";

import { useMemo } from "react";
import { Phone, CheckCircle2, BarChart3, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Person } from "@/types";

const CALLS_META = 550;
const QUALIFICATION_META = 50;
const SHOW_META = 75;

interface SDROverviewKPIsProps {
  sdrs: Person[];
}

function fmt(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function KPIProgressCard({
  icon: Icon,
  label,
  value,
  meta,
  progress,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  meta: string;
  progress: number;
  iconColor: string;
}) {
  const clampedProgress = Math.min(progress, 100);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </p>
        <p className="text-xl font-semibold tracking-tight">{value}</p>
        <p className="text-[11px] tabular-nums text-muted-foreground/60">
          {meta}
        </p>
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/60">Progresso</span>
          <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={clampedProgress} className="h-1.5" />
      </div>
    </div>
  );
}

export function SDROverviewKPIs({ sdrs }: SDROverviewKPIsProps) {
  const stats = useMemo(() => {
    if (!sdrs.length) return null;

    let totalCalls = 0;
    let totalBooked = 0;
    let totalLeads = 0;
    let totalReceived = 0;
    let topSDR: Person | null = null;
    let topRevenue = 0;

    for (const s of sdrs) {
      totalCalls += s.callMetrics?.totalCalls ?? 0;
      totalLeads += s.kpis.find((k) => k.key === "leads")?.value ?? 0;
      totalBooked += s.kpis.find((k) => k.key === "booked")?.value ?? 0;
      const showRateKPI = s.kpis.find((k) => k.key === "show_rate");
      if (showRateKPI) totalReceived += showRateKPI.value;

      const rev = s.salesOriginated ?? 0;
      if (rev > topRevenue) {
        topRevenue = rev;
        topSDR = s;
      }
    }

    const avgQualification = totalLeads > 0 ? (totalBooked / totalLeads) * 100 : 0;
    const avgShow = totalReceived / sdrs.length;

    return {
      totalCalls,
      avgQualification,
      avgShow,
      topSDR,
      topRevenue,
      topContracts: topSDR?.contractsOriginated ?? 0,
    };
  }, [sdrs]);

  if (!stats) return null;

  const callsProgress = (stats.totalCalls / CALLS_META) * 100;
  const qualProgress = (stats.avgQualification / QUALIFICATION_META) * 100;
  const showProgress = (stats.avgShow / SHOW_META) * 100;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KPIProgressCard
        icon={Phone}
        label="Total de Calls"
        value={String(stats.totalCalls)}
        meta={`Meta mensal: ${CALLS_META} calls`}
        progress={callsProgress}
        iconColor="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
      <KPIProgressCard
        icon={CheckCircle2}
        label="Taxa Média de Qualificação"
        value={`${stats.avgQualification.toFixed(1)}%`}
        meta={`Meta: ${QUALIFICATION_META}%`}
        progress={qualProgress}
        iconColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <KPIProgressCard
        icon={BarChart3}
        label="Taxa Média de Show"
        value={`${stats.avgShow.toFixed(1)}%`}
        meta={`Meta: ${SHOW_META}%`}
        progress={showProgress}
        iconColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />

      {stats.topSDR && (
        <div className="rounded-xl border bg-card p-5 shadow-sm ring-1 ring-amber-500/20">
          <div className="flex items-start justify-between">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", "bg-amber-500/10 text-amber-600 dark:text-amber-400")}>
              <Trophy className="h-4 w-4" />
            </div>
            <Avatar className="h-9 w-9 rounded-lg">
              <AvatarImage src={stats.topSDR.avatarUrl} alt={stats.topSDR.name} />
              <AvatarFallback className="rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-600">
                {initials(stats.topSDR.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              SDR Destaque
            </p>
            <p className="text-base font-semibold tracking-tight">{stats.topSDR.name}</p>
            <p className="text-sm font-semibold text-muted-foreground">{fmt(stats.topRevenue)}</p>
            <p className="text-[11px] text-muted-foreground/60">
              {stats.topContracts} contratos originados
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
