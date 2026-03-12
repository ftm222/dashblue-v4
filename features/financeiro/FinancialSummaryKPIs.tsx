"use client";

import {
  DollarSign,
  FileCheck,
  CreditCard,
  AlertTriangle,
  Clock,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useFinancialData } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

interface KPIItem {
  label: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  format: "currency" | "number";
}

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function FinancialSummaryKPIs() {
  const { data, isLoading } = useFinancialData();

  if (isLoading || !data) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Resumo Financeiro</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/40">
              <CardContent className="p-4">
                <Skeleton className="mb-3 h-9 w-9 rounded-lg" />
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="mb-1 h-7 w-28" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  const kpis: KPIItem[] = [
    {
      label: "Receita Total",
      value: data.totalRevenue,
      subtitle: `${data.totalContracts} contratos`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      format: "currency",
    },
    {
      label: "Receita Assinada",
      value: data.signedRevenue,
      subtitle: `${data.signedContracts} contratos assinados`,
      icon: FileCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      format: "currency",
    },
    {
      label: "Receita Paga",
      value: data.paidRevenue,
      subtitle: `${data.paidContracts} contratos pagos`,
      icon: CreditCard,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/40",
      format: "currency",
    },
    {
      label: "Gap Assinatura",
      value: data.signatureGap,
      subtitle: `${data.signatureGapContracts} contratos pendentes`,
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      format: "currency",
    },
    {
      label: "Gap Pagamento",
      value: data.paymentGap,
      subtitle: `${data.paymentGapContracts} assinados não pagos`,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/40",
      format: "currency",
    },
    {
      label: "Gap Total",
      value: data.totalGap,
      subtitle: `${((data.totalGap / data.totalRevenue) * 100).toFixed(1)}% da receita total`,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/40",
      format: "currency",
    },
  ];

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Resumo Financeiro</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="border-border/40 transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`h-4.5 w-4.5 ${kpi.color}`} />
                </div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {kpi.label}
                </p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                  {fmtCurrency(kpi.value)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/60 leading-snug">
                  {kpi.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
