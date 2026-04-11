import type { AIInsight, PeriodRange } from "@/types";
import { db } from "@/lib/supabase";

function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

export async function analyzeFinanceiro(period: PeriodRange): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  let id = 0;

  const { data: contracts } = await db
    .from("contracts")
    .select("id, value, status, signed_at, paid_at, created_at")
    .order("created_at", { ascending: false });

  const rows = (contracts ?? []) as {
    id: string; value: number; status: string;
    signed_at?: string | null; paid_at?: string | null; created_at: string;
  }[];

  if (rows.length === 0) return [];

  const totalRevenue = rows.reduce((s, c) => s + c.value, 0);
  const signed = rows.filter((c) => c.status !== "unsigned");
  const paid = rows.filter((c) => c.status === "signed_paid");
  const signedUnpaid = rows.filter((c) => c.status === "signed_unpaid");
  const unsigned = rows.filter((c) => c.status === "unsigned");

  // Signature gap
  if (unsigned.length > 0) {
    const gap = unsigned.reduce((s, c) => s + c.value, 0);
    const pct = safeDiv(gap, totalRevenue) * 100;
    insights.push({
      id: `fin-${++id}`,
      area: "financeiro",
      severity: pct > 30 ? "high" : "medium",
      title: `R$${gap.toLocaleString("pt-BR")} em contratos sem assinatura`,
      description: `${unsigned.length} contrato(s) aguardando assinatura, representando ${pct.toFixed(1)}% da receita total.`,
      recommendation: "Priorize o follow-up desses contratos. Defina SLA de assinatura de no máximo 48h após fechamento.",
      metric: { label: "Gap Assinatura", value: gap, benchmark: 0 },
      evidenceLink: "/financial",
    });
  }

  // Payment gap (signed but not paid)
  if (signedUnpaid.length > 0) {
    const gap = signedUnpaid.reduce((s, c) => s + c.value, 0);
    insights.push({
      id: `fin-${++id}`,
      area: "financeiro",
      severity: gap > totalRevenue * 0.2 ? "critical" : "high",
      title: `R$${gap.toLocaleString("pt-BR")} assinados mas não pagos`,
      description: `${signedUnpaid.length} contrato(s) assinados aguardando pagamento. Risco de inadimplência.`,
      recommendation: "Configure cobrança automatizada e defina processo de follow-up para pagamentos atrasados.",
      metric: { label: "Gap Pagamento", value: gap, benchmark: 0 },
      evidenceLink: "/financial",
    });
  }

  // Revenue projection based on daily rate
  const periodDays = Math.max(1, (period.to.getTime() - period.from.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(1, (Date.now() - period.from.getTime()) / (1000 * 60 * 60 * 24));
  const periodContracts = rows.filter((c) => {
    const d = new Date(c.created_at);
    return d >= period.from && d <= period.to;
  });
  const periodRevenue = periodContracts.reduce((s, c) => s + c.value, 0);

  if (periodRevenue > 0 && elapsedDays < periodDays) {
    const dailyRate = periodRevenue / Math.min(elapsedDays, periodDays);
    const projected = dailyRate * periodDays;
    const remainingDays = Math.max(0, periodDays - elapsedDays);

    insights.push({
      id: `fin-${++id}`,
      area: "financeiro",
      severity: "info",
      title: `Projeção: R$${projected.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} até o fim do período`,
      description: `Taxa diária de R$${dailyRate.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}. Faltam ${remainingDays.toFixed(0)} dias para o fim do período.`,
      recommendation: "Essa é uma projeção linear simples. Ações de aceleração podem aumentar o resultado final.",
      metric: { label: "Receita Projetada", value: projected, benchmark: periodRevenue },
    });
  }

  // Average ticket analysis
  if (paid.length >= 3) {
    const tickets = paid.map((c) => c.value).sort((a, b) => a - b);
    const avgTicket = tickets.reduce((s, v) => s + v, 0) / tickets.length;
    const median = tickets[Math.floor(tickets.length / 2)];

    if (avgTicket > median * 1.5) {
      insights.push({
        id: `fin-${++id}`,
        area: "financeiro",
        severity: "info",
        title: "Ticket médio inflado por outliers",
        description: `Ticket médio R$${avgTicket.toFixed(0)} vs mediana R$${median.toFixed(0)}. Poucos contratos de alto valor distorcem a média.`,
        recommendation: "Use a mediana para planejamento mais realista. Analise os contratos de alto valor separadamente.",
        metric: { label: "Ticket Médio", value: avgTicket, benchmark: median },
      });
    }
  }

  return insights;
}
