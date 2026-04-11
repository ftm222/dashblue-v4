"use client";

import { useState } from "react";
import {
  Brain,
  BarChart3,
  Megaphone,
  Headphones,
  Handshake,
  Users,
  DollarSign,
  FileSearch,
  RefreshCw,
} from "lucide-react";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useAIInsights } from "@/lib/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { InsightCard } from "@/features/ai-diagnosis/InsightCard";
import type { AIArea, AIInsight } from "@/types";

const AREA_TABS: { value: AIArea | "all"; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "Todos", icon: <Brain className="h-4 w-4" /> },
  { value: "overview", label: "Visão Geral", icon: <BarChart3 className="h-4 w-4" /> },
  { value: "marketing", label: "Marketing", icon: <Megaphone className="h-4 w-4" /> },
  { value: "sdrs", label: "SDRs", icon: <Headphones className="h-4 w-4" /> },
  { value: "closers", label: "Closers", icon: <Handshake className="h-4 w-4" /> },
  { value: "squads", label: "Squads", icon: <Users className="h-4 w-4" /> },
  { value: "financeiro", label: "Financeiro", icon: <DollarSign className="h-4 w-4" /> },
  { value: "evidence", label: "Evidências", icon: <FileSearch className="h-4 w-4" /> },
];

function InsightsGrid({ insights, showArea }: { insights: AIInsight[]; showArea: boolean }) {
  if (insights.length === 0) {
    return (
      <EmptyState
        title="Nenhum insight encontrado"
        description="Não há diagnósticos para esta área no período selecionado. Adicione mais dados ao sistema para obter análises detalhadas."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} showAreaBadge={showArea} />
      ))}
    </div>
  );
}

function SeveritySummary({ insights }: { insights: AIInsight[] }) {
  const counts = { critical: 0, high: 0, medium: 0, info: 0 };
  for (const i of insights) counts[i.severity]++;

  return (
    <div className="flex items-center gap-4 text-sm">
      {counts.critical > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="font-medium text-red-600 dark:text-red-400">{counts.critical} crítico(s)</span>
        </div>
      )}
      {counts.high > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          <span className="text-muted-foreground">{counts.high} alto(s)</span>
        </div>
      )}
      {counts.medium > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="text-muted-foreground">{counts.medium} médio(s)</span>
        </div>
      )}
      {counts.info > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          <span className="text-muted-foreground">{counts.info} info</span>
        </div>
      )}
    </div>
  );
}

export default function AIDiagnosisPage() {
  const { period } = usePeriodFilter();
  const { data: insights, isLoading, isError, refetch, isFetching } = useAIInsights(period);
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredInsights =
    activeTab === "all"
      ? (insights ?? [])
      : (insights ?? []).filter((i) => i.area === activeTab);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="rounded-lg bg-slate-50/80 dark:bg-slate-900/40 p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Diagnóstico AI</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Análise automatizada baseada em dados reais — 7 áreas do negócio
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <>
            {insights && insights.length > 0 && (
              <SeveritySummary insights={insights} />
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
                {AREA_TABS.map((tab) => {
                  const count =
                    tab.value === "all"
                      ? (insights ?? []).length
                      : (insights ?? []).filter((i) => i.area === tab.value).length;

                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-sm data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                      {count > 0 && (
                        <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                          {count}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {AREA_TABS.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-4">
                  <InsightsGrid
                    insights={filteredInsights}
                    showArea={tab.value === "all"}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}

        <p className="text-xs text-muted-foreground/70 text-center pt-2">
          Toda conclusão é baseada em dados reais. Clique em &quot;Ver evidências&quot; para validar.
        </p>
      </div>
    </div>
  );
}
