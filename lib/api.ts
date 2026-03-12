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
  PeriodRange,
  CursorPagination,
  FinancialSummary,
} from "@/types";
import {
  generateKPIs,
  generateFunnelSteps,
  generatePeople,
  generateCampaigns,
  generateEvidence,
  generateDiagnostics,
  generateAlerts,
  generateSetupChecklist,
  generateIntegrations,
  generateGoals,
  generateFinancialData,
} from "@/lib/mock-data";

const SIMULATED_LATENCY = 60;

function delay(): Promise<void> {
  if (SIMULATED_LATENCY <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY));
}

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 10_000;

function cached<T>(key: string, factory: () => T): T {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
  const data = factory();
  cache.set(key, { data, ts: Date.now() });
  return data;
}

export async function fetchKPIs(
  _period: PeriodRange,
  entity?: { role: "overview" | "marketing" | "sdr" | "closer" }
): Promise<KPI[]> {
  await delay();
  const role = entity?.role ?? "overview";
  return cached(`kpis:${role}`, () => generateKPIs(role));
}

export async function fetchFunnel(
  _period: PeriodRange,
  _entity?: { personId?: string }
): Promise<FunnelStep[]> {
  await delay();
  const key = `funnel:${_entity?.personId ?? "all"}`;
  return cached(key, () => generateFunnelSteps());
}

export async function fetchPeople(
  role: "sdr" | "closer",
  _period: PeriodRange
): Promise<Person[]> {
  await delay();
  return cached(`people:${role}`, () => generatePeople(role, role === "sdr" ? 6 : 4));
}

export async function fetchCampaigns(
  _period: PeriodRange
): Promise<Campaign[]> {
  await delay();
  return cached("campaigns", () => generateCampaigns(10));
}

export async function fetchEvidence(
  _filters: Record<string, string>,
  cursor?: string
): Promise<{ data: EvidenceRecord[]; pagination: CursorPagination }> {
  await delay();
  return generateEvidence(25, cursor);
}

export async function fetchDiagnostics(
  _period: PeriodRange
): Promise<DiagnosticCard[]> {
  await delay();
  return cached("diagnostics", generateDiagnostics);
}

export async function fetchAlerts(): Promise<Alert[]> {
  await delay();
  return cached("alerts", generateAlerts);
}

export async function fetchSetupChecklist(): Promise<SetupChecklistItem[]> {
  await delay();
  return cached("setupChecklist", generateSetupChecklist);
}

export async function fetchIntegrations(): Promise<Integration[]> {
  await delay();
  return cached("integrations", generateIntegrations);
}

export async function fetchGoals(
  _period: PeriodRange
): Promise<Goal[]> {
  await delay();
  return cached("goals", generateGoals);
}

export async function fetchFinancialData(): Promise<FinancialSummary> {
  await delay();
  return cached("financial", generateFinancialData);
}
