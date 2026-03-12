"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Person } from "@/types";

interface CloserComparisonTableProps {
  closers: Person[];
  onCloserClick?: (personId: string) => void;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function fmt(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface CloserRow {
  id: string;
  name: string;
  avatarUrl?: string;
  squad?: string;
  calls: number;
  qualified: number;
  received: number;
  won: number;
  revenue: number;
  ticket: number;
  conversionRate: number;
  signRate: number;
}

export function CloserComparisonTable({ closers, onCloserClick }: CloserComparisonTableProps) {
  const rows = useMemo<CloserRow[]>(() => {
    return closers
      .map((c) => {
        const received = c.kpis.find((k) => k.key === "received")?.value ?? 0;
        const won = c.kpis.find((k) => k.key === "won")?.value ?? 0;
        const revenue = c.kpis.find((k) => k.key === "revenue")?.value ?? 0;
        const ticket = c.kpis.find((k) => k.key === "ticket")?.value ?? 0;
        const conversionRate = c.kpis.find((k) => k.key === "conversion_rate")?.value ?? 0;
        const calls = c.callMetrics?.totalCalls ?? 0;
        const qualified = c.callMetrics ? Math.round(c.callMetrics.answeredCalls * 0.55) : 0;
        const signRate = won > 0 ? 100 : 0;

        return {
          id: c.id,
          name: c.name,
          avatarUrl: c.avatarUrl,
          squad: c.squad,
          calls,
          qualified,
          received,
          won,
          revenue,
          ticket,
          conversionRate,
          signRate,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [closers]);

  const maxRevenue = Math.max(...rows.map((r) => r.revenue), 1);

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Comparação de Performance
          </h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Closer
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Calls
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Qualif.
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Contratos
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Taxa Conv.
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ticket Médio
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Taxa Assin.
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Receita
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[100px]">
                Progresso
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const barWidth = (row.revenue / maxRevenue) * 100;
              const isTop = i === 0;

              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border/50 transition-colors",
                    onCloserClick && "cursor-pointer hover:bg-muted/30",
                    isTop && "bg-amber-500/[0.03]",
                  )}
                  onClick={() => onCloserClick?.(row.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold tabular-nums",
                        i === 0 && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                        i === 1 && "bg-slate-400/15 text-slate-500 dark:text-slate-400",
                        i === 2 && "bg-orange-500/15 text-orange-600 dark:text-orange-400",
                        i > 2 && "text-muted-foreground/50",
                      )}>
                        {i + 1}
                      </span>
                      <Avatar className="h-7 w-7 rounded-lg">
                        <AvatarImage src={row.avatarUrl} alt={row.name} />
                        <AvatarFallback className="rounded-lg text-[9px] font-medium bg-muted">
                          {initials(row.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{row.name}</p>
                        {row.squad && (
                          <Badge variant="outline" className="mt-0.5 text-[9px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-border">
                            {row.squad}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-sm tabular-nums text-muted-foreground">
                    {row.calls}
                  </td>
                  <td className="px-3 py-3 text-right text-sm tabular-nums text-muted-foreground">
                    {row.qualified}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-medium tabular-nums">
                    {row.won}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={cn(
                      "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
                      row.conversionRate >= 20
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : row.conversionRate >= 10
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-red-500/10 text-red-500 dark:text-red-400",
                    )}>
                      {row.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-sm tabular-nums text-muted-foreground">
                    {fmt(row.ticket)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={cn(
                      "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
                      row.signRate >= 80
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    )}>
                      {row.signRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums">
                    {fmt(row.revenue)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isTop
                            ? "bg-amber-500 dark:bg-amber-400"
                            : "bg-primary/60",
                        )}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
