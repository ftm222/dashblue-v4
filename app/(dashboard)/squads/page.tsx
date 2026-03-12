"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { usePeople } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { groupBySquad } from "@/lib/squad-utils";
import { SquadPodium } from "@/features/squads/SquadPodium";
import { SquadGoalProgress } from "@/features/squads/SquadGoalProgress";
import { SquadMetricsComparison } from "@/features/squads/SquadMetricsComparison";
import { SquadMemberPerformance } from "@/features/squads/SquadMemberPerformance";
import { SquadProjections } from "@/features/squads/SquadProjections";
import { SquadComparativeAnalysis } from "@/features/squads/SquadComparativeAnalysis";

export default function SquadsPage() {
  const { period } = usePeriodFilter();
  const sdrs = usePeople("sdr", period);
  const closers = usePeople("closer", period);

  const isLoading = sdrs.isLoading || closers.isLoading;
  const hasError = sdrs.isError || closers.isError;

  const squads = useMemo(
    () => groupBySquad(sdrs.data ?? [], closers.data ?? []),
    [sdrs.data, closers.data],
  );

  if (hasError) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <ErrorState
          onRetry={() => {
            sdrs.refetch();
            closers.refetch();
          }}
        />
      </div>
    );
  }

  const squadNames = squads.map((s) => s.name).join(" vs ");

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Guerra de Squads</h1>
        {!isLoading && squads.length > 0 && (
          <p className="text-sm text-muted-foreground/80">{squadNames}</p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-5">
          <Skeleton className="h-8 w-52" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : (
        <>
          <SquadPodium squads={squads} />
          <SquadGoalProgress squads={squads} />
          <SquadMetricsComparison squads={squads} />
          <SquadMemberPerformance squads={squads} />
          <SquadProjections squads={squads} />
          <SquadComparativeAnalysis squads={squads} />
        </>
      )}
    </div>
  );
}
