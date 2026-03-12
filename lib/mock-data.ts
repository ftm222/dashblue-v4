import { format, subDays } from "date-fns";
import type {
  KPI,
  FunnelStep,
  Person,
  Campaign,
  EvidenceRecord,
  DiagnosticCard,
  Alert,
  SetupChecklistItem,
  Integration,
  Goal,
  CursorPagination,
  PeriodRange,
  FinancialContract,
  FinancialSummary,
} from "@/types";

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const FIRST_NAMES = [
  "Lucas",
  "Mariana",
  "Pedro",
  "Ana",
  "Rafael",
  "Juliana",
  "Thiago",
  "Camila",
  "Bruno",
  "Fernanda",
  "Gabriel",
  "Larissa",
  "Diego",
  "Beatriz",
  "Felipe",
  "Carolina",
];

const LAST_NAMES = [
  "Silva",
  "Santos",
  "Oliveira",
  "Souza",
  "Rodrigues",
  "Ferreira",
  "Almeida",
  "Pereira",
  "Costa",
  "Carvalho",
  "Gomes",
  "Martins",
  "Araújo",
  "Ribeiro",
  "Lima",
  "Monteiro",
];

const SQUADS = ["Alpha", "Beta", "Gamma"];

const CAMPAIGN_PREFIXES = [
  "Meta | Conversão",
  "Meta | Tráfego",
  "Meta | Remarketing",
  "Google | Search",
  "Google | Display",
  "Meta | Lookalike",
  "Meta | Vídeo",
];

const CAMPAIGN_SUFFIXES = [
  "Fev/26",
  "Mar/26",
  "Abr/26",
  "Principal",
  "Teste A",
  "Teste B",
  "Hot Leads",
  "Frio",
  "LTV Alto",
];

const UTM_SOURCES = ["meta", "google", "instagram", "tiktok"];
const UTM_MEDIUMS = ["cpc", "cpm", "social", "display"];
const UTM_CAMPAIGNS = [
  "conv_fev",
  "remarketing_mar",
  "lookalike_abr",
  "search_brand",
  "video_awareness",
];

const FUNNEL_STEPS_LABELS: { key: string; label: string }[] = [
  { key: "leads", label: "Leads" },
  { key: "booked", label: "Agendados" },
  { key: "received", label: "Recebidos" },
  { key: "negotiation", label: "Negociação" },
  { key: "won", label: "Fechados" },
];

const TAGS = [
  "quente",
  "frio",
  "indicação",
  "orgânico",
  "retorno",
  "VIP",
  "novo",
  "inbound",
];

function generateName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

export function generateKPIs(
  role: "overview" | "marketing" | "sdr" | "closer" = "overview"
): KPI[] {
  const investment = rand(15000, 80000);
  const leads = rand(200, 1200);
  const cpl = parseFloat((investment / leads).toFixed(2));
  const booked = Math.floor(leads * randFloat(0.25, 0.5));
  const received = Math.floor(booked * randFloat(0.6, 0.85));
  const won = Math.floor(received * randFloat(0.15, 0.4));
  const revenue = won * rand(1500, 8000);
  const roas = parseFloat((revenue / investment).toFixed(2));
  const cac = won > 0 ? parseFloat((investment / won).toFixed(2)) : 0;
  const ticket = won > 0 ? parseFloat((revenue / won).toFixed(2)) : 0;
  const conversionRate = leads > 0 ? parseFloat(((won / leads) * 100).toFixed(2)) : 0;
  const showRate = booked > 0 ? parseFloat(((received / booked) * 100).toFixed(2)) : 0;

  function trend(): "up" | "down" | "stable" {
    return pick(["up", "down", "stable"]);
  }

  const all: KPI[] = [
    {
      key: "investment",
      label: "Investimento",
      value: investment,
      previousValue: rand(12000, 75000),
      format: "currency",
      trend: trend(),
      trendIsPositive: false,
    },
    {
      key: "cpl",
      label: "CPL",
      value: cpl,
      previousValue: randFloat(20, 120),
      format: "currency",
      trend: trend(),
      trendIsPositive: false,
    },
    {
      key: "leads",
      label: "Leads",
      value: leads,
      previousValue: rand(180, 1100),
      format: "number",
      trend: trend(),
      trendIsPositive: true,
    },
    {
      key: "booked",
      label: "Agendados",
      value: booked,
      previousValue: rand(50, 500),
      format: "number",
      trend: trend(),
      trendIsPositive: true,
    },
    {
      key: "received",
      label: "Recebidos",
      value: received,
      previousValue: rand(40, 400),
      format: "number",
      trend: trend(),
      trendIsPositive: true,
    },
    {
      key: "won",
      label: "Fechados",
      value: won,
      previousValue: rand(10, 120),
      format: "number",
      trend: trend(),
      trendIsPositive: true,
    },
    {
      key: "revenue",
      label: "Receita",
      value: revenue,
      previousValue: rand(50000, 500000),
      format: "currency",
      trend: trend(),
      trendIsPositive: true,
    },
    {
      key: "roas",
      label: "ROAS",
      value: roas,
      previousValue: randFloat(1, 10),
      format: "ratio",
      trend: trend(),
      trendIsPositive: true,
    },
    {
      key: "cac",
      label: "CAC",
      value: cac,
      previousValue: randFloat(300, 3000),
      format: "currency",
      trend: trend(),
      trendIsPositive: false,
    },
    {
      key: "ticket",
      label: "Ticket Médio",
      value: ticket,
      previousValue: randFloat(1000, 8000),
      format: "currency",
      trend: trend(),
      trendIsPositive: true,
    },
    {
      key: "conversion_rate",
      label: "Taxa de Conversão",
      value: conversionRate,
      previousValue: randFloat(1, 15),
      format: "percent",
      trend: trend(),
      trendIsPositive: true,
    },
    {
      key: "show_rate",
      label: "Taxa de Comparecimento",
      value: showRate,
      previousValue: randFloat(50, 90),
      format: "percent",
      trend: trend(),
      trendIsPositive: true,
    },
  ];

  const roleKeys: Record<string, string[]> = {
    overview: [
      "investment",
      "leads",
      "booked",
      "received",
      "won",
      "revenue",
      "roas",
      "cac",
      "ticket",
      "conversion_rate",
      "show_rate",
    ],
    marketing: ["investment", "cpl", "leads", "booked", "roas"],
    sdr: ["leads", "booked", "show_rate", "cpl"],
    closer: ["received", "won", "revenue", "ticket", "conversion_rate"],
  };

  const keys = roleKeys[role] ?? roleKeys.overview;
  return all.filter((k) => keys.includes(k.key));
}

