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

interface SDRMetrics {
  id: string;
  name: string;
  leads: number;
  booked: number;
  received: number;
  showRate: number;
}

export async function analyzeSDRs(period: PeriodRange): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  let id = 0;

  const { data: people } = await db
    .from("people")
    .select("id, name")
    .eq("role", "sdr")
    .eq("active", true);

  const sdrs = (people ?? []) as { id: string; name: string }[];
  if (sdrs.length === 0) return [];

  const sdrIds = sdrs.map((s) => s.id);

  const [{ data: evCurr }, { data: evPrev }] = await Promise.all([
    db.from("evidence")
      .select("funnel_step, sdr_id")
      .in("sdr_id", sdrIds)
      .gte("created_at", isoDate(period.from))
      .lte("created_at", isoDate(period.to)),
    db.from("evidence")
      .select("funnel_step, sdr_id")
      .in("sdr_id", sdrIds)
      .gte("created_at", isoDate(prevPeriod(period).from))
      .lte("created_at", isoDate(prevPeriod(period).to)),
  ]);

  const currRows = (evCurr ?? []) as { funnel_step: string; sdr_id?: string | null }[];
  const prevRows = (evPrev ?? []) as { funnel_step: string; sdr_id?: string | null }[];

  function buildMetrics(rows: typeof currRows, sdrList: typeof sdrs): SDRMetrics[] {
    return sdrList.map((s) => {
      const mine = rows.filter((r) => r.sdr_id === s.id);
      const leads = mine.filter((r) => r.funnel_step === "leads").length;
      const booked = mine.filter((r) => r.funnel_step === "booked").length;
      const received = mine.filter((r) => r.funnel_step === "received").length;
      return {
        id: s.id,
        name: s.name,
        leads,
        booked,
        received,
        showRate: safeDiv(received, booked) * 100,
      };
    });
  }

  const currMetrics = buildMetrics(currRows, sdrs);
  const prevMetrics = buildMetrics(prevRows, sdrs);

  const totalBooked = currMetrics.reduce((s, m) => s + m.booked, 0);
  const totalReceived = currMetrics.reduce((s, m) => s + m.received, 0);
  const avgShowRate = safeDiv(totalReceived, totalBooked) * 100;

  if (totalBooked > 0 && avgShowRate < 60) {
    insights.push({
      id: `sdr-${++id}`,
      area: "sdrs",
      severity: avgShowRate < 40 ? "critical" : "high",
      title: "Taxa de comparecimento abaixo do ideal",
      description: `Show rate geral de ${avgShowRate.toFixed(1)}% — recomendado mínimo de 60%.`,
      recommendation: "Implemente lembretes automatizados (WhatsApp/SMS) 1h e 24h antes das reuniões.",
      metric: { label: "Show Rate", value: avgShowRate, benchmark: 60 },
      evidenceLink: "/evidence?funnelStep=booked",
    });
  }

  // SDRs without leads in the period
  const inactive = currMetrics.filter((m) => m.leads === 0 && m.booked === 0);
  if (inactive.length > 0) {
    insights.push({
      id: `sdr-${++id}`,
      area: "sdrs",
      severity: "medium",
      title: `${inactive.length} SDR(s) sem atividade no período`,
      description: `${inactive.map((s) => s.name).join(", ")} não geraram leads nem agendamentos.`,
      recommendation: "Verifique se os SDRs estão ativos e se as evidências estão vinculadas corretamente.",
      evidenceLink: "/sdrs",
    });
  }

  // SDRs with performance drop vs previous period
  for (const curr of currMetrics) {
    const prev = prevMetrics.find((p) => p.id === curr.id);
    if (!prev || prev.booked === 0) continue;

    const drop = ((curr.booked - prev.booked) / prev.booked) * 100;
    if (drop < -25 && prev.booked >= 3) {
      insights.push({
        id: `sdr-${++id}`,
        area: "sdrs",
        severity: drop < -50 ? "high" : "medium",
        title: `${curr.name}: queda de ${Math.abs(drop).toFixed(0)}% em agendamentos`,
        description: `De ${prev.booked} para ${curr.booked} agendamentos vs período anterior.`,
        recommendation: `Acompanhe ${curr.name} de perto: analise volume de ligações, abordagens e qualidade das listas.`,
        metric: { label: "Agendamentos", value: curr.booked, benchmark: prev.booked },
        evidenceLink: "/sdrs",
      });
    }
  }

  // SDRs with low show rate (individual)
  if (sdrs.length > 1) {
    for (const m of currMetrics) {
      if (m.booked < 3) continue;
      if (m.showRate < avgShowRate * 0.7 && m.showRate < 50) {
        insights.push({
          id: `sdr-${++id}`,
          area: "sdrs",
          severity: "medium",
          title: `${m.name}: show rate significativamente abaixo da média`,
          description: `Show rate individual de ${m.showRate.toFixed(1)}% vs média de ${avgShowRate.toFixed(1)}%.`,
          recommendation: `Revise o processo de confirmação de agenda de ${m.name} e compare com o workflow dos SDRs de melhor performance.`,
          metric: { label: "Show Rate", value: m.showRate, benchmark: avgShowRate },
        });
      }
    }
  }

  return insights;
}
