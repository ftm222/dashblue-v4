"use client";

import { useState, useEffect } from "react";
import { KPICard } from "@/components/shared/KPICard";
import { FunnelBlock } from "@/components/shared/FunnelBlock";
import { PersonGoalProgress } from "@/components/shared/PersonGoalProgress";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeople } from "@/lib/queries";
import { useFunnel } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useDrillDown } from "@/providers/DrillDownProvider";
import { SDR_GOAL_METRICS } from "@/lib/goal-metrics";
import type { IndividualGoalTargets } from "@/types";

function useGoalTargets(): IndividualGoalTargets {
  const [targets, setTargets] = useState<IndividualGoalTargets>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dashblue:individual-goals");
      if (raw) setTargets(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  return targets;
}

interface SDRDetailProps {
  personId: string;
}

export function SDRDetail({ personId }: SDRDetailProps) {
  const { period } = usePeriodFilter();
  const drillDown = useDrillDown();
  const allTargets = useGoalTargets();

  const {
    data: people,
    isLoading: peopleLoading,
    isError: peopleError,
    refetch: refetchPeople,
  } = usePeople("sdr", period);

  const {
    data: funnel,
    isLoading: funnelLoading,
    isError: funnelError,
    refetch: refetchFunnel,
  } = useFunnel(period, { personId });

  if (peopleError || funnelError) {
    return (
      <ErrorState
        onRetry={() => {
          if (peopleError) refetchPeople();
          if (funnelError) refetchFunnel();
        }}
      />
    );
  }

  if (peopleLoading || funnelLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const person = people?.find((p) => p.id === personId);

  if (!person) {
    return <EmptyState title="SDR não encontrado" />;
  }

  const kpis = person.kpis.slice(0, 6);
  const personTargets = allTargets[personId] ?? {};

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{person.name}</h2>
        {person.squad && (
          <p className="mt-0.5 text-xs text-muted-foreground">Squad {person.squad}</p>
        )}
      </div>

      <PersonGoalProgress
        kpis={person.kpis}
        goalConfigs={SDR_GOAL_METRICS}
        targets={personTargets}
      />

      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Indicadores
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {kpis.map((kpi) => (
            <KPICard
              key={kpi.key}
              kpi={kpi}
              onClick={() => drillDown.openCalc(kpi.label, kpi.key)}
            />
          ))}
        </div>
      </div>

      {funnel && funnel.length > 0 && (
        <FunnelBlock
          title="Funil do SDR"
          steps={funnel}
          onClick={(step) =>
            drillDown.openEvidence(step.label, {
              funnelStep: step.key,
              sdr: personId,
            })
          }
        />
      )}
    </div>
  );
}
