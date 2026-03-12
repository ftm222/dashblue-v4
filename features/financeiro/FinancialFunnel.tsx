"use client";

import { ArrowRight, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinancialData } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

interface FunnelStepData {
  label: string;
  value: number;
  count: number;
  color: string;
  bgColor: string;
}

function GapArrow({ gap, label }: { gap: number; label: string }) {
  const isPositive = gap > 0;
  return (
    <div className="flex flex-col items-center gap-1 px-2">
      <ArrowRight className="hidden h-5 w-5 text-muted-foreground/50 md:block" />
      <ArrowDown className="block h-5 w-5 text-muted-foreground/50 md:hidden" />
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
          {label}
        </p>
        <p className={`text-xs font-semibold ${isPositive ? "text-amber-500" : "text-emerald-500"}`}>
          {isPositive ? `-${fmtCurrency(gap)}` : "R$ 0"}
        </p>
      </div>
    </div>
  );
}

export function FinancialFunnel() {
  const { data, isLoading } = useFinancialData();

  if (isLoading || !data) {
    return (
      <Card className="border-border/40">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  const steps: FunnelStepData[] = [
    {
      label: "Receita Total",
      value: data.totalRevenue,
      count: data.totalContracts,
      color: "text-blue-400",
      bgColor: "from-blue-600/20 to-blue-500/5 border-blue-500/30",
    },
    {
      label: "Receita Assinada",
      value: data.signedRevenue,
      count: data.signedContracts,
      color: "text-emerald-400",
      bgColor: "from-emerald-600/20 to-emerald-500/5 border-emerald-500/30",
    },
    {
      label: "Receita Paga",
      value: data.paidRevenue,
      count: data.paidContracts,
      color: "text-green-400",
      bgColor: "from-green-600/20 to-green-500/5 border-green-500/30",
    },
  ];

  const signatureGap = data.signatureGap;
  const paymentGap = data.paymentGap;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Funil Financeiro</CardTitle>
        <p className="text-xs text-muted-foreground">
          Fluxo de receita: Total → Assinada → Paga, com gaps entre etapas
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-3 md:flex-row md:items-stretch md:justify-between">
          {steps.map((step, idx) => {
            const widthPct = data.totalRevenue > 0
              ? Math.max(40, (step.value / data.totalRevenue) * 100)
              : 100;

            return (
              <div key={step.label} className="flex flex-col items-center gap-3 md:flex-row md:flex-1">
                <div
                  className={`relative w-full rounded-xl border bg-gradient-to-b p-4 transition-shadow hover:shadow-md ${step.bgColor}`}
                  style={{ minHeight: "120px" }}
                >
                  <div className="absolute right-3 top-3 rounded-full bg-background/20 px-2 py-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {data.totalRevenue > 0
                        ? `${((step.value / data.totalRevenue) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>

                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {step.label}
                  </p>
                  <p className={`mt-2 text-2xl font-bold tracking-tight ${step.color}`}>
                    {fmtCurrency(step.value)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    {step.count} contratos
                  </p>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
                    <div
                      className={`h-full rounded-full bg-current ${step.color} opacity-40`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>

                {idx === 0 && <GapArrow gap={signatureGap} label="Gap Assinatura" />}
                {idx === 1 && <GapArrow gap={paymentGap} label="Gap Pagamento" />}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">Gap Total:</span>
          <span className="text-sm font-bold text-red-400">{fmtCurrency(data.totalGap)}</span>
          <span className="text-[10px] text-muted-foreground/60">
            ({data.totalRevenue > 0 ? ((data.totalGap / data.totalRevenue) * 100).toFixed(1) : "0"}% de perda)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
