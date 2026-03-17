"use client";

import { Suspense, useState } from "react";
import { usePeople } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { SDROverviewKPIs } from "@/features/sdrs/SDROverviewKPIs";
import { SDRPodium } from "@/features/sdrs/SDRPodium";
import { SDRComparisonCards } from "@/features/sdrs/SDRComparisonCards";
import { SDRDetailList } from "@/features/sdrs/SDRDetailList";
import { SDRCharts } from "@/features/sdrs/SDRCharts";
import { SDRDetail } from "@/features/sdrs/SDRDetail";

function SDRsContent() {
  const { period } = usePeriodFilter();
  const { data: sdrs, isLoading, isError, refetch } = usePeople("sdr", period);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (isLoading || !sdrs) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (sdrs.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Performance SDR</h1>
          <p className="text-sm text-muted-foreground/80">Análise detalhada da equipe de prospecção</p>
        </div>
        <EmptyState
          title="Nenhum SDR cadastrado"
          description="Cadastre SDRs em Admin > Equipe para visualizar métricas de prospecção."
          action={{ label: "Cadastrar SDRs", onClick: () => window.location.href = "/admin/collaborators?tab=equipe" }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Performance SDR</h1>
        <p className="text-sm text-muted-foreground/80">
          Análise detalhada da equipe de prospecção
        </p>
      </div>

      <SDROverviewKPIs sdrs={sdrs} />

      <SDRPodium sdrs={sdrs} onSDRClick={(id) => setSelectedId(id)} />

      <SDRComparisonCards sdrs={sdrs} onSDRClick={(id) => setSelectedId(id)} />

      <SDRDetailList sdrs={sdrs} onSDRClick={(id) => setSelectedId(id)} />

      <SDRCharts sdrs={sdrs} />

      <Sheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
          {selectedId && <SDRDetail personId={selectedId} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function SDRsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
          <Skeleton className="h-5 w-48" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      }
    >
      <SDRsContent />
    </Suspense>
  );
}
