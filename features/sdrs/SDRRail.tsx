"use client";

import { MasterDetailRail } from "@/components/shared/MasterDetailRail";
import { usePeople } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";

interface SDRRailProps {
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function SDRRail({ selectedId, onSelect }: SDRRailProps) {
  const { period } = usePeriodFilter();
  const { data: people, isLoading } = usePeople("sdr", period);

  const items =
    people?.map((p) => {
      const booked = p.kpis.find((k) => k.key === "booked");
      return {
        id: p.id,
        name: p.name,
        avatarUrl: p.avatarUrl,
        subtitle: p.squad,
        value: booked?.value,
      };
    }) ?? [];

  return (
    <MasterDetailRail
      title="SDRs"
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
      searchable
      loading={isLoading}
    />
  );
}
