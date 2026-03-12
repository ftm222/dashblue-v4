"use client";

import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useDiagnostics } from "@/lib/queries";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { DiagnosticCardComponent } from "./DiagnosticCardComponent";

export function DiagnosticsList() {
  const { period } = usePeriodFilter();
  const { data, isLoading, isError, refetch } = useDiagnostics(period);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Nenhum diagnóstico encontrado"
        description="Não há diagnósticos para o período selecionado."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {data.map((card) => (
        <DiagnosticCardComponent key={card.id} card={card} />
      ))}
    </div>
  );
}
