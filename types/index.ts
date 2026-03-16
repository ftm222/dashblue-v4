export type KPIKey =
  | "investment"
  | "cpl"
  | "leads"
  | "booked"
  | "received"
  | "won"
  | "revenue"
  | "roas"
  | "cac"
  | "ticket"
  | "conversion_rate"
  | "show_rate";

export interface KPI {
  key: KPIKey;
  label: string;
  value: number;
  previousValue?: number;
  format: "currency" | "number" | "percent" | "ratio";
  trend?: "up" | "down" | "stable";
  trendIsPositive?: boolean;
}

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
  conversionFromPrevious?: number;
  conversionFromTop?: number;
}

export interface CallMetrics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgDurationMinutes: number;
  callsToClose: number;
  followUps: number;
  r1Calls?: number;
  r2Calls?: number;
}

export interface Person {
  id: string;
  name: string;
  avatarUrl?: string;
  role: "sdr" | "closer";
  squad?: string;
  kpis: KPI[];
  funnel?: FunnelStep[];
  callMetrics?: CallMetrics;
  salesOriginated?: number;
  contractsOriginated?: number;
}

export type CampaignLevel = "campaign" | "ad_set" | "ad";

export interface Campaign {
  id: string;
  externalId?: string | null;
  name: string;
  source: string;
  medium: string;
  investment: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpl: number;
  leads: number;
  booked: number;
  received: number;
  won: number;
  revenue: number;
  level?: CampaignLevel | null;
  parentExternalId?: string | null;
}

export interface EvidenceRecord {
  id: string;
  contactName: string;
  phone?: string;
  email?: string;
  crmUrl: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  funnelStep: string;
  sdr?: string;
  closer?: string;
  value?: number;
  createdAt: string;
  tags: string[];
  badges: ("assinado" | "pago" | "ticket_ausente")[];
}

export interface DiagnosticCard {
  id: string;
  domain: "marketing" | "sdrs" | "closers" | "funnel";
  bottleneck: string;
  impact: string;
  recommendation: string;
  evidenceLink: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface Alert {
  id: string;
  type: "warning" | "critical" | "info";
  message: string;
  link?: string;
  dismissible: boolean;
}

export interface PeriodRange {
  from: Date;
  to: Date;
  label?: string;
}

export interface CursorPagination {
  cursor?: string;
  limit: number;
  hasMore: boolean;
  total?: number;
}

export interface Integration {
  id: string;
  name: string;
  type: "crm" | "ads";
  status: "connected" | "syncing" | "disconnected" | "error";
  lastSync?: string;
}

export interface FunnelMapping {
  stepKey: string;
  stepLabel: string;
  crmField: string;
  crmValue: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager" | "viewer";
  active: boolean;
}

export interface Goal {
  id: string;
  type: "revenue" | "booked" | "leads" | "received" | "won";
  target: number;
  current: number;
  period: PeriodRange;
}

export interface SetupChecklistItem {
  key: string;
  label: string;
  completed: boolean;
  route: string;
}

export interface DataFreshnessState {
  lastSync: Date | null;
  status: "fresh" | "warning" | "critical" | "unknown";
  secondsSinceSync: number;
}

export type IndividualGoalMetric = "leads" | "booked" | "received" | "won" | "revenue";

export interface IndividualGoalConfig {
  metric: IndividualGoalMetric;
  label: string;
  format: "currency" | "number";
}

export type IndividualGoalTargets = Record<string, Record<string, number>>;

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: "owner" | "admin" | "manager" | "viewer";
  organization_id?: string | null;
  active?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  plan: "free" | "starter" | "pro" | "enterprise";
  subscription_status: "trialing" | "active" | "past_due" | "canceled" | "unpaid";
  trial_ends_at?: string | null;
  max_members: number;
  max_integrations: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_members: number;
  max_integrations: number;
  features: string[];
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  invoice_url?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  paid_at?: string | null;
  created_at: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface LogWithProfile {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  profiles: { name: string } | null;
}

export interface PersonWithSquad {
  id: string;
  name: string;
  avatar_url: string | null;
  role: "sdr" | "closer";
  squad_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  squads: { name: string } | null;
}

export interface FinancialContract {
  id: string;
  clientName: string;
  sdr: string;
  closer: string;
  squad: string;
  value: number;
  status: "signed_paid" | "signed_unpaid" | "unsigned";
  signedAt?: string;
  paidAt?: string;
  createdAt: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalContracts: number;
  signedRevenue: number;
  signedContracts: number;
  paidRevenue: number;
  paidContracts: number;
  signatureGap: number;
  signatureGapContracts: number;
  paymentGap: number;
  paymentGapContracts: number;
  totalGap: number;
  contracts: FinancialContract[];
}
