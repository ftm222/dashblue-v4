"use client";

import { MasterDetailRail } from "@/components/shared/MasterDetailRail";
import { usePeople } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";

interface CloserRailProps {
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function CloserRail({ selectedId, onSelect }: CloserRailProps) {
  const { period } = usePeriodFilter();
  const { data: people, isLoading } = usePeople("closer", period);

  const items =
    people?.map((p) => {
      const revenue = p.kpis.find((k) => k.key === "revenue");
      return {
        id: p.id,
        name: p.name,
        avatarUrl: p.avatarUrl,
        value: revenue?.value,
        valueFormat: "currency" as const,
      };
    }) ?? [];

  return (
    <MasterDetailRail
      title="Closers"
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
      loading={isLoading}
    />
  );
}
