"use client";

import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { KPI } from "@/types";

interface KPICardProps {
  kpi: KPI;
  onClick?: () => void;
  loading?: boolean;
  className?: string;
  subtitle?: string;
}

function formatValue(value: number, format: KPI["format"]): string {
  switch (format) {
    case "currency":
      return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case "number":
      return value.toLocaleString("pt-BR");
    case "percent":
      return `${value.toFixed(1)}%`;
    case "ratio":
      return `${value.toFixed(2)}x`;
  }
}

function trendPercentage(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function KPICard({ kpi, onClick, loading, className, subtitle }: KPICardProps) {
  if (loading) {
    return (
      <div className={cn("rounded-xl border bg-card p-4 space-y-3", className)}>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  const change =
    kpi.previousValue !== undefined
      ? trendPercentage(kpi.value, kpi.previousValue)
      : null;

  const TrendIcon =
    kpi.trend === "up"
      ? ArrowUp
      : kpi.trend === "down"
        ? ArrowDown
        : ArrowRight;

  return (
    <div
      className={cn(
        "group rounded-xl border bg-card p-4 shadow-sm transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
        className,
      )}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 tv-mode:text-tv-sm">
        {kpi.label}
      </span>

      <p className="mt-1.5 text-xl font-semibold tracking-tight text-foreground tv-mode:text-tv-2xl">
        {formatValue(kpi.value, kpi.format)}
      </p>

      {subtitle && (
        <p className="mt-1 text-[11px] text-muted-foreground/70 leading-snug">
          {subtitle}
        </p>
      )}

      {change !== null && kpi.trend && kpi.trend !== "stable" && (
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-xs font-medium tv-mode:text-tv-sm",
            kpi.trendIsPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
          )}
        >
          <TrendIcon className="h-3 w-3" />
          <span className="tabular-nums">{Math.abs(change).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
