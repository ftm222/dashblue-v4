"use client";

import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  type UseQueryOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
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
  fetchKPIs,
  fetchFunnel,
  fetchPeople,
  fetchCampaigns,
  fetchEvidence,
  fetchDiagnostics,
  fetchAlerts,
  fetchSetupChecklist,
  fetchIntegrations,
  fetchGoals,
  fetchFinancialData,
} from "@/lib/api";

function periodKey(period: PeriodRange) {
  return `${period.from.toISOString()}_${period.to.toISOString()}`;
}

export function useKPIs(
  period: PeriodRange,
  entity?: { role: "overview" | "marketing" | "sdr" | "closer" },
  options?: Partial<UseQueryOptions<KPI[]>>
) {
  return useQuery<KPI[]>({
    queryKey: ["kpis", periodKey(period), entity?.role ?? "overview"],
    queryFn: () => fetchKPIs(period, entity),
    ...options,
  });
}

export function useFunnel(
  period: PeriodRange,
  entity?: { personId?: string },
  options?: Partial<UseQueryOptions<FunnelStep[]>>
) {
  return useQuery<FunnelStep[]>({
    queryKey: ["funnel", periodKey(period), entity?.personId ?? "all"],
    queryFn: () => fetchFunnel(period, entity),
    ...options,
  });
}

export function usePeople(
  role: "sdr" | "closer",
  period: PeriodRange,
  options?: Partial<UseQueryOptions<Person[]>>
) {
  return useQuery<Person[]>({
    queryKey: ["people", role, periodKey(period)],
    queryFn: () => fetchPeople(role, period),
    ...options,
  });
}

export function useCampaigns(
  period: PeriodRange,
  options?: Partial<UseQueryOptions<Campaign[]>>
) {
  return useQuery<Campaign[]>({
    queryKey: ["campaigns", periodKey(period)],
    queryFn: () => fetchCampaigns(period),
    ...options,
  });
}

export function useEvidence(
  filters: Record<string, string> = {},
  enabled = true,
) {
  const filterKey = JSON.stringify(filters);

  return useInfiniteQuery<{
    data: EvidenceRecord[];
    pagination: CursorPagination;
  }>({
    queryKey: ["evidence", filterKey],
    queryFn: ({ pageParam }) =>
      fetchEvidence(filters, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.cursor : undefined,
    enabled,
  });
}

export function useDiagnostics(
  period: PeriodRange,
  options?: Partial<UseQueryOptions<DiagnosticCard[]>>
) {
  return useQuery<DiagnosticCard[]>({
    queryKey: ["diagnostics", periodKey(period)],
    queryFn: () => fetchDiagnostics(period),
    ...options,
  });
}

export function useAlerts(
  options?: Partial<UseQueryOptions<Alert[]>>
) {
  return useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    ...options,
  });
}

export function useSetupChecklist(
  options?: Partial<UseQueryOptions<SetupChecklistItem[]>>
) {
  return useQuery<SetupChecklistItem[]>({
    queryKey: ["setup-checklist"],
    queryFn: fetchSetupChecklist,
    ...options,
  });
}

export function useIntegrations(
  options?: Partial<UseQueryOptions<Integration[]>>
) {
  return useQuery<Integration[]>({
    queryKey: ["integrations"],
    queryFn: fetchIntegrations,
    ...options,
  });
}

export function useGoals(
  period: PeriodRange,
  options?: Partial<UseQueryOptions<Goal[]>>
) {
  return useQuery<Goal[]>({
    queryKey: ["goals", periodKey(period)],
    queryFn: () => fetchGoals(period),
    ...options,
  });
}

export function prefetchDashboardData(qc: QueryClient, period: PeriodRange) {
  const pk = periodKey(period);
  qc.prefetchQuery({ queryKey: ["kpis", pk, "overview"], queryFn: () => fetchKPIs(period, { role: "overview" }) });
  qc.prefetchQuery({ queryKey: ["funnel", pk, "all"], queryFn: () => fetchFunnel(period) });
  qc.prefetchQuery({ queryKey: ["people", "sdr", pk], queryFn: () => fetchPeople("sdr", period) });
  qc.prefetchQuery({ queryKey: ["people", "closer", pk], queryFn: () => fetchPeople("closer", period) });
  qc.prefetchQuery({ queryKey: ["alerts"], queryFn: fetchAlerts });
}

export function useFinancialData(
  options?: Partial<UseQueryOptions<FinancialSummary>>
) {
  return useQuery<FinancialSummary>({
    queryKey: ["financial"],
    queryFn: fetchFinancialData,
    ...options,
  });
}

export function usePrefetch() {
  const qc = useQueryClient();

  const prefetchPeople = useCallback(
    (role: "sdr" | "closer", period: PeriodRange) => {
      const pk = periodKey(period);
      qc.prefetchQuery({ queryKey: ["people", role, pk], queryFn: () => fetchPeople(role, period) });
      qc.prefetchQuery({ queryKey: ["funnel", pk, "all"], queryFn: () => fetchFunnel(period) });
    },
    [qc],
  );

  const prefetchCampaigns = useCallback(
    (period: PeriodRange) => {
      const pk = periodKey(period);
      qc.prefetchQuery({ queryKey: ["campaigns", pk], queryFn: () => fetchCampaigns(period) });
      qc.prefetchQuery({ queryKey: ["kpis", pk, "marketing"], queryFn: () => fetchKPIs(period, { role: "marketing" }) });
    },
    [qc],
  );

  return { prefetchPeople, prefetchCampaigns };
}
