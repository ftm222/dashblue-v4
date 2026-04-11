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

interface CloserMetrics {
  id: string;
  name: string;
  received: number;
  won: number;
  revenue: number;
  closeRate: number;
  ticket: number;
}

export async function analyzeClosers(period: PeriodRange): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  let id = 0;

  const { data: people } = await db
    .from("people")
    .select("id, name")
    .eq("role", "closer")
    .eq("active", true);

  const closers = (people ?? []) as { id: string; name: string }[];
  if (closers.length === 0) return [];

  const closerIds = closers.map((c) => c.id);

  const [{ data: evCurr }, { data: evPrev }] = await Promise.all([
    db.from("evidence")
      .select("funnel_step, value, closer_id")
      .in("closer_id", closerIds)
      .gte("created_at", isoDate(period.from))
      .lte("created_at", isoDate(period.to)),
    db.from("evidence")
      .select("funnel_step, value, closer_id")
      .in("closer_id", closerIds)
      .gte("created_at", isoDate(prevPeriod(period).from))
      .lte("created_at", isoDate(prevPeriod(period).to)),
  ]);

  const currRows = (evCurr ?? []) as { funnel_step: string; value?: number; closer_id?: string | null }[];
  const prevRows = (evPrev ?? []) as { funnel_step: string; value?: number; closer_id?: string | null }[];

  function buildMetrics(rows: typeof currRows, list: typeof closers): CloserMetrics[] {
    return list.map((c) => {
      const mine = rows.filter((r) => r.closer_id === c.id);
      const received = mine.filter((r) => r.funnel_step === "received").length;
      const won = mine.filter((r) => r.funnel_step === "won").length;
      const revenue = mine.filter((r) => r.funnel_step === "won").reduce((s, r) => s + (r.value ?? 0), 0);
      return {
        id: c.id,
        name: c.name,
        received,
        won,
        revenue,
        closeRate: safeDiv(won, received) * 100,
        ticket: safeDiv(revenue, won),
      };
    });
  }

  const currMetrics = buildMetrics(currRows, closers);
  const prevMetrics = buildMetrics(prevRows, closers);

  const totalReceived = currMetrics.reduce((s, m) => s + m.received, 0);
  const totalWon = currMetrics.reduce((s, m) => s + m.won, 0);
  const avgCloseRate = safeDiv(totalWon, totalReceived) * 100;

  if (totalReceived > 0 && avgCloseRate < 20 && avgCloseRate > 0) {
    insights.push({
      id: `closer-${++id}`,
      area: "closers",
      severity: avgCloseRate < 10 ? "high" : "medium",
      title: "Taxa de fechamento geral baixa",
      description: `Apenas ${avgCloseRate.toFixed(1)}% das reuniões resultam em venda.`,
      recommendation: "Invista em treinamento de técnicas de fechamento e revise a qualificação dos leads recebidos.",
      metric: { label: "Close Rate", value: avgCloseRate, benchmark: 25 },
      evidenceLink: "/closers",
    });
  }

  // Closers without sales
  const noSales = currMetrics.filter((m) => m.won === 0 && m.received > 0);
  if (noSales.length > 0) {
    insights.push({
      id: `closer-${++id}`,
      area: "closers",
      severity: "high",
      title: `${noSales.length} Closer(s) sem vendas no período`,
      description: `${noSales.map((c) => `${c.name} (${c.received} reuniões)`).join(", ")} — receberam reuniões mas não fecharam.`,
      recommendation: "Acompanhe o pipeline de cada closer e identifique gargalos na negociação.",
      evidenceLink: "/closers",
    });
  }

  // Closer with performance drop
  for (const curr of currMetrics) {
    const prev = prevMetrics.find((p) => p.id === curr.id);
    if (!prev || prev.won === 0) continue;

    const drop = ((curr.won - prev.won) / prev.won) * 100;
    if (drop < -30 && prev.won >= 2) {
      insights.push({
        id: `closer-${++id}`,
        area: "closers",
        severity: "high",
        title: `${curr.name}: queda de ${Math.abs(drop).toFixed(0)}% em fechamentos`,
        description: `De ${prev.won} para ${curr.won} vendas vs período anterior.`,
        recommendation: `Analise as negociações perdidas de ${curr.name}: verifique objeções recorrentes e proponha coaching.`,
        metric: { label: "Vendas", value: curr.won, benchmark: prev.won },
        evidenceLink: "/closers",
      });
    }
  }

  // Pipeline bottleneck: lots of meetings, few proposals
  if (closers.length > 1) {
    for (const m of currMetrics) {
      if (m.received < 5) continue;
      if (m.closeRate < avgCloseRate * 0.6) {
        insights.push({
          id: `closer-${++id}`,
          area: "closers",
          severity: "medium",
          title: `${m.name}: close rate muito abaixo da média`,
          description: `Close rate de ${m.closeRate.toFixed(1)}% vs média de ${avgCloseRate.toFixed(1)}%. Possível gargalo na etapa de proposta/negociação.`,
          recommendation: `Revise o script e a abordagem de ${m.name}. Compare com closers de melhor performance.`,
          metric: { label: "Close Rate", value: m.closeRate, benchmark: avgCloseRate },
        });
      }
    }
  }

  return insights;
}
