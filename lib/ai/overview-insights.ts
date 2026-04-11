import type { AIInsight, PeriodRange } from "@/types";
import { db } from "@/lib/supabase";

function isoDate(d: Date): string {
  return d.toISOString();
}

function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

function prevPeriod(period: PeriodRange): PeriodRange {
  const durationMs = period.to.getTime() - period.from.getTime();
  return {
    from: new Date(period.from.getTime() - durationMs),
    to: new Date(period.from.getTime() - 1),
  };
}

interface PeriodMetrics {
  leads: number;
  booked: number;
  received: number;
  won: number;
  revenue: number;
  investment: number;
}

async function getMetrics(period: PeriodRange): Promise<PeriodMetrics> {
  const { data: ev } = await db
    .from("evidence")
    .select("funnel_step, value")
    .gte("created_at", isoDate(period.from))
    .lte("created_at", isoDate(period.to));

  const rows = (ev ?? []) as { funnel_step: string; value?: number }[];

  const fromStr = period.from.toISOString().slice(0, 10);
  const toStr = period.to.toISOString().slice(0, 10);
  const { data: camps } = await db
    .from("campaigns")
    .select("investment, leads, booked, received, won, revenue")
    .lte("period_start", toStr)
    .gte("period_end", fromStr);

  const campRows = (camps ?? []) as {
    investment: number; leads: number; booked: number;
    received: number; won: number; revenue: number;
  }[];

  const evLeads = rows.filter((r) => r.funnel_step === "leads").length;
  const evBooked = rows.filter((r) => r.funnel_step === "booked").length;
  const evReceived = rows.filter((r) => r.funnel_step === "received").length;
  const evWon = rows.filter((r) => r.funnel_step === "won").length;
  const evRevenue = rows.filter((r) => r.funnel_step === "won").reduce((s, r) => s + (r.value ?? 0), 0);

  const campLeads = campRows.reduce((s, r) => s + r.leads, 0);
  const campBooked = campRows.reduce((s, r) => s + r.booked, 0);
  const campReceived = campRows.reduce((s, r) => s + r.received, 0);
  const campWon = campRows.reduce((s, r) => s + r.won, 0);
  const campRevenue = campRows.reduce((s, r) => s + r.revenue, 0);
  const campInvestment = campRows.reduce((s, r) => s + r.investment, 0);

  return {
    leads: evLeads || campLeads,
    booked: evBooked || campBooked,
    received: evReceived || campReceived,
    won: evWon || campWon,
    revenue: evRevenue || campRevenue,
    investment: campInvestment,
  };
}

export async function analyzeOverview(period: PeriodRange): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  let id = 0;

  const prev = prevPeriod(period);
  const [curr, last] = await Promise.all([getMetrics(period), getMetrics(prev)]);

  if (curr.leads === 0 && curr.revenue === 0 && curr.investment === 0) {
    return [];
  }

  const metrics = [
    { key: "revenue", label: "Receita", curr: curr.revenue, prev: last.revenue, positive: true },
    { key: "leads", label: "Leads", curr: curr.leads, prev: last.leads, positive: true },
    { key: "won", label: "Vendas", curr: curr.won, prev: last.won, positive: true },
    { key: "investment", label: "Investimento", curr: curr.investment, prev: last.investment, positive: false },
  ];

  let biggestChange = { key: "", pct: 0, label: "", direction: "" as "up" | "down" };
  for (const m of metrics) {
    if (m.prev === 0) continue;
    const pct = ((m.curr - m.prev) / m.prev) * 100;
    if (Math.abs(pct) > Math.abs(biggestChange.pct)) {
      biggestChange = { key: m.key, pct, label: m.label, direction: pct > 0 ? "up" : "down" };
    }
  }

  if (biggestChange.key && Math.abs(biggestChange.pct) > 5) {
    const isGood = biggestChange.direction === "up"
      ? metrics.find((m) => m.key === biggestChange.key)?.positive
      : !metrics.find((m) => m.key === biggestChange.key)?.positive;

    insights.push({
      id: `overview-${++id}`,
      area: "overview",
      severity: Math.abs(biggestChange.pct) > 30 ? "high" : "medium",
      title: `${biggestChange.label}: ${biggestChange.pct > 0 ? "+" : ""}${biggestChange.pct.toFixed(1)}% vs período anterior`,
      description: `A maior variação no período foi em ${biggestChange.label}. ${isGood ? "Tendência positiva." : "Requer atenção."}`,
      recommendation: isGood
        ? "Continue monitorando para manter o crescimento."
        : `Investigue as causas da queda em ${biggestChange.label} e tome ações corretivas.`,
      metric: {
        label: biggestChange.label,
        value: metrics.find((m) => m.key === biggestChange.key)!.curr,
        benchmark: metrics.find((m) => m.key === biggestChange.key)!.prev,
      },
    });
  }

  const conversionRate = safeDiv(curr.won, curr.leads) * 100;
  if (curr.leads > 0 && conversionRate < 10) {
    insights.push({
      id: `overview-${++id}`,
      area: "overview",
      severity: conversionRate < 5 ? "critical" : "high",
      title: "Taxa de conversão geral crítica",
      description: `Apenas ${conversionRate.toFixed(1)}% dos leads são convertidos em vendas.`,
      recommendation: "Analise cada etapa do funil para identificar o maior drop-off e priorize ações corretivas.",
      metric: { label: "Taxa de Conversão", value: conversionRate, benchmark: 10 },
      evidenceLink: "/evidence",
    });
  }

  const roas = safeDiv(curr.revenue, curr.investment);
  if (curr.investment > 0 && roas < 2) {
    insights.push({
      id: `overview-${++id}`,
      area: "overview",
      severity: roas < 1 ? "critical" : "high",
      title: "ROAS abaixo do ideal",
      description: `ROAS atual de ${roas.toFixed(2)}x. Para cada R$1 investido, retorna R$${roas.toFixed(2)}.`,
      recommendation: "Revise a alocação de budget entre campanhas e priorize as com melhor performance.",
      metric: { label: "ROAS", value: roas, benchmark: 3 },
    });
  }

  return insights;
}
