import type { AIInsight, PeriodRange } from "@/types";
import { db } from "@/lib/supabase";

function isoDate(d: Date): string {
  return d.toISOString();
}

function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

export async function analyzeEvidence(period: PeriodRange): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  let id = 0;

  const { data } = await db
    .from("evidence")
    .select("id, funnel_step, value, tags, sdr_id, closer_id, utm_source, utm_campaign, created_at")
    .gte("created_at", isoDate(period.from))
    .lte("created_at", isoDate(period.to));

  const rows = (data ?? []) as {
    id: string;
    funnel_step: string;
    value?: number;
    tags?: string[];
    sdr_id?: string | null;
    closer_id?: string | null;
    utm_source?: string | null;
    utm_campaign?: string | null;
    created_at: string;
  }[];

  if (rows.length === 0) return [];

  // Evidence quality: missing UTM, missing responsible, missing value on "won"
  const wonWithoutValue = rows.filter((r) => r.funnel_step === "won" && (!r.value || r.value === 0));
  if (wonWithoutValue.length > 0) {
    insights.push({
      id: `ev-${++id}`,
      area: "evidence",
      severity: "high",
      title: `${wonWithoutValue.length} venda(s) sem valor registrado`,
      description: "Evidências marcadas como 'won' mas sem valor financeiro. Isso impacta o cálculo de receita e ticket médio.",
      recommendation: "Atualize essas evidências com o valor real do contrato para manter os KPIs corretos.",
      evidenceLink: "/evidence?funnelStep=won",
    });
  }

  const noUTM = rows.filter((r) => !r.utm_source && !r.utm_campaign);
  const noUTMPct = safeDiv(noUTM.length, rows.length) * 100;
  if (noUTM.length > 0 && noUTMPct > 30) {
    insights.push({
      id: `ev-${++id}`,
      area: "evidence",
      severity: noUTMPct > 60 ? "high" : "medium",
      title: `${noUTMPct.toFixed(0)}% das evidências sem rastreamento UTM`,
      description: `${noUTM.length} de ${rows.length} evidências não possuem utm_source ou utm_campaign.`,
      recommendation: "Configure UTMs em todas as origens de leads para rastrear corretamente a atribuição de marketing.",
      metric: { label: "Sem UTM", value: noUTM.length, benchmark: 0 },
      evidenceLink: "/evidence",
    });
  }

  const noResponsible = rows.filter((r) => !r.sdr_id && !r.closer_id);
  const noRespPct = safeDiv(noResponsible.length, rows.length) * 100;
  if (noResponsible.length > 0 && noRespPct > 20) {
    insights.push({
      id: `ev-${++id}`,
      area: "evidence",
      severity: "medium",
      title: `${noRespPct.toFixed(0)}% das evidências sem responsável`,
      description: `${noResponsible.length} evidências não têm SDR nem Closer vinculado.`,
      recommendation: "Vincule SDR/Closer às evidências para permitir análise individual de performance.",
      metric: { label: "Sem Responsável", value: noResponsible.length, benchmark: 0 },
      evidenceLink: "/evidence",
    });
  }

  // Value outlier detection using IQR
  const wonValues = rows
    .filter((r) => r.funnel_step === "won" && r.value && r.value > 0)
    .map((r) => r.value!);

  if (wonValues.length >= 5) {
    wonValues.sort((a, b) => a - b);
    const q1 = wonValues[Math.floor(wonValues.length * 0.25)];
    const q3 = wonValues[Math.floor(wonValues.length * 0.75)];
    const iqr = q3 - q1;
    const upper = q3 + iqr * 1.5;
    const lower = Math.max(0, q1 - iqr * 1.5);

    const outliers = wonValues.filter((v) => v > upper || v < lower);
    if (outliers.length > 0) {
      insights.push({
        id: `ev-${++id}`,
        area: "evidence",
        severity: "info",
        title: `${outliers.length} valor(es) atípico(s) detectado(s)`,
        description: `Valores fora do intervalo normal (R$${lower.toFixed(0)} - R$${upper.toFixed(0)}): ${outliers.map((v) => `R$${v.toLocaleString("pt-BR")}`).join(", ")}.`,
        recommendation: "Verifique se esses valores estão corretos ou se houve erro de digitação.",
        evidenceLink: "/evidence?funnelStep=won",
      });
    }
  }

  // Tags analysis
  const noTags = rows.filter((r) => !r.tags || r.tags.length === 0);
  const noTagsPct = safeDiv(noTags.length, rows.length) * 100;
  if (noTags.length > 0 && noTagsPct > 50) {
    insights.push({
      id: `ev-${++id}`,
      area: "evidence",
      severity: "info",
      title: `${noTagsPct.toFixed(0)}% das evidências sem tags`,
      description: "Tags ajudam a categorizar e filtrar evidências. A maioria das evidências não está categorizada.",
      recommendation: "Defina um conjunto padrão de tags e aplique-as retroativamente para melhorar a rastreabilidade.",
      metric: { label: "Sem Tags", value: noTags.length, benchmark: 0 },
    });
  }

  return insights;
}
