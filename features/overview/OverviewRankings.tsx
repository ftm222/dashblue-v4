"use client";

import Link from "next/link";
import { RankingBlock } from "@/components/shared/RankingBlock";
import { ErrorState } from "@/components/shared/ErrorState";
import { usePeople } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useDrillDown } from "@/providers/DrillDownProvider";
import type { Person } from "@/types";

function toRankingItems(people: Person[], kpiKey: string) {
  return people.map((p) => {
    const kpi = p.kpis.find((k) => k.key === kpiKey);
    return {
      id: p.id,
      name: p.name,
      avatarUrl: p.avatarUrl,
      value: kpi?.value ?? 0,
      format: kpi?.format === "currency" ? ("currency" as const) : ("number" as const),
    };
  });
}

function groupBySquad(people: Person[]) {
  const squads = new Map<string, number>();
  for (const p of people) {
    const squad = p.squad ?? "Sem squad";
    const rev = p.kpis.find((k) => k.key === "revenue")?.value ?? 0;
    squads.set(squad, (squads.get(squad) ?? 0) + rev);
  }
  return Array.from(squads.entries())
    .map(([name, value]) => ({
      id: name,
      name,
      value,
      format: "currency" as const,
    }))
    .sort((a, b) => b.value - a.value);
}

export function OverviewRankings() {
  const { period } = usePeriodFilter();
  const drillDown = useDrillDown();

  const sdrs = usePeople("sdr", period);
  const closers = usePeople("closer", period);

  const hasError = sdrs.isError || closers.isError;
  const isLoading = sdrs.isLoading || closers.isLoading;

  if (hasError) {
    return (
      <ErrorState
        onRetry={() => {
          sdrs.refetch();
          closers.refetch();
        }}
      />
    );
  }

  const sdrItems = toRankingItems(sdrs.data ?? [], "booked");
  const closerItems = toRankingItems(closers.data ?? [], "revenue");
  const squadItems = groupBySquad(closers.data ?? []);

  const handleItemClick = (id: string) => {
    drillDown.openEvidence(id, { personId: id });
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-3">
        <RankingBlock
          title="SDR — Agendados"
          items={sdrItems}
          onItemClick={handleItemClick}
          loading={isLoading}
        />
        <Link
          href="/sdrs"
          className="inline-flex items-center gap-1 px-1 text-xs font-medium text-primary/80 hover:text-primary transition-colors"
        >
          Ver todos
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="space-y-3">
        <RankingBlock
          title="Closer — Receita"
          items={closerItems}
          onItemClick={handleItemClick}
          loading={isLoading}
        />
        <Link
          href="/closers"
          className="inline-flex items-center gap-1 px-1 text-xs font-medium text-primary/80 hover:text-primary transition-colors"
        >
          Ver todos
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div>
        <RankingBlock
          title="Squad — Receita"
          items={squadItems}
          onItemClick={handleItemClick}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
