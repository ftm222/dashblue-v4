"use client";

import { useState, useEffect } from "react";
import { KPICard } from "@/components/shared/KPICard";
import { PersonGoalProgress } from "@/components/shared/PersonGoalProgress";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { usePeople, useFunnel } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useDrillDown } from "@/providers/DrillDownProvider";
import { PipelineStepper } from "./PipelineStepper";
import { CLOSER_GOAL_METRICS } from "@/lib/goal-metrics";
import type { KPIKey, IndividualGoalTargets } from "@/types";

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

interface CloserDetailProps {
  personId: string;
}

const CLOSER_KPI_KEYS: KPIKey[] = [
  "received",
  "won",
  "revenue",
  "ticket",
  "conversion_rate",
  "cac",
];

const PIPELINE_STEPS: { key: string; label: string }[] = [
  { key: "received", label: "Recebido" },
  { key: "negotiation", label: "Em negociação" },
  { key: "proposal", label: "Proposta" },
  { key: "closed", label: "Fechado" },
];

export function CloserDetail({ personId }: CloserDetailProps) {
  const { period } = usePeriodFilter();
  const drillDown = useDrillDown();
  const allTargets = useGoalTargets();

  const {
    data: people,
    isLoading: peopleLoading,
    isError: peopleError,
    refetch: refetchPeople,
  } = usePeople("closer", period);

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
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  const person = people?.find((p) => p.id === personId);

  if (!person) {
    return <EmptyState title="Closer não encontrado" />;
  }

  const kpis = person.kpis.filter((k) => CLOSER_KPI_KEYS.includes(k.key));
  const personTargets = allTargets[personId] ?? {};

  const pipelineSteps = PIPELINE_STEPS.map((ps) => {
    const funnelStep = funnel?.find((f) => f.key === ps.key);
    return { ...ps, count: funnelStep?.count ?? 0 };
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{person.name}</h2>
          <div className="flex gap-1.5">
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-medium hover:bg-emerald-500/15">
              assinado
            </Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-medium hover:bg-primary/15">
              pago
            </Badge>
          </div>
        </div>
        {person.squad && (
          <p className="mt-0.5 text-xs text-muted-foreground">Squad {person.squad}</p>
        )}
      </div>

      <PersonGoalProgress
        kpis={person.kpis}
        goalConfigs={CLOSER_GOAL_METRICS}
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

      <div className="rounded-xl border bg-card p-5">
        <div className="mb-5 flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pipeline
          </h3>
        </div>
        <PipelineStepper
          steps={pipelineSteps}
          onStepClick={(step) =>
            drillDown.openEvidence(step.label, {
              funnelStep: step.key,
              closer: personId,
            })
          }
        />
      </div>
    </div>
  );
}
