"use client";

import { OverviewGoalStatus } from "@/features/overview/OverviewGoalStatus";
import { OverviewKPIGrid } from "@/features/overview/OverviewKPIGrid";
import { OverviewVerticalFunnel } from "@/features/overview/OverviewVerticalFunnel";
import { OverviewRankings } from "@/features/overview/OverviewRankings";
import { OverviewSquadWar } from "@/features/overview/OverviewSquadWar";

export default function OverviewPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Visão Geral</h1>
        <p className="text-sm text-muted-foreground/80">Resumo executivo do período</p>
      </div>
      <OverviewGoalStatus />
      <OverviewKPIGrid />
      <OverviewVerticalFunnel />
      <OverviewSquadWar />
      <OverviewRankings />
    </div>
  );
}
