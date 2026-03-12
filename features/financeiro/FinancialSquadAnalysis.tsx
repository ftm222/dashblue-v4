"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useFinancialData } from "@/lib/queries";
import { usePeople } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";

const SQUAD_COLORS: Record<string, { border: string; text: string; badge: string }> = {
  Alpha: { border: "border-l-rose-500", text: "text-rose-400", badge: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  Beta: { border: "border-l-blue-500", text: "text-blue-400", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  Gamma: { border: "border-l-orange-500", text: "text-orange-400", badge: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
};

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

interface SquadFinancial {
  name: string;
  totalRevenue: number;
  paidRevenue: number;
  signedRevenue: number;
  gap: number;
  contracts: number;
  paidContracts: number;
  receiptRate: number;
}

export function FinancialSquadAnalysis() {
  const { data: financial, isLoading: loadingFinancial } = useFinancialData();
  const { period } = usePeriodFilter();
  const { data: sdrs, isLoading: loadingSDRs } = usePeople("sdr", period);
  const { data: closers, isLoading: loadingClosers } = usePeople("closer", period);

  if (loadingFinancial || loadingSDRs || loadingClosers || !financial) {
    return (
      <Card className="border-border/40">
        <CardHeader><Skeleton className="h-6 w-56" /></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </CardContent>
      </Card>
    );
  }

  const squadMap = new Map<string, SquadFinancial>();

  for (const c of financial.contracts) {
    const sq = c.squad ?? "Sem Squad";
    if (!squadMap.has(sq)) {
      squadMap.set(sq, {
        name: sq,
        totalRevenue: 0,
        paidRevenue: 0,
        signedRevenue: 0,
        gap: 0,
        contracts: 0,
        paidContracts: 0,
        receiptRate: 0,
      });
    }
    const entry = squadMap.get(sq)!;
    entry.totalRevenue += c.value;
    entry.contracts += 1;
    if (c.status === "signed_paid") {
      entry.paidRevenue += c.value;
      entry.signedRevenue += c.value;
      entry.paidContracts += 1;
    } else if (c.status === "signed_unpaid") {
      entry.signedRevenue += c.value;
    }
  }

  for (const s of squadMap.values()) {
    s.gap = s.totalRevenue - s.paidRevenue;
    s.receiptRate = s.totalRevenue > 0 ? (s.paidRevenue / s.totalRevenue) * 100 : 0;
  }

  const squads = Array.from(squadMap.values()).sort((a, b) => b.paidRevenue - a.paidRevenue);
  const leader = squads[0];

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Análise por Squad</CardTitle>
        <p className="text-xs text-muted-foreground">
          Receita, pagamentos e gaps por squad
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {squads.map((sq) => {
            const colors = SQUAD_COLORS[sq.name] ?? {
              border: "border-l-gray-500",
              text: "text-gray-400",
              badge: "bg-gray-500/10 text-gray-400 border-gray-500/20",
            };
            const isLeader = sq.name === leader?.name;

            return (
              <div
                key={sq.name}
                className={`rounded-xl border-l-4 ${colors.border} border border-border/40 bg-card p-4 transition-shadow hover:shadow-md`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${colors.text}`}>
                      Squad {sq.name}
                    </span>
                    {isLeader && (
                      <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-400">
                        <Trophy className="h-3 w-3" /> LÍDER
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {sq.contracts} contratos
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Receita Total</span>
                      <span className="text-sm font-semibold text-foreground">{fmtCurrency(sq.totalRevenue)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Receita Paga</span>
                      <span className="text-sm font-semibold text-green-400">{fmtCurrency(sq.paidRevenue)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress
                        value={sq.receiptRate}
                        className="h-1.5 flex-1 bg-muted/30"
                      />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {sq.receiptRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between rounded-lg bg-red-500/5 px-2 py-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Gap</span>
                    <span className="text-sm font-semibold text-red-400">{fmtCurrency(sq.gap)}</span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Taxa Recebimento</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        sq.receiptRate >= 70
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : sq.receiptRate >= 50
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                          : "border-red-500/20 bg-red-500/10 text-red-400"
                      }`}
                    >
                      {sq.receiptRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
