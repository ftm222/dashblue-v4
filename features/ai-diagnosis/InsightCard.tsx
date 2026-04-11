"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useDrillDown } from "@/providers/DrillDownProvider";
import type { AIInsight } from "@/types";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";

const SEVERITY_CONFIG: Record<AIInsight["severity"], { dot: string; label: string }> = {
  critical: { dot: "bg-red-500", label: "Crítico" },
  high: { dot: "bg-orange-500", label: "Alto" },
  medium: { dot: "bg-yellow-400", label: "Médio" },
  info: { dot: "bg-blue-400", label: "Info" },
};

const AREA_BADGE: Record<string, { label: string; className: string }> = {
  overview: { label: "Visão Geral", className: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-transparent" },
  marketing: { label: "Marketing", className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-transparent" },
  sdrs: { label: "SDRs", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent" },
  closers: { label: "Closers", className: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-transparent" },
  squads: { label: "Squads", className: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-transparent" },
  financeiro: { label: "Financeiro", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent" },
  evidence: { label: "Evidências", className: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-transparent" },
};

function formatMetricValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}

interface InsightCardProps {
  insight: AIInsight;
  showAreaBadge?: boolean;
}

export function InsightCard({ insight, showAreaBadge = false }: InsightCardProps) {
  const { navigateToEvidence } = useDrillDown();
  const sev = SEVERITY_CONFIG[insight.severity];
  const area = AREA_BADGE[insight.area] ?? AREA_BADGE.overview;

  function handleEvidenceClick() {
    if (!insight.evidenceLink) return;
    const url = new URL(insight.evidenceLink, "http://localhost");
    const filters: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      filters[key] = value;
    });
    navigateToEvidence(filters);
  }

  const metricDelta = insight.metric
    ? insight.metric.value - insight.metric.benchmark
    : null;

  return (
    <Card className="relative overflow-hidden border-border/60 bg-slate-50/60 dark:bg-slate-900/40 transition-shadow hover:shadow-md">
      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${
          insight.severity === "critical"
            ? "bg-gradient-to-r from-red-500/80 via-red-400/40 to-transparent"
            : insight.severity === "high"
              ? "bg-gradient-to-r from-orange-500/80 via-orange-400/40 to-transparent"
              : "bg-gradient-to-r from-primary/40 via-primary/20 to-transparent"
        }`}
      />
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {showAreaBadge && <Badge className={area.className}>{area.label}</Badge>}
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${sev.dot}`} />
              <span className="text-[11px] text-muted-foreground">{sev.label}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold leading-snug">{insight.title}</h4>
          <p className="text-sm text-muted-foreground">{insight.description}</p>
        </div>

        {insight.metric && (
          <div className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2">
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                {insight.metric.label}
              </p>
              <p className="text-lg font-bold tabular-nums">
                {formatMetricValue(insight.metric.value)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                Ref.
              </p>
              <p className="text-sm font-medium text-muted-foreground tabular-nums">
                {formatMetricValue(insight.metric.benchmark)}
              </p>
            </div>
            {metricDelta !== null && metricDelta !== 0 && (
              <div className={`flex items-center gap-0.5 text-xs font-medium ${metricDelta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {metricDelta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              </div>
            )}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
            Ação recomendada
          </p>
          <p className="text-sm font-medium text-foreground/90">
            {insight.recommendation}
          </p>
        </div>

        {insight.evidenceLink && (
          <button
            onClick={handleEvidenceClick}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Ver evidências <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}