export function generateFunnelSteps(): FunnelStep[] {
  const leadsCount = rand(400, 1500);
  const counts = [leadsCount];
  for (let i = 1; i < FUNNEL_STEPS_LABELS.length; i++) {
    counts.push(Math.floor(counts[i - 1] * randFloat(0.3, 0.7)));
  }

  return FUNNEL_STEPS_LABELS.map((step, i) => ({
    key: step.key,
    label: step.label,
    count: counts[i],
    conversionFromPrevious:
      i === 0
        ? undefined
        : parseFloat(((counts[i] / counts[i - 1]) * 100).toFixed(1)),
    conversionFromTop:
      i === 0
        ? undefined
        : parseFloat(((counts[i] / counts[0]) * 100).toFixed(1)),
  }));
}

function generateCallMetrics(withR1R2 = false) {
  const totalCalls = rand(40, 180);
  const answeredCalls = Math.floor(totalCalls * randFloat(0.55, 0.85));
  const missedCalls = totalCalls - answeredCalls;
  const avgDurationMinutes = randFloat(8, 35, 1);
  const callsToClose = randFloat(3, 12, 1);
  const followUps = rand(10, 60);

  const base = { totalCalls, answeredCalls, missedCalls, avgDurationMinutes, callsToClose, followUps };

  if (withR1R2) {
    const r1Calls = Math.floor(totalCalls * randFloat(0.65, 0.9));
    const r2Calls = totalCalls - r1Calls;
    return { ...base, r1Calls, r2Calls };
  }

  return base;
}

export function generatePeople(
  role: "sdr" | "closer",
  count = 5
): Person[] {
  return Array.from({ length: count }, (_, i) => {
    const name = generateName();
    return {
      id: `${role}-${i + 1}`,
      name,
      avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
      role,
      squad: pick(SQUADS),
      kpis: generateKPIs(role),
      funnel: role === "closer" ? generateFunnelSteps().slice(2) : generateFunnelSteps().slice(0, 3),
      callMetrics: generateCallMetrics(role === "sdr"),
      ...(role === "sdr"
        ? {
            salesOriginated: rand(5000, 30000),
            contractsOriginated: rand(2, 8),
          }
        : {}),
    };
  });
}

export function generateCampaigns(count = 8): Campaign[] {
  return Array.from({ length: count }, (_, i) => {
    const investment = rand(2000, 25000);
    const impressions = rand(20000, 500000);
    const clicks = Math.floor(impressions * randFloat(0.005, 0.04));
    const leads = Math.floor(clicks * randFloat(0.05, 0.25));
    const booked = Math.floor(leads * randFloat(0.2, 0.5));
    const received = Math.floor(booked * randFloat(0.5, 0.85));
    const won = Math.floor(received * randFloat(0.1, 0.35));
    const revenue = won * rand(1500, 7000);
    const source = pick(["meta", "google"]);

    return {
      id: `camp-${i + 1}`,
      name: `${pick(CAMPAIGN_PREFIXES)} | ${pick(CAMPAIGN_SUFFIXES)}`,
      source,
      medium: source === "meta" ? pick(["cpc", "cpm", "social"]) : pick(["cpc", "display"]),
      investment,
      impressions,
      clicks,
      ctr: parseFloat(((clicks / impressions) * 100).toFixed(2)),
      cpc: parseFloat((investment / clicks).toFixed(2)),
      cpl: leads > 0 ? parseFloat((investment / leads).toFixed(2)) : 0,
      leads,
      booked,
      received,
      won,
      revenue,
    };
  });
}

