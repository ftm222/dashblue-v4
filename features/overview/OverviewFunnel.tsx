"use client";

import { FunnelBlock } from "@/components/shared/FunnelBlock";
import { ErrorState } from "@/components/shared/ErrorState";
import { useFunnel } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useDrillDown } from "@/providers/DrillDownProvider";

export function OverviewFunnel() {
  const { period } = usePeriodFilter();
  const drillDown = useDrillDown();
  const { data: steps, isLoading, isError, refetch } = useFunnel(period);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <FunnelBlock
      title="Funil Executivo"
      steps={steps ?? []}
      loading={isLoading}
      vertical
      onClick={(step) =>
        drillDown.openEvidence(step.label, { funnelStep: step.key })
      }
    />
  );
}
