"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useDrillDown } from "@/providers/DrillDownProvider";
import type { DiagnosticCard } from "@/types";

const DOMAIN_STYLES: Record<DiagnosticCard["domain"], { label: string; className: string }> = {
  marketing: { label: "Marketing", className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-transparent" },
  sdrs: { label: "SDRs", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent" },
  closers: { label: "Closers", className: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-transparent" },
  funnel: { label: "Funil", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent" },
};

const SEVERITY_COLORS: Record<DiagnosticCard["severity"], string> = {
  low: "bg-gray-400",
  medium: "bg-yellow-400",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

interface DiagnosticCardComponentProps {
  card: DiagnosticCard;
}

export function DiagnosticCardComponent({ card }: DiagnosticCardComponentProps) {
  const { navigateToEvidence } = useDrillDown();
  const domain = DOMAIN_STYLES[card.domain];
  const severityColor = SEVERITY_COLORS[card.severity];

  function handleEvidenceClick() {
    const url = new URL(card.evidenceLink, "http://localhost");
    const filters: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      filters[key] = value;
    });
    navigateToEvidence(filters);
  }

  return (
    <Card className="relative overflow-hidden border-border/60 bg-slate-50/60 dark:bg-slate-900/40">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge className={domain.className}>{domain.label}</Badge>
          <div className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${severityColor}`} />
            <span className="text-[11px] capitalize text-muted-foreground">{card.severity}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Gargalo</p>
            <p className="text-sm font-medium">{card.bottleneck}</p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Impacto</p>
            <p className="text-sm text-muted-foreground">{card.impact}</p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Ação recomendada</p>
            <p className="text-sm font-medium text-foreground/90">{card.recommendation}</p>
          </div>
        </div>

        <button
          onClick={handleEvidenceClick}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Ver evidências →
        </button>
      </CardContent>
    </Card>
  );
}
