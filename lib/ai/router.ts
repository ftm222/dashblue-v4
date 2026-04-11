import type { AIArea, AIInsight, PeriodRange } from "@/types";
import { analyzeOverview } from "./overview-insights";
import { analyzeMarketing } from "./marketing-optimizer";
import { analyzeSDRs } from "./sdr-coach";
import { analyzeClosers } from "./closer-analyzer";
import { analyzeSquads } from "./squad-comparator";
import { analyzeFinanceiro } from "./revenue-forecast";
import { analyzeEvidence } from "./evidence-classifier";

type AreaAnalyzer = (period: PeriodRange) => Promise<AIInsight[]>;

const ANALYZERS: Record<AIArea, AreaAnalyzer> = {
  overview: analyzeOverview,
  marketing: analyzeMarketing,
  sdrs: analyzeSDRs,
  closers: analyzeClosers,
  squads: analyzeSquads,
  financeiro: analyzeFinanceiro,
  evidence: analyzeEvidence,
};

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  info: 3,
};

export async function fetchAllInsights(
  period: PeriodRange,
  areas?: AIArea[],
): Promise<AIInsight[]> {
  const targetAreas = areas ?? (Object.keys(ANALYZERS) as AIArea[]);

  const results = await Promise.allSettled(
    targetAreas.map((area) => ANALYZERS[area](period)),
  );

  const insights: AIInsight[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      insights.push(...result.value);
    }
  }

  insights.sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9),
  );

  return insights;
}

export async function fetchInsightsByArea(
  period: PeriodRange,
  area: AIArea,
): Promise<AIInsight[]> {
  const analyzer = ANALYZERS[area];
  if (!analyzer) return [];
  return analyzer(period);
}
