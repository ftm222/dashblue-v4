import type { AIInsight, PeriodRange } from "@/types";
import { db } from "@/lib/supabase";

function isoDate(d: Date): string {
  return d.toISOString();
}

function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

interface SquadScore {
  squadName: string;
  members: number;
  leads: number;
  won: number;
  revenue: number;
  conversionRate: number;
  ticket: number;
  score: number;
}

export async function analyzeSquads(period: PeriodRange): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  let id = 0;

  const { data: squads } = await db.from("squads").select("id, name");
  const squadList = (squads ?? []) as { id: string; name: string }[];
  if (squadList.length < 2) return [];

  const { data: people } = await db
    .from("people")
    .select("id, name, role, squad_id")
    .eq("active", true);

  const peopleRows = (people ?? []) as { id: string; name: string; role: string; squad_id?: string | null }[];
  if (peopleRows.length === 0) return [];

  const personIds = peopleRows.map((p) => p.id);
  const { data: evidence } = await db
    .from("evidence")
    .select("funnel_step, value, sdr_id, closer_id")
    .or(`sdr_id.in.(${personIds.join(",")}),closer_id.in.(${personIds.join(",")})`)
    .gte("created_at", isoDate(period.from))
    .lte("created_at", isoDate(period.to));

  const evRows = (evidence ?? []) as { funnel_step: string; value?: number; sdr_id?: string | null; closer_id?: string | null }[];

  const personSquadMap = new Map<string, string>();
  for (const p of peopleRows) {
    if (p.squad_id) personSquadMap.set(p.id, p.squad_id);
  }

  const squadIdNameMap = new Map<string, string>();
  for (const s of squadList) squadIdNameMap.set(s.id, s.name);

  const squadData = new Map<string, { leads: number; won: number; revenue: number; members: Set<string> }>();

  for (const s of squadList) {
    squadData.set(s.id, { leads: 0, won: 0, revenue: 0, members: new Set() });
  }

  for (const p of peopleRows) {
    if (p.squad_id && squadData.has(p.squad_id)) {
      squadData.get(p.squad_id)!.members.add(p.id);
    }
  }

  for (const ev of evRows) {
    const personId = ev.sdr_id || ev.closer_id;
    if (!personId) continue;
    const squadId = personSquadMap.get(personId);
    if (!squadId || !squadData.has(squadId)) continue;

    const sd = squadData.get(squadId)!;
    if (ev.funnel_step === "leads") sd.leads++;
    if (ev.funnel_step === "won") {
      sd.won++;
      sd.revenue += ev.value ?? 0;
    }
  }

  const scores: SquadScore[] = [];
  for (const [squadId, data] of squadData) {
    const name = squadIdNameMap.get(squadId) ?? squadId;
    const conversionRate = safeDiv(data.won, data.leads) * 100;
    const ticket = safeDiv(data.revenue, data.won);

    // Weighted score: revenue (50%), conversion (30%), leads (20%)
    const maxRevenue = Math.max(...[...squadData.values()].map((d) => d.revenue), 1);
    const maxLeads = Math.max(...[...squadData.values()].map((d) => d.leads), 1);
    const score =
      (safeDiv(data.revenue, maxRevenue) * 0.5 +
        safeDiv(conversionRate, 100) * 0.3 +
        safeDiv(data.leads, maxLeads) * 0.2) * 100;

    scores.push({
      squadName: name,
      members: data.members.size,
      leads: data.leads,
      won: data.won,
      revenue: data.revenue,
      conversionRate,
      ticket,
      score,
    });
  }

  scores.sort((a, b) => b.score - a.score);

  if (scores.length >= 2 && scores[0].score > 0) {
    const top = scores[0];
    const bottom = scores[scores.length - 1];
    const gap = top.score - bottom.score;

    if (gap > 30) {
      insights.push({
        id: `squad-${++id}`,
        area: "squads",
        severity: gap > 60 ? "high" : "medium",
        title: "Grande disparidade entre squads",
        description: `${top.squadName} lidera com score ${top.score.toFixed(0)} vs ${bottom.squadName} com ${bottom.score.toFixed(0)}. Gap de ${gap.toFixed(0)} pontos.`,
        recommendation: "Considere redistribuir membros ou replicar as práticas do squad de melhor performance.",
        metric: { label: "Gap Score", value: gap, benchmark: 20 },
        evidenceLink: "/squads",
      });
    }
  }

  // Squads without activity
  const emptySquads = scores.filter((s) => s.leads === 0 && s.won === 0 && s.members > 0);
  if (emptySquads.length > 0) {
    insights.push({
      id: `squad-${++id}`,
      area: "squads",
      severity: "medium",
      title: `${emptySquads.length} squad(s) sem atividade`,
      description: `${emptySquads.map((s) => s.squadName).join(", ")} têm membros mas nenhuma evidência no período.`,
      recommendation: "Verifique se os membros estão produzindo e se as evidências estão vinculadas corretamente.",
      evidenceLink: "/squads",
    });
  }

  // Squads with declining conversion
  for (const s of scores) {
    if (s.leads >= 10 && s.conversionRate < 5) {
      insights.push({
        id: `squad-${++id}`,
        area: "squads",
        severity: "high",
        title: `${s.squadName}: conversão crítica`,
        description: `Apenas ${s.conversionRate.toFixed(1)}% de conversão com ${s.leads} leads. Potencial de melhoria significativo.`,
        recommendation: `Analise o funil completo do squad ${s.squadName}: identifique em qual etapa os leads estão sendo perdidos.`,
        metric: { label: "Conversão", value: s.conversionRate, benchmark: 10 },
        evidenceLink: "/squads",
      });
    }
  }

  return insights;
}
