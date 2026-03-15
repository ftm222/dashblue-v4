"use client";

import { Suspense, lazy } from "react";
import { DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const FinancialSummaryKPIs = lazy(() =>
  import("@/features/financeiro/FinancialSummaryKPIs").then((m) => ({
    default: m.FinancialSummaryKPIs,
  }))
);

const FinancialFunnel = lazy(() =>
  import("@/features/financeiro/FinancialFunnel").then((m) => ({
    default: m.FinancialFunnel,
  }))
);

const FinancialSquadAnalysis = lazy(() =>
  import("@/features/financeiro/FinancialSquadAnalysis").then((m) => ({
    default: m.FinancialSquadAnalysis,
  }))
);

const FinancialCollaborators = lazy(() =>
  import("@/features/financeiro/FinancialCollaborators").then((m) => ({
    default: m.FinancialCollaborators,
  }))
);

const FinancialContractsTable = lazy(() =>
  import("@/features/financeiro/FinancialContractsTable").then((m) => ({
    default: m.FinancialContractsTable,
  }))
);

const FinancialCharts = lazy(() =>
  import("@/features/financeiro/FinancialCharts").then((m) => ({
    default: m.FinancialCharts,
  }))
);

function SectionSkeleton({ cols = 6, h = 32 }: { cols?: number; h?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${cols === 6 ? "xl:grid-cols-6" : ""}`}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={`h-${h} rounded-xl`} />
        ))}
      </div>
    </div>
  );
}

export default function FinanceiroPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
          <DollarSign className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Financeiro
          </h1>
          <p className="text-sm text-muted-foreground">
            Controle de receitas, assinaturas, pagamentos e gaps financeiros
          </p>
        </div>
      </header>

      <Suspense fallback={<SectionSkeleton />}>
        <FinancialSummaryKPIs />
      </Suspense>

      <Suspense fallback={<SectionSkeleton cols={1} h={48} />}>
        <FinancialFunnel />
      </Suspense>

      <Suspense fallback={<SectionSkeleton cols={3} h={48} />}>
        <FinancialSquadAnalysis />
      </Suspense>

      <Suspense fallback={<SectionSkeleton cols={2} h={56} />}>
        <FinancialCollaborators />
      </Suspense>

      <Suspense fallback={<SectionSkeleton cols={1} h={64} />}>
        <FinancialContractsTable />
      </Suspense>

      <Suspense fallback={<SectionSkeleton cols={3} h={64} />}>
        <FinancialCharts />
      </Suspense>
    </div>
  );
}
