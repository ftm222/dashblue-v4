"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Person } from "@/types";

interface SDRDetailListProps {
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
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SQUAD_COLORS: Record<string, string> = {
  Alpha: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Beta: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20",
  Gamma: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

interface SDRSummary {
  id: string;
  name: string;
  avatarUrl?: string;
  squad?: string;
  salesOriginated: number;
  contracts: number;
}

export function SDRDetailList({ sdrs, onSDRClick }: SDRDetailListProps) {
  const list = useMemo<SDRSummary[]>(() => {
    return sdrs
      .map((s) => ({
        id: s.id,
        name: s.name,
        avatarUrl: s.avatarUrl,
        squad: s.squad,
        salesOriginated: s.salesOriginated ?? 0,
        contracts: s.contractsOriginated ?? 0,
      }))
      .sort((a, b) => b.salesOriginated - a.salesOriginated);
  }, [sdrs]);

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Detalhamento Individual
          </h3>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {list.map((sdr, i) => {
          const borderColor = i === 0
            ? "border-l-amber-500"
            : i === 1
              ? "border-l-slate-400"
              : i === 2
                ? "border-l-orange-500"
                : "border-l-transparent";

          return (
            <div
              key={sdr.id}
              className={cn(
                "flex items-center gap-4 px-5 py-4 border-l-[3px] transition-colors",
                borderColor,
                onSDRClick && "cursor-pointer hover:bg-muted/20",
              )}
              onClick={() => onSDRClick?.(sdr.id)}
            >
              <Avatar className="h-11 w-11 rounded-full shrink-0 ring-1 ring-border/60">
                <AvatarImage src={sdr.avatarUrl} alt={sdr.name} />
                <AvatarFallback className="rounded-full text-xs font-medium bg-muted">
                  {initials(sdr.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">{sdr.name}</span>
                  {sdr.squad && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] h-4 px-1.5 font-medium",
                        SQUAD_COLORS[sdr.squad] ?? "text-muted-foreground",
                      )}
                    >
                      {sdr.squad}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Vendas Originadas
                </p>
                <p className="text-base font-bold tabular-nums text-foreground">
                  {fmt(sdr.salesOriginated)}
                </p>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {sdr.contracts} contratos
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