export function generateEvidence(
  count = 25,
  cursor?: string
): { data: EvidenceRecord[]; pagination: CursorPagination } {
  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const total = 150;

  const data: EvidenceRecord[] = Array.from(
    { length: Math.min(count, total - startIndex) },
    (_, i) => {
      const idx = startIndex + i;
      const name = generateName();
      const step = pick(FUNNEL_STEPS_LABELS);
      const hasBadge = Math.random() > 0.6;

      return {
        id: `ev-${idx + 1}`,
        contactName: name,
        phone: `+55 11 ${rand(90000, 99999)}-${rand(1000, 9999)}`,
        email: `${name.toLowerCase().replace(/ /g, ".")}@email.com`,
        crmUrl: `https://kommo.com/leads/detail/${rand(100000, 999999)}`,
        utmSource: pick(UTM_SOURCES),
        utmMedium: pick(UTM_MEDIUMS),
        utmCampaign: pick(UTM_CAMPAIGNS),
        funnelStep: step.key,
        sdr: Math.random() > 0.3 ? generateName() : undefined,
        closer: step.key === "won" || step.key === "negotiation" ? generateName() : undefined,
        value: step.key === "won" ? rand(1500, 12000) : undefined,
        createdAt: format(subDays(new Date(), rand(0, 30)), "yyyy-MM-dd'T'HH:mm:ss"),
        tags: [...new Set(Array.from({ length: rand(0, 3) }, () => pick(TAGS)))],
        badges: hasBadge
          ? [pick(["assinado", "pago", "ticket_ausente"] as const)]
          : [],
      };
    }
  );

  const nextCursor = startIndex + count;

  return {
    data,
    pagination: {
      cursor: nextCursor < total ? String(nextCursor) : undefined,
      limit: count,
      hasMore: nextCursor < total,
      total,
    },
  };
}

export function generateDiagnostics(): DiagnosticCard[] {
  return [
    {
      id: "diag-1",
      domain: "marketing",
      bottleneck: "CPL acima da meta em campanhas de Lookalike",
      impact: "Aumento de 35% no custo de aquisição no último mês",
      recommendation:
        "Pausar audiências com CPL acima de R$ 80 e redistribuir orçamento para campanhas de Remarketing que apresentam CPL 40% menor.",
      evidenceLink: "/evidence?utmCampaign=lookalike_abr",
      severity: "high",
    },
    {
      id: "diag-2",
      domain: "sdrs",
      bottleneck: "Taxa de agendamento abaixo de 25%",
      impact: "Perda estimada de 45 reuniões no período",
      recommendation:
        "Revisar script de abordagem e priorizar leads com score acima de 70. SDRs com taxa abaixo de 20% devem participar de treinamento.",
      evidenceLink: "/evidence?funnelStep=booked",
      severity: "medium",
    },
    {
      id: "diag-3",
      domain: "closers",
      bottleneck: "Taxa de comparecimento de 58% (meta: 75%)",
      impact: "72 reuniões perdidas por no-show",
      recommendation:
        "Implementar lembrete por WhatsApp 2h antes da reunião e confirmar presença no dia anterior.",
      evidenceLink: "/evidence?funnelStep=received",
      severity: "high",
    },
    {
      id: "diag-4",
      domain: "funnel",
      bottleneck: "Conversão de Recebidos → Fechados em 12% (meta: 20%)",
      impact: "Receita potencial perdida de R$ 180.000",
      recommendation:
        "Analisar objeções mais frequentes nos últimos 30 dias. Closers com taxa abaixo de 10% precisam de acompanhamento 1:1.",
      evidenceLink: "/evidence?funnelStep=won",
      severity: "critical",
    },
    {
      id: "diag-5",
      domain: "marketing",
      bottleneck: "CTR abaixo de 1% em campanhas de Display",
      impact: "Baixa qualidade de tráfego gerando leads desqualificados",
      recommendation:
        "Testar novos criativos com copy focada em dor do cliente. Segmentar por interesse e excluir públicos de baixo engajamento.",
      evidenceLink: "/evidence?utmMedium=display",
      severity: "low",
    },
  ];
}

