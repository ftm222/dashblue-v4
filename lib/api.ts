import { supabase } from "@/lib/supabase";
import type {
  KPI,
  KPIKey,
  FunnelStep,
  Person,
  Campaign,
  EvidenceRecord,
  DiagnosticCard,
  Alert,
  SetupChecklistItem,
  Integration,
  Goal,
  PeriodRange,
  CursorPagination,
  FinancialSummary,
  FinancialContract,
  CallMetrics,
  LogEntry,
  LogWithProfile,
  PersonWithSquad,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoDate(d: Date): string {
  return d.toISOString();
}

function prevPeriod(period: PeriodRange): PeriodRange {
  const durationMs = period.to.getTime() - period.from.getTime();
  return {
    from: new Date(period.from.getTime() - durationMs),
    to: new Date(period.from.getTime() - 1),
  };
}

function trend(current: number, previous: number): "up" | "down" | "stable" {
  if (previous === 0) return current > 0 ? "up" : "stable";
  const diff = ((current - previous) / previous) * 100;
  if (diff > 2) return "up";
  if (diff < -2) return "down";
  return "stable";
}

function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

// ---------------------------------------------------------------------------
// fetchKPIs — Overview / Marketing / SDR / Closer
// ---------------------------------------------------------------------------

interface EvidenceAgg {
  leads: number;
  booked: number;
  received: number;
  won: number;
  revenue: number;
}

async function aggregateEvidence(period: PeriodRange): Promise<EvidenceAgg> {
  const { data } = await supabase
    .from("evidence")
    .select("funnel_step, value")
    .gte("created_at", isoDate(period.from))
    .lte("created_at", isoDate(period.to));

  const rows = data ?? [];
  const counts: Record<string, number> = {};
  let revenue = 0;

  for (const r of rows) {
    counts[r.funnel_step] = (counts[r.funnel_step] || 0) + 1;
    if (r.funnel_step === "won") revenue += r.value ?? 0;
  }

  return {
    leads: counts["leads"] || 0,
    booked: counts["booked"] || 0,
    received: counts["received"] || 0,
    won: counts["won"] || 0,
    revenue,
  };
}

async function aggregateCampaigns(period: PeriodRange) {
  const { data } = await supabase
    .from("campaigns")
    .select("investment, leads, booked, received, won, revenue")
    .gte("period_start", period.from.toISOString().slice(0, 10))
    .lte("period_end", period.to.toISOString().slice(0, 10));

  const rows = data ?? [];
  return {
    investment: rows.reduce((s, r) => s + r.investment, 0),
    leads: rows.reduce((s, r) => s + r.leads, 0),
    booked: rows.reduce((s, r) => s + r.booked, 0),
    received: rows.reduce((s, r) => s + r.received, 0),
    won: rows.reduce((s, r) => s + r.won, 0),
    revenue: rows.reduce((s, r) => s + r.revenue, 0),
  };
}

function buildKPIs(
  ev: EvidenceAgg,
  camp: { investment: number; leads: number; booked: number; received: number; won: number; revenue: number },
  prevEv: EvidenceAgg,
  prevCamp: typeof camp,
  keys: KPIKey[],
): KPI[] {
  const investment = camp.investment;
  const leads = ev.leads || camp.leads;
  const booked = ev.booked || camp.booked;
  const received = ev.received || camp.received;
  const won = ev.won || camp.won;
  const revenue = ev.revenue || camp.revenue;

  const pInvestment = prevCamp.investment;
  const pLeads = prevEv.leads || prevCamp.leads;
  const pBooked = prevEv.booked || prevCamp.booked;
  const pReceived = prevEv.received || prevCamp.received;
  const pWon = prevEv.won || prevCamp.won;
  const pRevenue = prevEv.revenue || prevCamp.revenue;

  const cpl = safeDiv(investment, leads);
  const roas = safeDiv(revenue, investment);
  const cac = safeDiv(investment, won);
  const ticket = safeDiv(revenue, won);
  const conversionRate = safeDiv(won, leads) * 100;
  const showRate = safeDiv(received, booked) * 100;

  const pCpl = safeDiv(pInvestment, pLeads);
  const pRoas = safeDiv(pRevenue, pInvestment);
  const pCac = safeDiv(pInvestment, pWon);
  const pTicket = safeDiv(pRevenue, pWon);
  const pConversionRate = safeDiv(pWon, pLeads) * 100;
  const pShowRate = safeDiv(pReceived, pBooked) * 100;

  const all: KPI[] = [
    { key: "investment", label: "Investimento", value: round2(investment), previousValue: round2(pInvestment), format: "currency", trend: trend(investment, pInvestment), trendIsPositive: false },
    { key: "cpl", label: "CPL", value: round2(cpl), previousValue: round2(pCpl), format: "currency", trend: trend(cpl, pCpl), trendIsPositive: false },
    { key: "leads", label: "Leads", value: leads, previousValue: pLeads, format: "number", trend: trend(leads, pLeads), trendIsPositive: true },
    { key: "booked", label: "Agendados", value: booked, previousValue: pBooked, format: "number", trend: trend(booked, pBooked), trendIsPositive: true },
    { key: "received", label: "Recebidos", value: received, previousValue: pReceived, format: "number", trend: trend(received, pReceived), trendIsPositive: true },
    { key: "won", label: "Fechados", value: won, previousValue: pWon, format: "number", trend: trend(won, pWon), trendIsPositive: true },
    { key: "revenue", label: "Receita", value: round2(revenue), previousValue: round2(pRevenue), format: "currency", trend: trend(revenue, pRevenue), trendIsPositive: true },
    { key: "roas", label: "ROAS", value: round2(roas), previousValue: round2(pRoas), format: "ratio", trend: trend(roas, pRoas), trendIsPositive: true },
    { key: "cac", label: "CAC", value: round2(cac), previousValue: round2(pCac), format: "currency", trend: trend(cac, pCac), trendIsPositive: false },
    { key: "ticket", label: "Ticket Médio", value: round2(ticket), previousValue: round2(pTicket), format: "currency", trend: trend(ticket, pTicket), trendIsPositive: true },
    { key: "conversion_rate", label: "Taxa de Conversão", value: round2(conversionRate), previousValue: round2(pConversionRate), format: "percent", trend: trend(conversionRate, pConversionRate), trendIsPositive: true },
    { key: "show_rate", label: "Taxa de Comparecimento", value: round2(showRate), previousValue: round2(pShowRate), format: "percent", trend: trend(showRate, pShowRate), trendIsPositive: true },
  ];

  return all.filter((k) => keys.includes(k.key));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const ROLE_KEYS: Record<string, KPIKey[]> = {
  overview: ["investment", "leads", "booked", "received", "won", "revenue", "roas", "cac", "ticket", "conversion_rate", "show_rate"],
  marketing: ["investment", "cpl", "cac", "leads", "booked", "roas"],
  sdr: ["leads", "booked", "show_rate", "cpl"],
  closer: ["received", "won", "revenue", "ticket", "conversion_rate"],
};

export async function fetchKPIs(
  period: PeriodRange,
  entity?: { role: "overview" | "marketing" | "sdr" | "closer" },
): Promise<KPI[]> {
  const role = entity?.role ?? "overview";
  const prev = prevPeriod(period);

  const [ev, camp, prevEv, prevCamp] = await Promise.all([
    aggregateEvidence(period),
    aggregateCampaigns(period),
    aggregateEvidence(prev),
    aggregateCampaigns(prev),
  ]);

  return buildKPIs(ev, camp, prevEv, prevCamp, ROLE_KEYS[role] ?? ROLE_KEYS.overview);
}

// ---------------------------------------------------------------------------
// fetchFunnel
// ---------------------------------------------------------------------------

const FUNNEL_ORDER = ["leads", "booked", "received", "negotiation", "won"];
const FUNNEL_LABELS: Record<string, string> = {
  leads: "Leads",
  booked: "Agendados",
  received: "Recebidos",
  negotiation: "Negociação",
  won: "Fechados",
};

export async function fetchFunnel(
  period: PeriodRange,
  entity?: { personId?: string },
): Promise<FunnelStep[]> {
  let query = supabase
    .from("evidence")
    .select("*")
    .gte("created_at", isoDate(period.from))
    .lte("created_at", isoDate(period.to));

  if (entity?.personId) {
    query = query.or(`sdr_id.eq.${entity.personId},closer_id.eq.${entity.personId}`);
  }

  const { data } = await query;
  const rows = data ?? [];

  const countsMap: Record<string, number> = {};
  for (const row of rows) {
    countsMap[row.funnel_step] = (countsMap[row.funnel_step] ?? 0) + 1;
  }

  const { data: mappings } = await supabase
    .from("funnel_mappings")
    .select("*")
    .order("sort_order");

  const steps = (mappings ?? []).length > 0
    ? (mappings ?? []).sort((a, b) => a.sort_order - b.sort_order)
    : FUNNEL_ORDER.map((key, i) => ({ step_key: key, step_label: FUNNEL_LABELS[key] ?? key, sort_order: i }));

  const counts = steps.map((s) => countsMap[s.step_key] ?? 0);
  const topCount = counts[0] || 0;

  return steps.map((s, i) => ({
    key: s.step_key,
    label: s.step_label,
    count: counts[i],
    conversionFromPrevious: i === 0 ? undefined : round2(safeDiv(counts[i], counts[i - 1]) * 100),
    conversionFromTop: i === 0 ? undefined : round2(safeDiv(counts[i], topCount) * 100),
  }));
}

// ---------------------------------------------------------------------------
// fetchPeople — SDRs e Closers com KPIs, funnel e callMetrics embutidos
// ---------------------------------------------------------------------------

export async function fetchPeople(
  role: "sdr" | "closer",
  period: PeriodRange,
): Promise<Person[]> {
  const { data: people } = await supabase
    .from("people")
    .select("*, squads(name)")
    .eq("role", role)
    .eq("active", true);

  if (!people || people.length === 0) return [];

  const personIds = people.map((p) => p.id);
  const idCol = role === "sdr" ? "sdr_id" : "closer_id";

  const { data: evidence } = await supabase
    .from("evidence")
    .select("*")
    .in(idCol, personIds)
    .gte("created_at", isoDate(period.from))
    .lte("created_at", isoDate(period.to));

  const { data: callLogs } = await supabase
    .from("call_logs")
    .select("*")
    .in("person_id", personIds)
    .gte("called_at", isoDate(period.from))
    .lte("called_at", isoDate(period.to));

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .in(idCol, personIds)
    .gte("created_at", isoDate(period.from))
    .lte("created_at", isoDate(period.to));

  const evRows = evidence ?? [];
  const clRows = callLogs ?? [];
  const ctRows = contracts ?? [];

  return people.map((p) => {
    const myEvidence = evRows.filter((e) =>
      role === "sdr" ? e.sdr_id === p.id : e.closer_id === p.id,
    );

    const leads = myEvidence.filter((e) => e.funnel_step === "leads").length;
    const booked = myEvidence.filter((e) => e.funnel_step === "booked").length;
    const received = myEvidence.filter((e) => e.funnel_step === "received").length;
    const won = myEvidence.filter((e) => e.funnel_step === "won").length;
    const revenue = myEvidence
      .filter((e) => e.funnel_step === "won")
      .reduce((s, e) => s + (e.value ?? 0), 0);
    const showRate = round2(safeDiv(received, booked) * 100);
    const conversionRate = round2(safeDiv(won, leads) * 100);
    const ticket = round2(safeDiv(revenue, won));
    const cpl = 0;

    const kpiKeys = role === "sdr"
      ? (["leads", "booked", "show_rate", "cpl"] as KPIKey[])
      : (["received", "won", "revenue", "ticket", "conversion_rate"] as KPIKey[]);

    const kpiValues: Record<KPIKey, { value: number; format: KPI["format"]; label: string }> = {
      investment: { value: 0, format: "currency", label: "Investimento" },
      cpl: { value: cpl, format: "currency", label: "CPL" },
      leads: { value: leads, format: "number", label: "Leads" },
      booked: { value: booked, format: "number", label: "Agendados" },
      received: { value: received, format: "number", label: "Recebidos" },
      won: { value: won, format: "number", label: "Fechados" },
      revenue: { value: revenue, format: "currency", label: "Receita" },
      roas: { value: 0, format: "ratio", label: "ROAS" },
      cac: { value: 0, format: "currency", label: "CAC" },
      ticket: { value: ticket, format: "currency", label: "Ticket Médio" },
      conversion_rate: { value: conversionRate, format: "percent", label: "Taxa de Conversão" },
      show_rate: { value: showRate, format: "percent", label: "Taxa de Comparecimento" },
    };

    const kpis: KPI[] = kpiKeys.map((key) => ({
      key,
      label: kpiValues[key].label,
      value: kpiValues[key].value,
      format: kpiValues[key].format,
      trend: "stable" as const,
      trendIsPositive: true,
    }));

    const funnelSteps = role === "sdr"
      ? ["leads", "booked", "received"]
      : ["received", "negotiation", "won"];
    const funnelCounts: Record<string, number> = {};
    for (const e of myEvidence) {
      funnelCounts[e.funnel_step] = (funnelCounts[e.funnel_step] ?? 0) + 1;
    }
    const funnel: FunnelStep[] = funnelSteps.map((key, i) => {
      const count = funnelCounts[key] ?? 0;
      const prevCount = i > 0 ? (funnelCounts[funnelSteps[i - 1]] ?? 0) : 0;
      return {
        key,
        label: FUNNEL_LABELS[key] ?? key,
        count,
        conversionFromPrevious: i === 0 ? undefined : round2(safeDiv(count, prevCount) * 100),
        conversionFromTop: undefined,
      };
    });

    const myCalls = clRows.filter((c) => c.person_id === p.id);
    const totalCalls = myCalls.length;
    const answeredCalls = myCalls.filter((c) => c.answered).length;
    const missedCalls = totalCalls - answeredCalls;
    const durations = myCalls.filter((c) => c.answered && c.duration_seconds > 0);
    const avgDurationMinutes = round2(
      safeDiv(durations.reduce((s, c) => s + c.duration_seconds, 0), durations.length) / 60,
    );
    const r1Calls = myCalls.filter((c) => c.call_type === "r1").length;
    const r2Calls = myCalls.filter((c) => c.call_type === "r2").length;
    const followUps = myCalls.filter((c) => c.call_type === "follow_up").length;
    const callsToClose = round2(safeDiv(totalCalls, won));

    const callMetrics: CallMetrics = {
      totalCalls,
      answeredCalls,
      missedCalls,
      avgDurationMinutes,
      callsToClose,
      followUps,
      r1Calls,
      r2Calls,
    };

    const myContracts = ctRows.filter((c) =>
      role === "sdr" ? c.sdr_id === p.id : c.closer_id === p.id,
    );
    const salesOriginated = myContracts.reduce((s, c) => s + (c.value ?? 0), 0);
    const contractsOriginated = myContracts.length;

    const typed = p as unknown as PersonWithSquad;
    const squadData = typed.squads;

    return {
      id: p.id,
      name: p.name,
      avatarUrl: p.avatar_url ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(p.name)}`,
      role: p.role as "sdr" | "closer",
      squad: squadData?.name,
      kpis,
      funnel,
      callMetrics,
      salesOriginated,
      contractsOriginated,
    };
  });
}

// ---------------------------------------------------------------------------
// fetchCampaigns
// ---------------------------------------------------------------------------

export async function fetchCampaigns(
  period: PeriodRange,
): Promise<Campaign[]> {
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .gte("period_start", period.from.toISOString().slice(0, 10))
    .lte("period_end", period.to.toISOString().slice(0, 10))
    .order("created_at", { ascending: false });

  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    source: c.source ?? "",
    medium: c.medium ?? "",
    investment: c.investment,
    impressions: c.impressions,
    clicks: c.clicks,
    ctr: round2(safeDiv(c.clicks, c.impressions) * 100),
    cpc: round2(safeDiv(c.investment, c.clicks)),
    cpl: round2(safeDiv(c.investment, c.leads)),
    leads: c.leads,
    booked: c.booked,
    received: c.received,
    won: c.won,
    revenue: c.revenue,
  }));
}

// ---------------------------------------------------------------------------
// fetchEvidence — paginação por cursor (offset)
// ---------------------------------------------------------------------------

const PAGE_SIZE = 25;

export async function fetchEvidence(
  filters: Record<string, string>,
  cursor?: string,
): Promise<{ data: EvidenceRecord[]; pagination: CursorPagination }> {
  const offset = cursor ? parseInt(cursor, 10) : 0;

  let query = supabase
    .from("evidence")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (filters.funnelStep) query = query.eq("funnel_step", filters.funnelStep);
  if (filters.utmSource) query = query.eq("utm_source", filters.utmSource);
  if (filters.utmMedium) query = query.eq("utm_medium", filters.utmMedium);
  if (filters.utmCampaign) query = query.eq("utm_campaign", filters.utmCampaign);
  if (filters.search) {
    const sanitized = filters.search.replace(/[%_\\]/g, "\\$&");
    query = query.ilike("contact_name", `%${sanitized}%`);
  }

  const { data, count } = await query;
  const total = count ?? 0;
  const rows = data ?? [];
  const nextOffset = offset + PAGE_SIZE;

  const sdrIds = [...new Set(rows.map((r) => r.sdr_id).filter(Boolean))] as string[];
  const closerIds = [...new Set(rows.map((r) => r.closer_id).filter(Boolean))] as string[];
  const allPeopleIds = [...new Set([...sdrIds, ...closerIds])];

  let peopleMap: Record<string, string> = {};
  if (allPeopleIds.length > 0) {
    const { data: peopleData } = await supabase
      .from("people")
      .select("id, name")
      .in("id", allPeopleIds);
    for (const p of peopleData ?? []) {
      peopleMap[p.id] = p.name;
    }
  }

  return {
    data: rows.map((r) => ({
      id: r.id,
      contactName: r.contact_name,
      phone: r.phone ?? undefined,
      email: r.email ?? undefined,
      crmUrl: r.crm_url ?? "",
      utmSource: r.utm_source ?? undefined,
      utmMedium: r.utm_medium ?? undefined,
      utmCampaign: r.utm_campaign ?? undefined,
      funnelStep: r.funnel_step,
      sdr: r.sdr_id ? peopleMap[r.sdr_id] : undefined,
      closer: r.closer_id ? peopleMap[r.closer_id] : undefined,
      value: r.value > 0 ? r.value : undefined,
      createdAt: r.created_at,
      tags: r.tags ?? [],
      badges: (r.badges ?? []) as ("assinado" | "pago" | "ticket_ausente")[],
    })),
    pagination: {
      cursor: nextOffset < total ? String(nextOffset) : undefined,
      limit: PAGE_SIZE,
      hasMore: nextOffset < total,
      total,
    },
  };
}

// ---------------------------------------------------------------------------
// fetchDiagnostics — mantém geração baseada em dados reais futuramente
// ---------------------------------------------------------------------------

import { generateDiagnostics } from "@/lib/mock-data";

export async function fetchDiagnostics(
  _period: PeriodRange,
): Promise<DiagnosticCard[]> {
  return generateDiagnostics();
}

// ---------------------------------------------------------------------------
// fetchAlerts
// ---------------------------------------------------------------------------

export async function fetchAlerts(): Promise<Alert[]> {
  const { data } = await supabase
    .from("alerts")
    .select("*")
    .or("expires_at.is.null,expires_at.gt.now()")
    .order("created_at", { ascending: false });

  return (data ?? []).map((a) => ({
    id: a.id,
    type: a.type as Alert["type"],
    message: a.message,
    link: a.link ?? undefined,
    dismissible: a.dismissible,
  }));
}

// ---------------------------------------------------------------------------
// fetchSetupChecklist
// ---------------------------------------------------------------------------

export async function fetchSetupChecklist(): Promise<SetupChecklistItem[]> {
  const { data } = await supabase
    .from("setup_checklist")
    .select("*")
    .order("key");

  return (data ?? []).map((item) => ({
    key: item.key,
    label: item.label,
    completed: item.completed,
    route: item.route,
  }));
}

// ---------------------------------------------------------------------------
// fetchIntegrations
// ---------------------------------------------------------------------------

export async function fetchIntegrations(): Promise<Integration[]> {
  const { data } = await supabase
    .from("integrations")
    .select("*")
    .order("name");

  return (data ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    type: i.type as Integration["type"],
    status: i.status as Integration["status"],
    lastSync: i.last_sync ?? undefined,
  }));
}

// ---------------------------------------------------------------------------
// fetchGoals — target do banco, current calculado de evidence/contracts
// ---------------------------------------------------------------------------

export async function fetchGoals(
  period: PeriodRange,
): Promise<Goal[]> {
  const periodStart = period.from.toISOString().slice(0, 10);
  const periodEnd = period.to.toISOString().slice(0, 10);

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .is("person_id", null)
    .lte("period_start", periodEnd)
    .gte("period_end", periodStart);

  if (!goals || goals.length === 0) return [];

  const ev = await aggregateEvidence(period);
  const { data: paidContracts } = await supabase
    .from("contracts")
    .select("*")
    .eq("status", "signed_paid")
    .gte("created_at", isoDate(period.from))
    .lte("created_at", isoDate(period.to));

  const paidRevenue = (paidContracts ?? []).reduce((s, c) => s + (c.value ?? 0), 0);

  const currentValues: Record<string, number> = {
    revenue: paidRevenue || ev.revenue,
    booked: ev.booked,
    leads: ev.leads,
    received: ev.received,
    won: ev.won,
  };

  return goals.map((g) => ({
    id: g.id,
    type: g.type as "revenue" | "booked",
    target: g.target,
    current: currentValues[g.type] ?? 0,
    period: {
      from: new Date(g.period_start),
      to: new Date(g.period_end),
    },
  }));
}

// ---------------------------------------------------------------------------
// MUTATIONS — Tags
// ---------------------------------------------------------------------------

export async function fetchTags() {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id,
    name: t.original,
    alias: t.alias,
  }));
}

export async function insertTag(tag: { name: string; alias: string }) {
  const { data, error } = await supabase
    .from("tags")
    .insert({ original: tag.name, alias: tag.alias })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, name: data.original, alias: data.alias };
}

export async function updateTag(id: string, fields: { name?: string; alias?: string }) {
  const update: Record<string, string> = {};
  if (fields.name !== undefined) update.original = fields.name;
  if (fields.alias !== undefined) update.alias = fields.alias;
  const { error } = await supabase.from("tags").update(update).eq("id", id);
  if (error) throw error;
}

export async function deleteTag(id: string) {
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// MUTATIONS — Collaborators (profiles)
// ---------------------------------------------------------------------------

export async function fetchCollaborators() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role as "admin" | "viewer",
    active: p.active,
  }));
}

export async function insertCollaborator(collab: { name: string; email: string; role: "admin" | "viewer" }) {
  const res = await fetch("/api/auth/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: collab.name, email: collab.email, role: collab.role }),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || "Falha ao convidar colaborador.");
  }

  return {
    id: body.user.id as string,
    name: collab.name,
    email: collab.email,
    role: collab.role,
    active: true,
  };
}

export async function updateCollaborator(id: string, fields: { active?: boolean; role?: "admin" | "viewer" }) {
  const { error } = await supabase.from("profiles").update(fields).eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// MUTATIONS — Funnel Mappings
// ---------------------------------------------------------------------------

export async function fetchFunnelMappings() {
  const { data, error } = await supabase
    .from("funnel_mappings")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id,
    stepKey: m.step_key,
    stepLabel: m.step_label,
    crmField: m.crm_field ?? "",
    crmValue: m.crm_value ?? "",
  }));
}

export async function upsertFunnelMappings(
  mappings: { id: string; stepKey: string; stepLabel: string; crmField: string; crmValue: string }[],
) {
  const rows = mappings.map((m) => ({
    id: m.id,
    step_key: m.stepKey,
    step_label: m.stepLabel,
    crm_field: m.crmField,
    crm_value: m.crmValue,
  }));
  const { error } = await supabase.from("funnel_mappings").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// MUTATIONS — Goals
// ---------------------------------------------------------------------------

export async function updateGoalTarget(goalId: string, target: number) {
  const { error } = await supabase.from("goals").update({ target }).eq("id", goalId);
  if (error) throw error;
}

export async function upsertIndividualGoal(params: {
  personId: string;
  type: string;
  target: number;
  periodStart: string;
  periodEnd: string;
}) {
  const { data: existing } = await supabase
    .from("goals")
    .select("id")
    .eq("person_id", params.personId)
    .eq("type", params.type)
    .eq("period_start", params.periodStart)
    .eq("period_end", params.periodEnd)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("goals")
      .update({ target: params.target })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("goals").insert({
      person_id: params.personId,
      type: params.type as "revenue" | "booked" | "leads" | "received" | "won",
      target: params.target,
      period_start: params.periodStart,
      period_end: params.periodEnd,
    });
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// MUTATIONS — Profile
// ---------------------------------------------------------------------------

export async function updateProfile(id: string, fields: { name?: string; email?: string; phone?: string | null }) {
  const { error } = await supabase.from("profiles").update(fields).eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// MUTATIONS — Integrations
// ---------------------------------------------------------------------------

export async function updateIntegrationStatus(id: string, status: "connected" | "disconnected") {
  const update: Record<string, unknown> = { status };
  if (status === "disconnected") {
    update.last_sync = null;
  }
  const { error } = await supabase.from("integrations").update(update).eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// MUTATIONS — Setup (reset checklist + disconnect CRM)
// ---------------------------------------------------------------------------

export async function resetSetupChecklist() {
  const { error } = await supabase
    .from("setup_checklist")
    .update({ completed: false })
    .neq("key", "");
  if (error) throw error;
}

export async function disconnectCRM() {
  const { error } = await supabase
    .from("integrations")
    .update({ status: "disconnected", last_sync: null })
    .eq("type", "crm");
  if (error) throw error;
  await resetSetupChecklist();
}

// ---------------------------------------------------------------------------
// fetchLogs — substituir mock por Supabase
// ---------------------------------------------------------------------------

export async function fetchLogs(page: number, pageSize: number): Promise<{ data: LogEntry[]; total: number }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from("logs")
    .select("*, profiles:user_id(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data ?? []).map((log) => {
      const typed = log as unknown as LogWithProfile;
      return {
        id: typed.id,
        timestamp: typed.created_at,
        user: typed.profiles?.name ?? "Sistema",
        action: typed.action,
        details: (typed.details?.message as string) ?? typed.action,
      };
    }),
    total: count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Auth — Login
// ---------------------------------------------------------------------------

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

// ---------------------------------------------------------------------------
// fetchFinancialData
// ---------------------------------------------------------------------------

export async function fetchFinancialData(): Promise<FinancialSummary> {
  const { data } = await supabase
    .from("contracts")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  const sdrIds = [...new Set(rows.map((r) => r.sdr_id).filter(Boolean))] as string[];
  const closerIds = [...new Set(rows.map((r) => r.closer_id).filter(Boolean))] as string[];
  const squadIds = [...new Set(rows.map((r) => r.squad_id).filter(Boolean))] as string[];

  let nameMap: Record<string, string> = {};
  const allPIds = [...new Set([...sdrIds, ...closerIds])];
  if (allPIds.length > 0) {
    const { data: pd } = await supabase.from("people").select("id, name").in("id", allPIds);
    for (const p of pd ?? []) nameMap[p.id] = p.name;
  }

  let squadMap: Record<string, string> = {};
  if (squadIds.length > 0) {
    const { data: sd } = await supabase.from("squads").select("id, name").in("id", squadIds);
    for (const s of sd ?? []) squadMap[s.id] = s.name;
  }

  const contracts: FinancialContract[] = rows.map((c) => ({
    id: c.id,
    clientName: c.client_name,
    sdr: c.sdr_id ? nameMap[c.sdr_id] ?? "—" : "—",
    closer: c.closer_id ? nameMap[c.closer_id] ?? "—" : "—",
    squad: c.squad_id ? squadMap[c.squad_id] ?? "—" : "—",
    value: c.value,
    status: c.status as FinancialContract["status"],
    signedAt: c.signed_at ?? undefined,
    paidAt: c.paid_at ?? undefined,
    createdAt: c.created_at,
  }));

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
