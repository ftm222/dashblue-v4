"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Download, Table2 } from "lucide-react";
import { useEvidence } from "@/lib/queries";
import { useDrillDown } from "@/providers/DrillDownProvider";
import { EvidenceTable } from "@/components/shared/EvidenceTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { exportEvidenceCSV } from "@/lib/export-csv";
import { EvidenceFilters } from "./EvidenceFilters";

export function EvidencePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openCRM, copyContact } = useDrillDown();

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      f[key] = value;
    });
    return f;
  }, [searchParams]);

  function handleFiltersChange(next: Record<string, string>) {
    const params = new URLSearchParams(next);
    router.replace(`/evidence?${params.toString()}`);
  }

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEvidence(filters);

  const records = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  const total = data?.pages[0]?.pagination.total;

  const handleExportCSV = useCallback(() => {
    if (records.length > 0) {
      const timestamp = new Date().toISOString().slice(0, 10);
      exportEvidenceCSV(records, `evidencias-${timestamp}.csv`);
    }
  }, [records]);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <EvidenceFilters filters={filters} onChange={handleFiltersChange} />
        <div className="flex items-center gap-3">
          {total !== undefined && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {total} registros
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="h-9"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {!isLoading && records.length === 0 ? (
        <EmptyState
          icon={<Table2 className="h-10 w-10" />}
          title="Nenhuma evidência encontrada"
          description="Tente ajustar os filtros para encontrar resultados."
        />
      ) : (
        <EvidenceTable
          records={records}
          loading={isLoading}
          onOpenCRM={openCRM}
          onCopyContact={copyContact}
        />
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  );
}
