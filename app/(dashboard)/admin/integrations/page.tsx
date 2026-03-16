"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Clock,
  Key,
  Plus,
  HelpCircle,
  Trash2,
} from "lucide-react";
import { useIntegrations, useUpdateIntegrationStatus, useResetIntegrationSync, useCreateIntegration, useDeleteIntegration } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Integration } from "@/types";

type CRMProvider = "kommo" | "hubspot" | "pipedrive" | "generic" | "asaas";

type TokenDialogState = {
  integration: Integration;
  provider: CRMProvider | "meta";
} | null;

const STATUS_CONFIG = {
  connected: { label: "Conectado", icon: CheckCircle2, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent" },
  disconnected: { label: "Desconectado", icon: Unlink, className: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-transparent" },
  error: { label: "Erro", icon: AlertCircle, className: "bg-red-500/15 text-red-700 dark:text-red-400 border-transparent" },
  syncing: { label: "Sincronizando", icon: RefreshCw, className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-transparent" },
} as const;

const PROVIDER_MAP: Record<string, { provider: string; logo: string }> = {
  "Kommo CRM": { provider: "kommo", logo: "K" },
  "Kommo": { provider: "kommo", logo: "K" },
  "HubSpot": { provider: "hubspot", logo: "H" },
  "Pipedrive": { provider: "pipedrive", logo: "P" },
  "Asaas": { provider: "asaas", logo: "A" },
  "Meta Ads": { provider: "meta", logo: "M" },
  "Meta": { provider: "meta", logo: "M" },
};

const PROVIDER_COLORS: Record<string, string> = {
  kommo: "bg-blue-600",
  hubspot: "bg-orange-500",
  pipedrive: "bg-green-600",
  asaas: "bg-emerald-600",
  meta: "bg-indigo-600",
  generic: "bg-slate-600",
  default: "bg-slate-600",
};

function getProvider(name: string) {
  for (const [key, val] of Object.entries(PROVIDER_MAP)) {
    if (name.toLowerCase().includes(key.toLowerCase()) || name.toLowerCase().includes(val.provider)) {
      return val;
    }
  }
  if (name.toLowerCase().includes("asaas")) return { provider: "asaas", logo: "A" };
  if (name.toLowerCase().includes("meta") || name.toLowerCase().includes("facebook")) return { provider: "meta", logo: "M" };
  return null;
}

const CRM_OPTIONS: { name: string; provider: CRMProvider }[] = [
  { name: "Kommo CRM", provider: "kommo" },
  { name: "HubSpot", provider: "hubspot" },
  { name: "Pipedrive", provider: "pipedrive" },
  { name: "Asaas", provider: "asaas" },
  { name: "Outro CRM", provider: "generic" },
];

const ADS_OPTIONS: { name: string; type: "ads"; provider: "meta" }[] = [
  { name: "Meta Ads", type: "ads", provider: "meta" },
];

export default function IntegrationsPage() {
  const { data, isLoading, isError, refetch } = useIntegrations();
  const updateMut = useUpdateIntegrationStatus();
  const resetSyncMut = useResetIntegrationSync();
  const createMut = useCreateIntegration();
  const deleteMut = useDeleteIntegration();
  const searchParams = useSearchParams();

  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ id: string; message: string } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [disconnectDialog, setDisconnectDialog] = useState<Integration | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Integration | null>(null);
  const [webhookDialog, setWebhookDialog] = useState<Integration | null>(null);
  const [tokenDialog, setTokenDialog] = useState<TokenDialogState>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [companyDomainInput, setCompanyDomainInput] = useState("");
  const [apiUrlInput, setApiUrlInput] = useState("");
  const [outroCrmDialog, setOutroCrmDialog] = useState(false);
  const [outroCrmName, setOutroCrmName] = useState("");

  const getAuthHeaders = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "connected") {
      setToast({ type: "success", message: "CRM conectado com sucesso!" });
      refetch();
    } else if (error) {
      setToast({ type: "error", message: `Erro na conexão: ${decodeURIComponent(error)}` });
    }

    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, refetch, toast]);

  async function handleConnect(integration: Integration) {
    const providerInfo = getProvider(integration.name);
    if (!providerInfo || !["kommo", "hubspot", "pipedrive"].includes(providerInfo.provider)) {
      setToast({ type: "error", message: "OAuth disponível apenas para Kommo, HubSpot e Pipedrive. Use a opção Token." });
      return;
    }

    setConnecting(integration.id);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers,
        body: JSON.stringify({ provider: providerInfo.provider, integrationId: integration.id }),
      });
      const body = await res.json();
      if (!res.ok) {
        setToast({ type: "error", message: body.error || "Erro ao iniciar conexão." });
        setConnecting(null);
        return;
      }
      window.location.href = body.authUrl;
    } catch {
      setToast({ type: "error", message: "Erro de conexão. Tente novamente." });
      setConnecting(null);
    }
  }

  async function handleConnectMeta(integration: Integration) {
    setConnecting(integration.id);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/integrations/meta/connect", {
        method: "POST",
        headers,
        body: JSON.stringify({ integrationId: integration.id }),
      });
      const body = await res.json();
      if (!res.ok) {
        setToast({ type: "error", message: body.message || body.error || "Erro ao iniciar conexão com Meta." });
        setConnecting(null);
        return;
      }
      window.location.href = body.authUrl;
    } catch {
      setToast({ type: "error", message: "Erro de conexão. Tente novamente." });
      setConnecting(null);
    }
  }

  async function handleAddMetaAds() {
    const existing = data?.find((i) => i.name.toLowerCase().includes("meta") && i.type === "ads");
    if (existing) {
      if (existing.status !== "connected") {
        openTokenDialog(existing, "meta");
      } else {
        setToast({ type: "success", message: "Meta Ads já está conectado." });
      }
      return;
    }
    try {
      const created = await createMut.mutateAsync({ name: "Meta Ads", type: "ads" });
      refetch();
      openTokenDialog(
        { id: created.id, name: created.name, type: created.type, status: created.status, lastSync: undefined },
        "meta",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao adicionar Meta Ads.";
      setToast({ type: "error", message: msg });
    }
  }

  function handleDisconnect(integration: Integration) {
    setDisconnectDialog(integration);
  }

  function confirmDisconnect() {
    if (!disconnectDialog) return;
    updateMut.mutate(
      { id: disconnectDialog.id, status: "disconnected" },
      {
        onSuccess: () => {
          setDisconnectDialog(null);
          setToast({ type: "success", message: `${disconnectDialog.name} desconectado.` });
        },
      },
    );
  }

  function handleDelete(integration: Integration) {
    setDeleteDialog(integration);
  }

  function confirmDelete() {
    if (!deleteDialog) return;
    deleteMut.mutate(deleteDialog.id, {
      onSuccess: () => {
        const name = deleteDialog.name;
        setDeleteDialog(null);
        setToast({ type: "success", message: `${name} excluído com sucesso.` });
      },
      onError: (err) => {
        setToast({ type: "error", message: err instanceof Error ? err.message : "Erro ao excluir integração." });
      },
    });
  }

  async function handleSync(integration: Integration) {
    setSyncing(integration.id);
    setSyncResult(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/integrations/sync", {
        method: "POST",
        headers,
        body: JSON.stringify({ integrationId: integration.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: "error", message: (body as { message?: string }).message || (body as { error?: string }).error || "Erro na sincronização." });
        refetch();
      } else {
        setSyncResult({ id: integration.id, message: body.result.message });
        setToast({ type: "success", message: `Sincronização concluída: ${body.result.message}` });
        refetch();
      }
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Erro de conexão ao sincronizar." });
      refetch();
    } finally {
      setSyncing(null);
    }
  }

  function getWebhookUrl(integration: Integration) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/api/integrations/webhook?id=${integration.id}`;
  }

  function copyWebhookUrl(integration: Integration) {
    navigator.clipboard.writeText(getWebhookUrl(integration));
    setToast({ type: "success", message: "URL do webhook copiada!" });
    setWebhookDialog(null);
  }

  function openTokenDialog(integration: Integration, provider?: CRMProvider | "meta") {
    const providerInfo = getProvider(integration.name);
    const p = (provider ?? providerInfo?.provider ?? "generic") as CRMProvider | "meta";
    const supported = ["kommo", "hubspot", "pipedrive", "asaas", "generic", "meta"];
    if (supported.includes(p) || providerInfo || integration.name.toLowerCase().match(/kommo|hubspot|pipedrive|asaas|meta/)) {
      setTokenDialog({ integration, provider: p });
      setTokenInput("");
      setCompanyDomainInput("");
      setApiUrlInput("");
    } else {
      setToast({ type: "error", message: "Selecione uma integração suportada." });
    }
  }

  async function handleAddCRM(name: string, provider: CRMProvider) {
    const existing = data?.find((i) => i.name.toLowerCase() === name.toLowerCase() && i.type === "crm");
    if (existing) {
      openTokenDialog(existing, provider);
      return;
    }
    try {
      const created = await createMut.mutateAsync({ name, type: "crm" });
      openTokenDialog(
        { id: created.id, name: created.name, type: created.type, status: created.status, lastSync: undefined },
        provider,
      );
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao criar integração.";
      setToast({ type: "error", message: msg });
    }
  }

  function handleOutroCrmSubmit() {
    const name = outroCrmName.trim();
    if (!name) {
      setToast({ type: "error", message: "Digite o nome do CRM." });
      return;
    }
    setOutroCrmDialog(false);
    setOutroCrmName("");
    handleAddCRM(name, "generic");
  }

  async function handleManualConnect(accessToken: string, companyDomain?: string, apiUrl?: string) {
    if (!tokenDialog) return;
    setConnecting(tokenDialog.integration.id);
    try {
      const headers = await getAuthHeaders();

      if (tokenDialog.provider === "meta") {
        const res = await fetch("/api/integrations/meta/manual-connect", {
          method: "POST",
          headers,
          body: JSON.stringify({
            integrationId: tokenDialog.integration.id,
            access_token: accessToken.trim(),
          }),
        });
        const resData = await res.json();
        if (!res.ok) {
          setToast({ type: "error", message: resData.message || resData.error || "Erro ao conectar Meta." });
        } else {
          setTokenDialog(null);
          setToast({ type: "success", message: "Meta Ads conectado com sucesso!" });
          refetch();
        }
        return;
      }

      const body: Record<string, unknown> = {
        integrationId: tokenDialog.integration.id,
        provider: tokenDialog.provider,
        access_token: accessToken,
      };
      if (tokenDialog.provider === "pipedrive" && companyDomain) {
        body.company_domain = companyDomain.trim();
      }
      if ((tokenDialog.provider === "generic" || tokenDialog.provider === "asaas") && apiUrl) {
        body.api_url = apiUrl.trim();
      }
      const res = await fetch("/api/integrations/manual-connect", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const resData = await res.json();
      if (!res.ok) {
        setToast({ type: "error", message: resData.message || resData.error || "Erro ao conectar." });
      } else {
        setTokenDialog(null);
        setToast({ type: "success", message: "CRM conectado com sucesso!" });
        refetch();
      }
    } catch {
      setToast({ type: "error", message: "Erro de conexão. Tente novamente." });
    } finally {
      setConnecting(null);
    }
  }

  const isGenericProvider = tokenDialog?.provider === "generic" || tokenDialog?.provider === "asaas";
  const crmIntegrations = data?.filter((i) => i.type === "crm") ?? [];

  return (
    <AdminPageWrapper title="Integrações" description="Conecte CRMs via OAuth ou Token/API Key">
      {/* Toast */}
      {toast && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
              : "border-red-200 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <p className="text-sm">{toast.message}</p>
        </div>
      )}

      {/* Guia explicativo */}
      <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <HelpCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Como conectar suas integrações</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-blue-800 dark:text-blue-200">
                <li>Clique em <strong>&quot;Adicionar CRM&quot;</strong> e escolha o sistema (Kommo, HubSpot, Pipedrive, Asaas, Meta Ads ou Outro).</li>
                <li>Escolha <strong>OAuth</strong> (login automático) ou <strong>Token/API Key</strong> (chave manual — recomendado para Meta Ads).</li>
                <li>Para Token: gere a chave no painel do sistema e cole aqui. Meta Ads: use o Graph API Explorer para gerar o token.</li>
                <li>Para Asaas e outros: informe a URL da API se for diferente do padrão.</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && <ErrorState onRetry={() => refetch()} />}

      {data && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="gap-1.5" disabled={createMut.isPending}>
                  <Plus className="h-4 w-4" />
                  Adicionar CRM
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {CRM_OPTIONS.map((opt) =>
                  opt.provider === "generic" ? (
                    <DropdownMenuItem key="outro" onClick={() => setOutroCrmDialog(true)}>
                      Outro CRM (nome personalizado)
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      key={opt.provider}
                      onClick={() => handleAddCRM(opt.name, opt.provider)}
                    >
                      {opt.name}
                    </DropdownMenuItem>
                  ),
                )}
                <DropdownMenuSeparator />
                {ADS_OPTIONS.map((opt) => (
                  <DropdownMenuItem key={opt.provider} onClick={() => handleAddMetaAds()}>
                    {opt.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-xs text-muted-foreground">
              Suportamos Kommo, HubSpot, Pipedrive, Asaas e outros via token manual.
            </p>
          </div>

          {crmIntegrations.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Key className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-2 font-medium">Nenhum CRM conectado</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Clique em &quot;Adicionar CRM&quot; acima para começar.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setOutroCrmDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar primeiro CRM
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((integration) => {
                const statusCfg = STATUS_CONFIG[integration.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.disconnected;
                const StatusIcon = statusCfg.icon;
                const isConnected = integration.status === "connected";
                const isSyncing = integration.status === "syncing" || syncing === integration.id;
                const providerInfo = getProvider(integration.name);
                const providerColor = providerInfo ? (PROVIDER_COLORS[providerInfo.provider] ?? PROVIDER_COLORS.default) : PROVIDER_COLORS.default;
                const isCRM = integration.type === "crm";
                const isMetaAds = integration.type === "ads" && providerInfo?.provider === "meta";
                const supportsToken = isCRM && (providerInfo || ["kommo", "hubspot", "pipedrive", "asaas", "generic"].some((p) => integration.name.toLowerCase().includes(p)));

                return (
                  <Card key={integration.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3 border-b p-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white font-bold text-sm ${providerColor}`}>
                          {providerInfo?.logo || integration.name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{integration.name}</p>
                          <p className="text-xs capitalize text-muted-foreground">{integration.type}</p>
                        </div>
                        <Badge className={`shrink-0 gap-1 ${statusCfg.className}`}>
                          <StatusIcon className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                          {isSyncing ? "Sincronizando" : statusCfg.label}
                        </Badge>
                      </div>

                      <div className="space-y-3 p-4">
                        {integration.lastSync && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Última sync: {new Date(integration.lastSync).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}

                        {syncResult?.id === integration.id && (
                          <div className="rounded-md bg-emerald-50 px-3 py-2 dark:bg-emerald-950/20">
                            <p className="text-xs text-emerald-700 dark:text-emerald-400">{syncResult.message}</p>
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          {isConnected ? (
                            <>
                              {integration.status === "syncing" && (
                                <p className="text-xs text-amber-600 dark:text-amber-500">
                                  Se a sincronização travou, use o botão abaixo para resetar.
                                </p>
                              )}
                              <div className="flex gap-2">
                                <Button variant="default" size="sm" className="flex-1 gap-1.5" disabled={isSyncing} onClick={() => handleSync(integration)}>
                                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                                  {isSyncing ? "Sincronizando..." : "Sincronizar"}
                                </Button>
                              </div>
                              {integration.status === "syncing" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/20"
                                  disabled={resetSyncMut.isPending}
                                  onClick={() =>
                                    resetSyncMut.mutate(integration.id, {
                                      onSuccess: () => setToast({ type: "success", message: "Status resetado. Tente sincronizar novamente." }),
                                      onError: (err) => setToast({ type: "error", message: err instanceof Error ? err.message : "Erro ao resetar." }),
                                    })
                                  }
                                >
                                  {resetSyncMut.isPending ? "Resetando…" : "Resetar se travado"}
                                </Button>
                              )}
                              <div className="flex gap-2">
                                {isCRM && (
                                  <Button variant="outline" size="sm" onClick={() => setWebhookDialog(integration)} title="Configurar Webhook">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20" onClick={() => handleDisconnect(integration)}>
                                <Unlink className="h-3.5 w-3.5" />
                                Desconectar
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20" onClick={() => setDeleteDialog(integration)}>
                                <Trash2 className="h-3.5 w-3.5" />
                                Excluir
                              </Button>
                            </>
                          ) : isMetaAds || supportsToken ? (
                            <div className="flex flex-col gap-2">
                              {(providerInfo && ["kommo", "hubspot", "pipedrive"].includes(providerInfo.provider) && (
                                <Button variant="default" size="sm" className="w-full gap-1.5" disabled={connecting === integration.id} onClick={() => handleConnect(integration)}>
                                  {connecting === integration.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                                  {connecting === integration.id ? "Redirecionando..." : "Conectar via OAuth"}
                                </Button>
                              )) || (isMetaAds && (
                                <Button variant="default" size="sm" className="w-full gap-1.5" disabled={connecting === integration.id} onClick={() => handleConnectMeta(integration)}>
                                  {connecting === integration.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                                  {connecting === integration.id ? "Redirecionando..." : "Conectar via OAuth"}
                                </Button>
                              ))}
                              <Button variant="outline" size="sm" className="w-full gap-1.5" disabled={connecting === integration.id} onClick={() => openTokenDialog(integration, isMetaAds ? "meta" : undefined)}>
                                <Key className="h-3.5 w-3.5" />
                                Inserir Token / API Key
                              </Button>
                              {isMetaAds && (
                                <p className="text-xs text-muted-foreground">
                                  Ou gere um token no Graph API Explorer (Meta for Developers) com ads_management e ads_read.
                                </p>
                              )}
                              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20" onClick={() => setDeleteDialog(integration)}>
                                <Trash2 className="h-3.5 w-3.5" />
                                Excluir
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" className="w-full gap-1.5" disabled={connecting === integration.id} onClick={() => openTokenDialog(integration)}>
                                <Key className="h-3.5 w-3.5" />
                                Conectar com Token
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20" onClick={() => setDeleteDialog(integration)}>
                                <Trash2 className="h-3.5 w-3.5" />
                                Excluir
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Dialog: Outro CRM - nome personalizado */}
      <Dialog open={outroCrmDialog} onOpenChange={setOutroCrmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Outro CRM</DialogTitle>
            <DialogDescription>Digite o nome do seu CRM para adicioná-lo. Depois, insira o token ou chave de API.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="outro-name">Nome do CRM</Label>
            <Input
              id="outro-name"
              placeholder="ex: Meu CRM, Salesforce, etc."
              value={outroCrmName}
              onChange={(e) => setOutroCrmName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOutroCrmSubmit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOutroCrmDialog(false)}>Cancelar</Button>
            <Button onClick={handleOutroCrmSubmit} disabled={!outroCrmName.trim()}>Adicionar e conectar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Desconectar */}
      <Dialog open={!!disconnectDialog} onOpenChange={() => setDisconnectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desconectar {disconnectDialog?.name}</DialogTitle>
            <DialogDescription>A integração será desconectada. Os dados já importados serão mantidos.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDisconnect} disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Desconectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Excluir */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {deleteDialog?.name}</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A integração será removida permanentemente. Os dados já sincronizados permanecem no sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMut.isPending}>
              {deleteMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Webhook */}
      <Dialog open={!!webhookDialog} onOpenChange={() => setWebhookDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook URL</DialogTitle>
            <DialogDescription>Configure esta URL no seu CRM para receber atualizações em tempo real.</DialogDescription>
          </DialogHeader>
          {webhookDialog && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                <code className="flex-1 break-all text-xs">{getWebhookUrl(webhookDialog)}</code>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyWebhookUrl(webhookDialog)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setWebhookDialog(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Token / API Key */}
      <Dialog
        open={!!tokenDialog}
        onOpenChange={(open) => {
          if (!open) {
            setTokenDialog(null);
            setTokenInput("");
            setCompanyDomainInput("");
            setApiUrlInput("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          {tokenDialog && (
            <>
              <DialogHeader>
                <DialogTitle>Conectar {tokenDialog.integration.name} com Token</DialogTitle>
                <DialogDescription>
                  Insira sua chave de API ou token. Você encontra isso no painel de desenvolvedor ou configurações da API do seu CRM.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Token / API Key *</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="Cole seu token ou chave de API"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    disabled={!!connecting}
                  />
                </div>

                {tokenDialog.provider === "pipedrive" && (
                  <div className="space-y-2">
                    <Label htmlFor="company_domain">Domínio da empresa (opcional)</Label>
                    <Input
                      id="company_domain"
                      placeholder="ex: minha-empresa (antes de .pipedrive.com)"
                      value={companyDomainInput}
                      onChange={(e) => setCompanyDomainInput(e.target.value)}
                      disabled={!!connecting}
                    />
                  </div>
                )}

                {isGenericProvider && (
                  <div className="space-y-2">
                    <Label htmlFor="api_url">URL da API (opcional)</Label>
                    <Input
                      id="api_url"
                      type="url"
                      placeholder="ex: https://api.asaas.com ou deixe vazio"
                      value={apiUrlInput}
                      onChange={(e) => setApiUrlInput(e.target.value)}
                      disabled={!!connecting}
                    />
                    <p className="text-xs text-muted-foreground">Use se seu CRM tiver uma URL de API personalizada.</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setTokenDialog(null); setTokenInput(""); setCompanyDomainInput(""); setApiUrlInput(""); }}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    const t = tokenInput.trim();
                    if (!t) return;
                    handleManualConnect(
                      t,
                      tokenDialog.provider === "pipedrive" ? companyDomainInput : undefined,
                      isGenericProvider ? apiUrlInput : undefined,
                    );
                  }}
                  disabled={!!connecting || !tokenInput.trim()}
                >
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Conectar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