export function generateAlerts(): Alert[] {
  return [
    {
      id: "alert-1",
      type: "critical",
      message:
        "Integração com Kommo CRM desconectada há 4 horas. Dados podem estar desatualizados.",
      link: "/admin/integrations",
      dismissible: false,
    },
    {
      id: "alert-2",
      type: "warning",
      message: "3 SDRs sem atividade registrada nas últimas 48h.",
      link: "/sdrs",
      dismissible: true,
    },
    {
      id: "alert-3",
      type: "info",
      message:
        "Nova meta de receita configurada para Março/2026: R$ 500.000.",
      dismissible: true,
    },
  ];
}

export function generateSetupChecklist(): SetupChecklistItem[] {
  return [
    {
      key: "connect-crm",
      label: "Conectar Kommo CRM",
      completed: true,
      route: "/admin/integrations",
    },
    {
      key: "connect-ads",
      label: "Conectar Meta Ads",
      completed: true,
      route: "/admin/integrations",
    },
    {
      key: "map-funnel",
      label: "Mapear etapas do funil",
      completed: false,
      route: "/admin/funnel-mapping",
    },
    {
      key: "add-team",
      label: "Cadastrar equipe (SDRs e Closers)",
      completed: false,
      route: "/admin/collaborators",
    },
    {
      key: "set-goals",
      label: "Definir metas do período",
      completed: false,
      route: "/admin/goals",
    },
    {
      key: "first-sync",
      label: "Realizar primeira sincronização",
      completed: true,
      route: "/admin/integrations",
    },
  ];
}

export function generateIntegrations(): Integration[] {
  return [
    {
      id: "int-1",
      name: "Kommo CRM",
      type: "crm",
      status: "connected",
      lastSync: format(subDays(new Date(), 0), "yyyy-MM-dd'T'HH:mm:ss"),
    },
    {
      id: "int-2",
      name: "Meta Ads",
      type: "ads",
      status: "connected",
      lastSync: format(subDays(new Date(), 0), "yyyy-MM-dd'T'HH:mm:ss"),
    },
    {
      id: "int-3",
      name: "Google Ads",
      type: "ads",
      status: "disconnected",
    },
  ];
}

export function generateFinancialData(): FinancialSummary {
  const contractCount = rand(15, 30);
  const contracts: FinancialContract[] = Array.from({ length: contractCount }, (_, i) => {
    const value = rand(1500, 8000);
    const statusRoll = Math.random();
    let status: FinancialContract["status"];
    if (statusRoll < 0.55) status = "signed_paid";
    else if (statusRoll < 0.85) status = "signed_unpaid";
    else status = "unsigned";

    const createdAt = format(subDays(new Date(), rand(0, 25)), "yyyy-MM-dd'T'HH:mm:ss");
    const signedAt = status !== "unsigned"
      ? format(subDays(new Date(), rand(0, 20)), "yyyy-MM-dd'T'HH:mm:ss")
      : undefined;
    const paidAt = status === "signed_paid"
      ? format(subDays(new Date(), rand(0, 15)), "yyyy-MM-dd'T'HH:mm:ss")
      : undefined;

    return {
      id: `contract-${i + 1}`,
      clientName: generateName(),
      sdr: generateName(),
      closer: generateName(),
      squad: pick(SQUADS),
      value,
      status,
      signedAt,
      paidAt,
      createdAt,
    };
  });

  const totalRevenue = contracts.reduce((s, c) => s + c.value, 0);
  const totalContracts = contracts.length;

  const signed = contracts.filter((c) => c.status !== "unsigned");
  const signedRevenue = signed.reduce((s, c) => s + c.value, 0);
  const signedContracts = signed.length;

  const paid = contracts.filter((c) => c.status === "signed_paid");
  const paidRevenue = paid.reduce((s, c) => s + c.value, 0);
  const paidContracts = paid.length;

  const unsigned = contracts.filter((c) => c.status === "unsigned");
  const signatureGap = unsigned.reduce((s, c) => s + c.value, 0);
  const signatureGapContracts = unsigned.length;

  const signedUnpaid = contracts.filter((c) => c.status === "signed_unpaid");
  const paymentGap = signedUnpaid.reduce((s, c) => s + c.value, 0);
  const paymentGapContracts = signedUnpaid.length;

  return {
    totalRevenue,
    totalContracts,
    signedRevenue,
    signedContracts,
    paidRevenue,
    paidContracts,
    signatureGap,
    signatureGapContracts,
    paymentGap,
    paymentGapContracts,
    totalGap: signatureGap + paymentGap,
    contracts,
  };
}

export function generateGoals(): Goal[] {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const period: PeriodRange = { from: monthStart, to: monthEnd };

  return [
    {
      id: "goal-1",
      type: "revenue",
      target: 500000,
      current: rand(150000, 420000),
      period,
    },
    {
      id: "goal-2",
      type: "booked",
      target: 300,
      current: rand(80, 260),
      period,
    },
  ];
}
