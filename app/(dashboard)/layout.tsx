"use client";

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTVMode } from "@/providers/TVModeProvider";
import { useDrillDown } from "@/providers/DrillDownProvider";
import { useDataFreshness } from "@/providers/DataFreshnessProvider";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useAlerts, prefetchDashboardData } from "@/lib/queries";
import { SidebarNav } from "@/components/shared/SidebarNav";
import { Topbar } from "@/components/shared/Topbar";
import { TVHeader } from "@/components/shared/TVHeader";
import type { Alert } from "@/types";

const EvidenceDrawer = lazy(() =>
  import("@/components/shared/EvidenceDrawer").then((m) => ({ default: m.EvidenceDrawer }))
);
const CalcDrawer = lazy(() =>
  import("@/components/shared/CalcDrawer").then((m) => ({ default: m.CalcDrawer }))
);

function QuerySyncBridge() {
  const queryClient = useQueryClient();
  const { recordSync } = useDataFreshness();

  useEffect(() => {
    const cache = queryClient.getQueryCache();
    const unsubscribe = cache.subscribe((event) => {
      if (event.type === "updated" && event.action?.type === "success") {
        recordSync();
      }
    });
    return unsubscribe;
  }, [queryClient, recordSync]);

  return null;
}

function PrefetchBridge() {
  const qc = useQueryClient();
  const { period } = usePeriodFilter();

  useEffect(() => {
    prefetchDashboardData(qc, period);
  }, [qc, period]);

  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { enabled: tvMode } = useTVMode();
  const drillDown = useDrillDown();
  const freshness = useDataFreshness();
  const { data: businessAlerts } = useAlerts();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];

    if (freshness.status === "critical") {
      result.push({
        id: "freshness-critical",
        type: "critical",
        message: `Dados desatualizados há mais de ${Math.floor(freshness.secondsSinceSync / 60)} minutos. Verifique a sincronização.`,
        dismissible: false,
      });
    } else if (freshness.status === "warning") {
      result.push({
        id: "freshness-warning",
        type: "warning",
        message: `Última sincronização há ${freshness.secondsSinceSync}s. Os dados podem estar levemente desatualizados.`,
        dismissible: true,
      });
    }

    if (businessAlerts) {
      result.push(...businessAlerts);
    }

    return result.filter((a) => !dismissed.has(a.id));
  }, [freshness.status, freshness.secondsSinceSync, businessAlerts, dismissed]);

  function handleDismissAlert(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  const showEvidence = drillDown.isOpen && drillDown.type === "evidence";
  const showCalc = drillDown.isOpen && drillDown.type === "calc";

  if (tvMode) {
    return (
      <div className="flex h-screen flex-col">
        <QuerySyncBridge />
        <PrefetchBridge />
        <TVHeader />
        <main className="flex-1 overflow-auto">{children}</main>

        {showEvidence && (
          <Suspense fallback={null}>
            <EvidenceDrawer
              open
              onClose={drillDown.close}
              title={drillDown.title}
              filters={drillDown.filters}
              onOpenAsPage={() => drillDown.navigateToEvidence(drillDown.filters)}
            />
          </Suspense>
        )}
        {showCalc && (
          <Suspense fallback={null}>
            <CalcDrawer
              open
              onClose={drillDown.close}
              title={drillDown.title}
              kpiKey={drillDown.filters.kpiKey ?? ""}
            />
          </Suspense>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <QuerySyncBridge />
      <PrefetchBridge />
      <SidebarNav />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar alerts={alerts} onDismissAlert={handleDismissAlert} />
        <main className="flex-1 overflow-auto">
          {children}
          <footer className="border-t border-border/40 px-6 py-4 text-center">
            <p className="text-[11px] text-muted-foreground/50">
              Todos os direitos reservados por <span className="font-medium text-muted-foreground/70">Dashblue</span>
            </p>
          </footer>
        </main>
      </div>

      {showEvidence && (
        <Suspense fallback={null}>
          <EvidenceDrawer
            open
            onClose={drillDown.close}
            title={drillDown.title}
            filters={drillDown.filters}
            onOpenAsPage={() => drillDown.navigateToEvidence(drillDown.filters)}
          />
        </Suspense>
      )}
      {showCalc && (
        <Suspense fallback={null}>
          <CalcDrawer
            open
            onClose={drillDown.close}
            title={drillDown.title}
            kpiKey={drillDown.filters.kpiKey ?? ""}
          />
        </Suspense>
      )}
    </div>
  );
}
