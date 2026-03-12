"use client";

import { Suspense, useState } from "react";
import { usePeople } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ErrorState } from "@/components/shared/ErrorState";
import { CloserOverviewKPIs } from "@/features/closers/CloserOverviewKPIs";
import { CloserPodium } from "@/features/closers/CloserPodium";
import { CloserCharts } from "@/features/closers/CloserCharts";
import { CloserCallMetrics } from "@/features/closers/CloserCallMetrics";
import { CloserComparisonTable } from "@/features/closers/CloserComparisonTable";
import { CloserGoalsGrid } from "@/features/closers/CloserGoalsGrid";
import { CloserAccordionList } from "@/features/closers/CloserAccordionList";
import { CloserDetail } from "@/features/closers/CloserDetail";

function ClosersContent() {
  const { period } = usePeriodFilter();
  const { data: closers, isLoading, isError, refetch } = usePeople("closer", period);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (isLoading || !closers) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Performance Closers</h1>
        <p className="text-sm text-muted-foreground/80">Análise detalhada da equipe de fechamento</p>
      </div>

      <CloserOverviewKPIs closers={closers} />

      <CloserPodium closers={closers} onCloserClick={(id) => setSelectedId(id)} />

      <CloserCharts closers={closers} />

      <CloserCallMetrics closers={closers} />

      <CloserComparisonTable
        closers={closers}
        onCloserClick={(id) => setSelectedId(id)}
      />

      <CloserGoalsGrid closers={closers} onCloserClick={(id) => setSelectedId(id)} />

      <CloserAccordionList closers={closers} />

      <Sheet open={!!selectedId} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
          {selectedId && <CloserDetail personId={selectedId} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function ClosersPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
          <Skeleton className="h-5 w-48" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      }
    >
      <ClosersContent />
    </Suspense>
  );
}
