"use client";

import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Person } from "@/types";

interface SDRComparisonCardsProps {
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

interface SDRRow {
  id: string;
  name: string;
  avatarUrl?: string;
  squad?: string;
  totalCalls: number;
  r1: number;
  r2: number;
  qualified: number;
  qualificationRate: number;
  showRate: number;
  salesOriginated: number;
  contracts: number;
}

function rateColor(value: number, threshold: number) {
  if (value >= threshold) return "text-emerald-500";
  if (value >= threshold * 0.7) return "text-amber-500";
  return "text-red-500";
}

function rateDot(value: number, threshold: number) {
  if (value >= threshold) return "bg-emerald-500";
  if (value >= threshold * 0.7) return "bg-amber-500";
  return "bg-red-500";
}

function SDRCard({
  sdr,
  rank,
  maxRevenue,
  onClick,
}: {
  sdr: SDRRow;
  rank: number;
  maxRevenue: number;
  onClick?: () => void;
}) {
  const barWidth = maxRevenue > 0 ? (sdr.salesOriginated / maxRevenue) * 100 : 0;
  const isTop = rank === 0;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-sm transition-all duration-200 overflow-hidden",
        onClick && "cursor-pointer hover:ring-1 hover:ring-primary/20 hover:shadow-md",
        isTop && "ring-1 ring-amber-500/30",
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <Avatar className="h-10 w-10 rounded-lg shrink-0">
          <AvatarImage src={sdr.avatarUrl} alt={sdr.name} />
          <AvatarFallback className="rounded-lg text-xs font-medium bg-primary/10 text-primary">
            {initials(sdr.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">{sdr.name}</span>
            {sdr.squad && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0">
                {sdr.squad}
              </Badge>
            )}
          </div>
        </div>
        {isTop && (
          <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-px bg-border/30">
        <div className="bg-card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Calls
          </p>
          <p className="text-lg font-semibold tabular-nums">{sdr.totalCalls}</p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            <span className="text-primary">R1: {sdr.r1}</span>
            {" · "}
            <span className="font-semibold">R2: {sdr.r2}</span>
          </p>
        </div>
        <div className="bg-card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Qualificadas
          </p>
          <p className="text-lg font-semibold tabular-nums">{sdr.qualified}</p>
        </div>
        <div className="bg-card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Taxa Qualif.
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={cn("h-2.5 w-2.5 rounded-full", rateDot(sdr.qualificationRate, 50))} />
            <p className={cn("text-base font-semibold tabular-nums", rateColor(sdr.qualificationRate, 50))}>
              {sdr.qualificationRate.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="bg-card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Taxa Show
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={cn("h-2.5 w-2.5 rounded-full", rateDot(sdr.showRate, 75))} />
            <p className={cn("text-base font-semibold tabular-nums", rateColor(sdr.showRate, 75))}>
              {sdr.showRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Revenue bar */}
      <div className="bg-primary/5 px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Vendas Originadas
          </p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {sdr.contracts} contratos
          </p>
        </div>
        <p className="text-lg font-bold tabular-nums text-primary">
          {fmt(sdr.salesOriginated)}
        </p>
        <Progress value={Math.min(barWidth, 100)} className="h-1.5" />
      </div>
    </div>
  );
}

export function SDRComparisonCards({ sdrs, onSDRClick }: SDRComparisonCardsProps) {
  const rows = useMemo<SDRRow[]>(() => {
    return sdrs
      .map((s) => {
        const leads = s.kpis.find((k) => k.key === "leads")?.value ?? 0;
        const booked = s.kpis.find((k) => k.key === "booked")?.value ?? 0;
        const showRate = s.kpis.find((k) => k.key === "show_rate")?.value ?? 0;
        const totalCalls = s.callMetrics?.totalCalls ?? 0;
        const r1 = s.callMetrics?.r1Calls ?? 0;
        const r2 = s.callMetrics?.r2Calls ?? 0;
        const qualified = booked;
        const qualificationRate = leads > 0 ? (booked / leads) * 100 : 0;

        return {
          id: s.id,
          name: s.name,
          avatarUrl: s.avatarUrl,
          squad: s.squad,
          totalCalls,
          r1,
          r2,
          qualified,
          qualificationRate,
          showRate,
          salesOriginated: s.salesOriginated ?? 0,
          contracts: s.contractsOriginated ?? 0,
        };
      })
      .sort((a, b) => b.salesOriginated - a.salesOriginated);
  }, [sdrs]);

  const maxRevenue = Math.max(...rows.map((r) => r.salesOriginated), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Comparação de Performance
        </h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((sdr, i) => (
          <SDRCard
            key={sdr.id}
            sdr={sdr}
            rank={i}
            maxRevenue={maxRevenue}
            onClick={onSDRClick ? () => onSDRClick(sdr.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
