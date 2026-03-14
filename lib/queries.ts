"use client";

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
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
  Collaborator,
  PeriodRange,
  CursorPagination,
  FinancialSummary,
  FunnelMapping,
  LogEntry,
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
  fetchTags,
  insertTag,
  updateTag,
  deleteTag,
  fetchCollaborators,
  insertCollaborator,
  updateCollaborator,
  fetchFunnelMappings,
  upsertFunnelMappings,
  updateGoalTarget,
  upsertIndividualGoal,
  updateProfile,
  updateIntegrationStatus,
  disconnectCRM,
  fetchLogs,
  signIn,
  signOut,
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

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

interface TagAlias { id: string; name: string; alias: string }

export function useTags() {
  return useQuery<TagAlias[]>({ queryKey: ["tags"], queryFn: fetchTags });
}

export function useInsertTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tag: { name: string; alias: string }) => insertTag(tag),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: { name?: string; alias?: string } }) =>
      updateTag(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

// ---------------------------------------------------------------------------
// Collaborators
// ---------------------------------------------------------------------------

export function useCollaborators() {
  return useQuery<Collaborator[]>({ queryKey: ["collaborators"], queryFn: fetchCollaborators });
}

export function useInsertCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (collab: { name: string; email: string; role: "admin" | "viewer" }) =>
      insertCollaborator(collab),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collaborators"] }),
  });
}

export function useUpdateCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: { active?: boolean; role?: "admin" | "viewer" } }) =>
      updateCollaborator(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collaborators"] }),
  });
}

// ---------------------------------------------------------------------------
// Funnel Mappings
// ---------------------------------------------------------------------------

interface FunnelMappingRow { id: string; stepKey: string; stepLabel: string; crmField: string; crmValue: string }

export function useFunnelMappings() {
  return useQuery<FunnelMappingRow[]>({ queryKey: ["funnel-mappings"], queryFn: fetchFunnelMappings });
}

export function useUpsertFunnelMappings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mappings: FunnelMappingRow[]) => upsertFunnelMappings(mappings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funnel-mappings"] }),
  });
}

// ---------------------------------------------------------------------------
// Goals mutations
// ---------------------------------------------------------------------------

export function useUpdateGoalTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, target }: { goalId: string; target: number }) =>
      updateGoalTarget(goalId, target),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useUpsertIndividualGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { personId: string; type: string; target: number; periodStart: string; periodEnd: string }) =>
      upsertIndividualGoal(params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

// ---------------------------------------------------------------------------
// Profile mutation
// ---------------------------------------------------------------------------

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: { name?: string; email?: string; phone?: string | null } }) =>
      updateProfile(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

// ---------------------------------------------------------------------------
// Integration mutations
// ---------------------------------------------------------------------------

export function useUpdateIntegrationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "connected" | "disconnected" }) =>
      updateIntegrationStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
  });
}

// ---------------------------------------------------------------------------
// Setup mutations
// ---------------------------------------------------------------------------

export function useDisconnectCRM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => disconnectCRM(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
      qc.invalidateQueries({ queryKey: ["setup-checklist"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

export function useLogs(page: number, pageSize: number) {
  return useQuery<{ data: LogEntry[]; total: number }>({
    queryKey: ["logs", page, pageSize],
    queryFn: () => fetchLogs(page, pageSize),
  });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function useSignIn() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signIn(email, password),
  });
}

export function useSignOut() {
  return useMutation({ mutationFn: () => signOut() });
}
