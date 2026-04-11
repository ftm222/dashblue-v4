import type { AIInsight, PeriodRange } from "@/types";
import { db } from "@/lib/supabase";

function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

interface CampaignRow {
  id: string;
  name: string;
  investment: number;
  leads: number;
  booked: number;
  won: number;
  revenue: number;
}

export async function analyzeMarketing(period: PeriodRange): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  let id = 0;

  const fromStr = period.from.toISOString().slice(0, 10);
  const toStr = period.to.toISOString().slice(0, 10);

  const { data } = await db
    .from("campaigns")
    .select("id, name, investment, leads, booked, won, revenue")
    .lte("period_start", toStr)
    .gte("period_end", fromStr);

  const campaigns = (data ?? []) as CampaignRow[];
  if (campaigns.length === 0) return [];

  const totalInvestment = campaigns.reduce((s, c) => s + c.investment, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const avgCPL = safeDiv(totalInvestment, totalLeads);

  if (totalLeads > 0 && avgCPL > 0) {
    const expensive = campaigns.filter(
      (c) => c.leads > 0 && safeDiv(c.investment, c.leads) > avgCPL * 1.5,
    );

    if (expensive.length > 0) {
      const wastedBudget = expensive.reduce((s, c) => {
        const excess = c.investment - avgCPL * c.leads;
        return s + Math.max(0, excess);
      }, 0);

      insights.push({
        id: `mkt-${++id}`,
        area: "marketing",
        severity: wastedBudget > totalInvestment * 0.2 ? "high" : "medium",
        title: `${expensive.length} campanha(s) com CPL 50%+ acima da média`,
        description: `Campanhas: ${expensive.map((c) => c.name).join(", ")}. Budget potencialmente desperdiçado: R$${wastedBudget.toFixed(2)}.`,
        recommendation: "Considere pausar ou otimizar essas campanhas e redistribuir o budget para as de melhor performance.",
        metric: { label: "CPL Médio", value: avgCPL, benchmark: avgCPL * 0.8 },
        evidenceLink: "/marketing",
      });
    }
  }

  const negativeROI = campaigns.filter(
    (c) => c.investment > 0 && c.revenue < c.investment,
  );
  if (negativeROI.length > 0) {
    const totalLoss = negativeROI.reduce((s, c) => s + (c.investment - c.revenue), 0);
    insights.push({
      id: `mkt-${++id}`,
      area: "marketing",
      severity: totalLoss > totalInvestment * 0.3 ? "critical" : "high",
      title: `${negativeROI.length} campanha(s) com ROI negativo`,
      description: `Prejuízo total de R$${totalLoss.toFixed(2)} nessas campanhas.`,
      recommendation: "Analise os criativos, segmentação e landing pages dessas campanhas antes de renovar o investimento.",
      metric: { label: "Prejuízo", value: totalLoss, benchmark: 0 },
      evidenceLink: "/marketing",
    });
  }

  // Pareto analysis: check if 20% of campaigns generate 80% of leads
  if (campaigns.length >= 5 && totalLeads > 0) {
    const sorted = [...campaigns].sort((a, b) => b.leads - a.leads);
    const top20Count = Math.max(1, Math.ceil(sorted.length * 0.2));
    const top20Leads = sorted.slice(0, top20Count).reduce((s, c) => s + c.leads, 0);
    const top20Pct = (top20Leads / totalLeads) * 100;

    if (top20Pct >= 70) {
      insights.push({
        id: `mkt-${++id}`,
        area: "marketing",
        severity: "info",
        title: "Concentração de performance (Pareto)",
        description: `${top20Count} campanha(s) (${((top20Count / sorted.length) * 100).toFixed(0)}%) geram ${top20Pct.toFixed(0)}% dos leads.`,
        recommendation: "Concentre orçamento nas campanhas top e reduza gradualmente investimento nas demais.",
        metric: { label: "Leads Top 20%", value: top20Leads, benchmark: totalLeads },
      });
    }
  }

  if (totalRevenue > 0 && totalInvestment > 0) {
    const roas = totalRevenue / totalInvestment;
    if (roas < 2) {
      insights.push({
        id: `mkt-${++id}`,
        area: "marketing",
        severity: roas < 1 ? "critical" : "high",
        title: "ROAS geral abaixo do ideal",
        description: `O retorno sobre investimento em marketing está em ${roas.toFixed(2)}x.`,
        recommendation: roas < 1
          ? "Urgente: o investimento em ads está maior que o retorno. Revise toda a estratégia."
          : "Otimize campanhas para elevar o ROAS acima de 3x.",
        metric: { label: "ROAS", value: roas, benchmark: 3 },
        evidenceLink: "/marketing",
      });
    }
  }

  return insights;
}
