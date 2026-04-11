"use client";

import { useState, useEffect, Suspense } from "react";
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
  CreditCard,
  Save,
  Settings,
  Trash2,
  Search,
  ChevronDown,
} from "lucide-react";
import {
  INTEGRATION_CATALOG,
  CATEGORY_LABELS,
  getCatalogById,
  type CatalogIntegration,
  type IntegrationCategory,
} from "@/lib/integrations-catalog";
import { IntegrationLogo } from "@/components/integrations/IntegrationLogo";
import { useIntegrations, useUpdateIntegrationStatus, useUpdateWebhookSecret, useCreateIntegration, useDeleteIntegration } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { useAuth } from "@/providers/AuthProvider";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Integration } from "@/types";

type CRMProvider = "kommo" | "hubspot" | "pipedrive" | "generic" | "asaas" | "rdstation" | "zoho" | "bitrix24" | "salesforce" | "meta";

type TokenDialogState = {
  integration: Integration;
  provider: CRMProvider;
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
  "RD Station": { provider: "rdstation", logo: "R" },
  "RD Station CRM": { provider: "rdstation", logo: "R" },
  "Zoho CRM": { provider: "zoho", logo: "Z" },
  "Zoho": { provider: "zoho", logo: "Z" },
  "Bitrix24": { provider: "bitrix24", logo: "B" },
  "Salesforce": { provider: "salesforce", logo: "S" },
  "Asaas": { provider: "asaas", logo: "A" },
  "Meta Ads": { provider: "meta", logo: "M" },
  "Meta": { provider: "meta", logo: "M" },
};

const PROVIDER_COLORS: Record<string, string> = {
  kommo: "bg-blue-600",
  hubspot: "bg-orange-500",
  pipedrive: "bg-green-600",
  asaas: "bg-emerald-600",
  rdstation: "bg-cyan-600",
  zoho: "bg-red-500",
  bitrix24: "bg-amber-500",
  salesforce: "bg-sky-500",
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
  if (name.toLowerCase().includes("rd station")) return { provider: "rdstation", logo: "R" };
  if (name.toLowerCase().includes("zoho")) return { provider: "zoho", logo: "Z" };
  if (name.toLowerCase().includes("bitrix24")) return { provider: "bitrix24", logo: "B" };
  if (name.toLowerCase().includes("salesforce")) return { provider: "salesforce", logo: "S" };
  return null;
}

const CRM_OPTIONS: { name: string; provider: CRMProvider }[] = [
  { name: "Kommo CRM", provider: "kommo" },
  { name: "HubSpot", provider: "hubspot" },
  { name: "Pipedrive", provider: "pipedrive" },
  { name: "RD Station", provider: "rdstation" },
  { name: "Zoho CRM", provider: "zoho" },
  { name: "Bitrix24", provider: "bitrix24" },
  { name: "Salesforce", provider: "salesforce" },
  { name: "Asaas", provider: "asaas" },
  { name: "Outro CRM", provider: "generic" },
];

const API_URL_PLACEHOLDERS: Record<string, string> = {
  rdstation: "https://api.rd.services/platform/",
  zoho: "https://www.zohoapis.com/crm/v2/",
  bitrix24: "https://sua-empresa.bitrix24.com.br/rest/1/CODE/",
  salesforce: "https://sua-instancia.salesforce.com/services/data/v59.0/",
  asaas: "https://api.asaas.com",
  generic: "ex: https://api.seudominio.com ou deixe vazio",
};

function catalogMatchesIntegration(item: CatalogIntegration, i: Integration): boolean {
  if (item.provider === "stripe") return false;
  const p = getProvider(i.name);
  if (p?.provider === item.provider) return true;
  if (i.name.toLowerCase().includes(item.provider.toLowerCase())) return true;
  return false;
}

export function IntegrationsPageContent() {
  const { organization } = useAuth();
  const { data, isLoading, isError, refetch } = useIntegrations();
  const integrations = data ?? [];
  const updateMut = useUpdateIntegrationStatus();
  const webhookSecretMut = useUpdateWebhookSecret();
  const deleteMut = useDeleteIntegration();
  const createMut = useCreateIntegration();
  const searchParams = useSearchParams();

  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ id: string; message: string } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [disconnectDialog, setDisconnectDialog] = useState<Integration | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Integration | null>(null);
  const [webhookDialog, setWebhookDialog] = useState<Integration | null>(null);
  const [webhookSecretInput, setWebhookSecretInput] = useState("");
  const [tokenDialog, setTokenDialog] = useState<TokenDialogState>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [companyDomainInput, setCompanyDomainInput] = useState("");
  const [apiUrlInput, setApiUrlInput] = useState("");
  const [outroCrmDialog, setOutroCrmDialog] = useState(false);
  const [outroCrmName, setOutroCrmName] = useState("");
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeSaving, setStripeSaving] = useState(false);
  const [stripeConfig, setStripeConfig] = useState<Record<string, string>>({});
  const [stripeForm, setStripeForm] = useState<Record<string, string>>({});
  const [stripeConfigDialog, setStripeConfigDialog] = useState(false);
  const [stripeDisconnectDialog, setStripeDisconnectDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<IntegrationCategory | "todos" | "instalado">("todos");
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogIntegration | null>(null);
  const [selectedModules, setSelectedModules] = useState<Record<string, string[]>>({});

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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/settings/stripe", { headers });
        if (cancelled) return;
        if (res.ok) {
          const json = await res.json();
          setStripeConfig(json);
          setStripeForm(json);
        }
      } finally {
        if (!cancelled) setStripeLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handleSaveStripeConfig() {
    setStripeSaving(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/settings/stripe", {
        method: "POST",
        headers,
        body: JSON.stringify(stripeForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", message: data.message || "Erro ao salvar configurações." });
      } else {
        setStripeConfig(stripeForm);
        setStripeConfigDialog(false);
        setToast({ type: "success", message: "Configurações do Stripe salvas com sucesso!" });
        const refetchRes = await fetch("/api/settings/stripe", { headers });
        if (refetchRes.ok) setStripeConfig(await refetchRes.json());
      }
    } catch {
      setToast({ type: "error", message: "Erro de conexão ao salvar." });
    } finally {
      setStripeSaving(false);
    }
  }

  async function handleStripeDisconnect() {
    setStripeSaving(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/settings/stripe", {
        method: "POST",
        headers,
        body: JSON.stringify({ clear: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        setToast({ type: "error", message: data.message || "Erro ao desconectar." });
      } else {
        setStripeConfig({});
        setStripeForm({});
        setStripeDisconnectDialog(false);
        setToast({ type: "success", message: "Stripe desconectado." });
      }
    } catch {
      setToast({ type: "error", message: "Erro de conexão ao desconectar." });
    } finally {
      setStripeSaving(false);
    }
  }

  async function handleConnect(integration: Integration) {
    const providerInfo = getProvider(integration.name);
    if (!providerInfo || !["kommo", "hubspot", "pipedrive"].includes(providerInfo.provider)) {
      setToast({ type: "error", message: "OAuth disponível apenas para Kommo, HubSpot e Pipedrive. Use a opção Token." });
      return;
    }

    setConnecting(integration.id);
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  function confirmDelete() {
    if (!deleteDialog) return;
    deleteMut.mutate(deleteDialog.id, {
      onSuccess: () => {
        setDeleteDialog(null);
        setToast({ type: "success", message: `${deleteDialog.name} excluído.` });
      },
      onError: () => {
        setToast({ type: "error", message: "Erro ao excluir integração." });
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
      const body = await res.json();
      if (!res.ok) {
        setToast({ type: "error", message: body.error || "Erro na sincronização." });
      } else {
        setSyncResult({ id: integration.id, message: body.result.message });
        setToast({ type: "success", message: `Sincronização concluída: ${body.result.message}` });
        refetch();
      }
    } catch {
      setToast({ type: "error", message: "Erro de conexão ao sincronizar." });
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

  function openTokenDialog(integration: Integration, provider?: CRMProvider) {
    const providerInfo = getProvider(integration.name);
    const p = (provider ?? providerInfo?.provider ?? "generic") as CRMProvider;
    const supported = ["kommo", "hubspot", "pipedrive", "asaas", "generic", "rdstation", "zoho", "bitrix24", "salesforce", "meta"];
    const isAdsMeta = integration.type === "ads" && (p === "meta" || integration.name.toLowerCase().includes("meta"));
    if (supported.includes(p) || providerInfo || integration.name.toLowerCase().match(/kommo|hubspot|pipedrive|asaas/) || isAdsMeta) {
      setTokenDialog({ integration, provider: isAdsMeta ? "meta" : p });
      setTokenInput("");
      setCompanyDomainInput("");
      setApiUrlInput("");
    } else {
      setToast({ type: "error", message: "Selecione um CRM ou plataforma de Ads suportada." });
    }
  }

  async function handleAddCRM(name: string, provider: CRMProvider) {
    const existing = integrations.find((i) => i.name.toLowerCase() === name.toLowerCase() && i.type === "crm");
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
      const body: Record<string, unknown> = {
        integrationId: tokenDialog.integration.id,
        provider: tokenDialog.provider,
        access_token: accessToken,
      };
      if (tokenDialog.provider === "pipedrive" && companyDomain) {
        body.company_domain = companyDomain.trim();
      }
      const tokenOnlyProviders = ["generic", "asaas", "rdstation", "zoho", "bitrix24", "salesforce"];
      if (tokenOnlyProviders.includes(tokenDialog.provider) && apiUrl) {
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
        setToast({ type: "success", message: resData.message || "Conectado com sucesso!" });
        refetch();
      }
    } catch {
      setToast({ type: "error", message: "Erro de conexão. Tente novamente." });
    } finally {
      setConnecting(null);
    }
  }

  const isGenericProvider = ["generic", "asaas", "rdstation", "zoho", "bitrix24", "salesforce"].includes(tokenDialog?.provider ?? "");
  const crmIntegrations = integrations.filter((i) => i.type === "crm");

  /** Limite efetivo: planos antigos com 1 integração bloqueavam várias contas do mesmo provedor; mínimo 25 conexões. */
  function effectiveMaxIntegrations(): number {
    const raw = organization?.max_integrations ?? 999;
    return raw <= 1 ? 25 : raw;
  }

  /** Todas as integrações da organização que correspondem ao item do catálogo (ex.: várias contas Meta Ads). */
  function getCatalogConnections(item: CatalogIntegration): Integration[] {
    if (item.provider === "stripe") return [];
    return integrations.filter((i) => catalogMatchesIntegration(item, i));
  }

  function isCatalogItemInstalled(item: CatalogIntegration): boolean {
    if (item.provider === "stripe") return !!stripeConfig?.secret_key;
    return getCatalogConnections(item).length > 0;
  }

  async function handleAddAnotherConnection() {
    if (!selectedCatalog) return;
    const maxInt = effectiveMaxIntegrations();
    if (integrations.length >= maxInt) {
      setToast({
        type: "error",
        message: `Limite de ${maxInt} integração(ões) do plano atingido. Remova uma integração ou faça upgrade.`,
      });
      return;
    }
    const list = getCatalogConnections(selectedCatalog);
    const n = list.length + 1;
    const name = n === 1 ? selectedCatalog.name : `${selectedCatalog.name} (${n})`;
    const intType = selectedCatalog.category === "ads" ? "ads" : "crm";
    try {
      await createMut.mutateAsync({ name, type: intType });
      await refetch();
      setToast({
        type: "success",
        message: "Nova conexão adicionada. Use os botões abaixo para OAuth ou token nesta conta.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao criar integração.";
      setToast({ type: "error", message: msg });
    }
  }

  const filteredCatalog = INTEGRATION_CATALOG.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (q && !item.name.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) return false;
    if (filterTab === "todos") return true;
    if (filterTab === "instalado") return isCatalogItemInstalled(item);
    return item.category === filterTab;
  });

  const webhookCount = integrations.filter((i) => i.type === "crm").length;

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

      <div className="space-y-6">
      {/* Header: busca + ações */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar integrações"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          {webhookCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              Web Hooks {webhookCount}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-1.5" disabled={createMut.isPending}>
                <Plus className="h-4 w-4" />
                Criar integração
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setOutroCrmDialog(true)}>Outro CRM (nome personalizado)</DropdownMenuItem>
              {CRM_OPTIONS.filter((o) => o.provider !== "generic").map((opt) => (
                <DropdownMenuItem key={opt.provider} onClick={() => handleAddCRM(opt.name, opt.provider)}>{opt.name}</DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => { setStripeForm({ ...stripeConfig }); setStripeConfigDialog(true); }}>
                Stripe (pagamento)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Abas de filtro */}
      <div className="flex flex-wrap gap-2">
        {(["todos", "crm", "pagamento", "ads", "instalado"] as const).map((tab) => (
          <Button
            key={tab}
            variant={filterTab === tab ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilterTab(tab)}
          >
            {tab === "todos" && "Todos"}
            {tab === "crm" && CATEGORY_LABELS.crm}
            {tab === "pagamento" && CATEGORY_LABELS.pagamento}
            {tab === "ads" && CATEGORY_LABELS.ads}
            {tab === "instalado" && "✓ Instalado"}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState
          title="Erro ao carregar integrações"
          message="Não foi possível carregar a lista de integrações. Verifique sua conexão e tente novamente."
          onRetry={() => refetch()}
        />
      )}

      {/* Grid do catálogo + painel de detalhe — só renderiza quando dados carregaram com sucesso */}
      {!isLoading && !isError && (
      <div className={`grid gap-6 ${selectedCatalog ? "lg:grid-cols-[1fr,380px]" : ""}`}>
        {/* Grid de cards do catálogo */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCatalog.map((item) => {
            const installed = isCatalogItemInstalled(item);
            const connCount = getCatalogConnections(item).length;
            return (
              <Card
                key={item.id}
                className={`cursor-pointer transition-colors hover:border-primary/50 ${selectedCatalog?.id === item.id ? "ring-2 ring-primary" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCatalog(item);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <IntegrationLogo item={item} />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                    {installed ? (
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent">
                          <CheckCircle2 className="h-3 w-3" /> Instalado
                        </Badge>
                        {connCount > 1 && (
                          <span className="text-[10px] text-muted-foreground tabular-nums">{connCount} conexões</span>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="shrink-0 gap-1">
                        <Plus className="h-3 w-3" /> Instalar
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Painel de detalhe ao selecionar */}
        {selectedCatalog && (
          <Card className="h-fit lg:sticky lg:top-6">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IntegrationLogo item={selectedCatalog} />
                  <div>
                    <h3 className="font-semibold">{selectedCatalog.name}</h3>
                    <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[selectedCatalog.category]}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCatalog(null)}>×</Button>
              </div>
              <p className="text-sm text-muted-foreground">{selectedCatalog.description}</p>

              {/* Módulos: o que trazer para o sistema */}
              <div>
                <h4 className="text-sm font-medium mb-2">O que trazer para o sistema</h4>
                <div className="space-y-2">
                  {selectedCatalog.modules.map((mod) => {
                    const defaultMods = selectedCatalog.modules.filter((m) => m.enabledByDefault).map((m) => m.key);
                    const mods = selectedModules[selectedCatalog.id] ?? defaultMods;
                    const isChecked = mods.includes(mod.key);
                    return (
                      <div key={mod.key} className="flex items-start gap-3 rounded-lg border p-3">
                        <input
                          type="checkbox"
                          id={`${selectedCatalog.id}-${mod.key}`}
                          checked={isChecked}
                          onChange={(e) => {
                            setSelectedModules((prev) => {
                              const current = prev[selectedCatalog.id] ?? defaultMods;
                              const nextList = e.target.checked
                                ? [...current, mod.key]
                                : current.filter((k) => k !== mod.key);
                              return { ...prev, [selectedCatalog.id]: nextList };
                            });
                          }}
                          className="mt-1 rounded border-gray-300"
                        />
                        <label htmlFor={`${selectedCatalog.id}-${mod.key}`} className="flex-1 cursor-pointer">
                          <span className="font-medium text-sm">{mod.label}</span>
                          <p className="text-xs text-muted-foreground">{mod.description}</p>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ações de conexão */}
              <div className="space-y-2 pt-2 border-t">
                {selectedCatalog.provider === "stripe" ? (
                  stripeConfig?.secret_key ? (
                    <>
                      <Button variant="default" size="sm" className="w-full gap-1.5" onClick={() => { setStripeForm({ ...stripeConfig }); setStripeConfigDialog(true); }}>
                        <Settings className="h-3.5 w-3.5" /> Editar configurações
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => setStripeDisconnectDialog(true)}>
                        <Unlink className="h-3.5 w-3.5" /> Desconectar
                      </Button>
                    </>
                  ) : (
                    <Button variant="default" size="sm" className="w-full gap-1.5" onClick={() => { setStripeForm({ ...stripeConfig }); setStripeConfigDialog(true); }}>
                      <Key className="h-3.5 w-3.5" /> Configurar Stripe
                    </Button>
                  )
                ) : (() => {
                  const connections = getCatalogConnections(selectedCatalog);
                  const tokenOnlyProviders = ["rdstation", "zoho", "bitrix24", "salesforce", "generic", "asaas"];
                  const maxInt = effectiveMaxIntegrations();
                  const atIntegrationLimit = integrations.length >= maxInt;

                  if (connections.length > 0) {
                    return (
                      <>
                        <div>
                          <h4 className="text-sm font-medium">Conexões ({connections.length})</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Cada linha é uma conta vinculada (ex.: várias contas Meta Ads). Sincronize e gerencie por conexão.
                          </p>
                        </div>
                        {connections.map((connectedInt) => {
                          const isConnected = connectedInt.status === "connected";
                          const isSyncing = syncing === connectedInt.id;
                          const providerInfo = getProvider(connectedInt.name);
                          const supportsSync = connectedInt.type === "ads"
                            ? providerInfo?.provider === "meta"
                            : !tokenOnlyProviders.includes(providerInfo?.provider ?? "");
                          const st = STATUS_CONFIG[connectedInt.status];
                          const StIcon = st.icon;
                          return (
                            <div key={connectedInt.id} className="rounded-lg border bg-muted/30 p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium break-words min-w-0" title={connectedInt.name}>{connectedInt.name}</p>
                                <Badge className={`shrink-0 gap-1 text-[10px] ${st.className}`}>
                                  <StIcon className="h-3 w-3" /> {st.label}
                                </Badge>
                              </div>
                              {isConnected && supportsSync && (
                                <Button variant="default" size="sm" className="w-full gap-1.5" disabled={isSyncing} onClick={() => handleSync(connectedInt)}>
                                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                                  {isSyncing ? "Sincronizando..." : "Sincronizar"}
                                </Button>
                              )}
                              {providerInfo?.provider === "kommo" && (
                                <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setWebhookDialog(connectedInt)}>
                                  <ExternalLink className="h-3.5 w-3.5" /> URL do Webhook
                                </Button>
                              )}
                              {["kommo", "hubspot", "pipedrive"].includes(selectedCatalog.provider) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full gap-1.5"
                                  disabled={connecting !== null}
                                  onClick={() => handleConnect(connectedInt)}
                                >
                                  {connecting === connectedInt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                                  {isConnected ? "Reconectar via OAuth" : "Conectar via OAuth"}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-1.5"
                                onClick={() => openTokenDialog(connectedInt, selectedCatalog.provider as CRMProvider)}
                              >
                                <Key className="h-3.5 w-3.5" /> Inserir Token / API Key
                              </Button>
                              <Button variant="ghost" size="sm" className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => setDisconnectDialog(connectedInt)}>
                                <Unlink className="h-3.5 w-3.5" /> Desconectar
                              </Button>
                              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setDeleteDialog(connectedInt)}>
                                Excluir integração
                              </Button>
                            </div>
                          );
                        })}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full gap-1.5"
                          disabled={atIntegrationLimit || createMut.isPending}
                          onClick={() => void handleAddAnotherConnection()}
                        >
                          {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                          Adicionar outra conexão
                        </Button>
                        {atIntegrationLimit && (
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            Limite de {maxInt} integração(ões) do plano atingido. Exclua uma integração ou faça upgrade.
                          </p>
                        )}
                      </>
                    );
                  }

                  const handleAddAndConnectFirst = async () => {
                    const intType = selectedCatalog.category === "ads" ? "ads" : "crm";
                    try {
                      const created = await createMut.mutateAsync({ name: selectedCatalog.name, type: intType });
                      await refetch();
                      openTokenDialog(
                        { id: created.id, name: created.name, type: created.type, status: created.status, lastSync: undefined },
                        selectedCatalog.provider as CRMProvider,
                      );
                    } catch {
                      setToast({ type: "error", message: "Erro ao criar integração. Tente novamente." });
                    }
                  };

                  return (
                    <>
                      {["kommo", "hubspot", "pipedrive"].includes(selectedCatalog.provider) && (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full gap-1.5"
                          disabled={connecting !== null || createMut.isPending || atIntegrationLimit}
                          onClick={async () => {
                            const i = integrations.find((x) => getProvider(x.name)?.provider === selectedCatalog.provider);
                            if (i) {
                              handleConnect(i);
                              return;
                            }
                            try {
                              const created = await createMut.mutateAsync({ name: selectedCatalog.name, type: "crm" });
                              await refetch();
                              handleConnect({ id: created.id, name: created.name, type: created.type, status: created.status, lastSync: undefined } as Integration);
                            } catch {
                              setToast({ type: "error", message: "Erro ao criar integração. Tente novamente." });
                            }
                          }}
                        >
                          {(connecting || createMut.isPending) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                          Conectar via OAuth
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                        disabled={atIntegrationLimit}
                        onClick={() => {
                          if (selectedCatalog.provider === "meta" || selectedCatalog.category === "ads") {
                            void handleAddAndConnectFirst();
                          } else {
                            void handleAddCRM(selectedCatalog.name, selectedCatalog.provider as CRMProvider);
                          }
                        }}
                      >
                        <Key className="h-3.5 w-3.5" /> Inserir Token / API Key
                      </Button>
                      {atIntegrationLimit && (
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Limite de {maxInt} integração(ões) do plano atingido.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      )}

      {/* Dialog: Configuração Stripe */}
      <Dialog open={stripeConfigDialog} onOpenChange={(open) => { setStripeConfigDialog(open); if (!open) setStripeForm({ ...stripeConfig }); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar Stripe</DialogTitle>
            <DialogDescription>
              Informe as chaves e Price IDs do seu painel Stripe para habilitar cobrança e assinaturas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2 py-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="stripe_secret_key">Secret Key (sk_...)</Label>
              <Input
                id="stripe_secret_key"
                type="password"
                placeholder="sk_live_... ou sk_test_..."
                value={stripeForm.secret_key ?? ""}
                onChange={(e) => setStripeForm((p) => ({ ...p, secret_key: e.target.value }))}
                disabled={stripeSaving}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="stripe_webhook_secret">Webhook Secret (whsec_...)</Label>
              <Input
                id="stripe_webhook_secret"
                type="password"
                placeholder="whsec_..."
                value={stripeForm.webhook_secret ?? ""}
                onChange={(e) => setStripeForm((p) => ({ ...p, webhook_secret: e.target.value }))}
                disabled={stripeSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe_price_starter_monthly">Price ID Starter (mensal)</Label>
              <Input
                id="stripe_price_starter_monthly"
                placeholder="price_..."
                value={stripeForm.price_starter_monthly ?? ""}
                onChange={(e) => setStripeForm((p) => ({ ...p, price_starter_monthly: e.target.value }))}
                disabled={stripeSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe_price_starter_yearly">Price ID Starter (anual)</Label>
              <Input
                id="stripe_price_starter_yearly"
                placeholder="price_..."
                value={stripeForm.price_starter_yearly ?? ""}
                onChange={(e) => setStripeForm((p) => ({ ...p, price_starter_yearly: e.target.value }))}
                disabled={stripeSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe_price_pro_monthly">Price ID Pro (mensal)</Label>
              <Input
                id="stripe_price_pro_monthly"
                placeholder="price_..."
                value={stripeForm.price_pro_monthly ?? ""}
                onChange={(e) => setStripeForm((p) => ({ ...p, price_pro_monthly: e.target.value }))}
                disabled={stripeSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe_price_pro_yearly">Price ID Pro (anual)</Label>
              <Input
                id="stripe_price_pro_yearly"
                placeholder="price_..."
                value={stripeForm.price_pro_yearly ?? ""}
                onChange={(e) => setStripeForm((p) => ({ ...p, price_pro_yearly: e.target.value }))}
                disabled={stripeSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStripeConfigDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveStripeConfig} disabled={stripeSaving} className="gap-2">
              {stripeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {stripeSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Desconectar Stripe */}
      <Dialog open={stripeDisconnectDialog} onOpenChange={setStripeDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desconectar Stripe</DialogTitle>
            <DialogDescription>
              As configurações do Stripe serão removidas. O cobrança via Stripe deixará de funcionar até uma nova configuração.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStripeDisconnectDialog(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleStripeDisconnect}
              disabled={stripeSaving}
            >
              {stripeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Desconectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              A integração será removida permanentemente. Esta ação não pode ser desfeita.
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
      <Dialog
        open={!!webhookDialog}
        onOpenChange={(open) => {
          if (!open) {
            setWebhookDialog(null);
            setWebhookSecretInput("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar Webhook</DialogTitle>
            <DialogDescription>
              Use estas informações no Kommo (Configurações → Integrações → Web hooks) ou no painel de webhooks do seu CRM.
            </DialogDescription>
          </DialogHeader>
          {webhookDialog && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>1. URL para criar o webhook</Label>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                  <code className="flex-1 break-all text-xs">{getWebhookUrl(webhookDialog)}</code>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyWebhookUrl(webhookDialog)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook_secret">2. Chave para conectar (opcional)</Label>
                <Input
                  id="webhook_secret"
                  type="password"
                  placeholder="Ex: uma-chave-secreta-aleatoria"
                  value={webhookSecretInput}
                  onChange={(e) => setWebhookSecretInput(e.target.value)}
                  disabled={webhookSecretMut.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Se o Kommo pedir uma chave, crie uma e cole aqui. Use a mesma chave no Kommo. Deixe vazio se não for necessário.
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Passo a passo no Kommo</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-blue-800 dark:text-blue-200">
                  <li>Cole a URL acima no campo principal do formulário.</li>
                  <li>Se houver campo para chave, use a mesma que você digitou acima.</li>
                  <li>Selecione os eventos (leads, contatos, etc.).</li>
                  <li>Clique em Salvar.</li>
                </ol>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWebhookDialog(null);
                setWebhookSecretInput("");
              }}
            >
              Fechar
            </Button>
            <Button
              onClick={async () => {
                if (!webhookDialog) return;
                try {
                  await webhookSecretMut.mutateAsync({
                    id: webhookDialog.id,
                    webhookSecret: webhookSecretInput.trim(),
                  });
                  setToast({ type: "success", message: "Chave do webhook salva!" });
                  if (!webhookSecretInput.trim()) setWebhookSecretInput("");
                } catch {
                  setToast({ type: "error", message: "Erro ao salvar chave." });
                }
              }}
              disabled={webhookSecretMut.isPending}
            >
              {webhookSecretMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar chave
            </Button>
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
                  {tokenDialog.provider === "meta"
                    ? "Insira o Access Token do Meta (Graph API). Obtenha em developers.facebook.com → Graph API Explorer com permissões ads_read e ads_management."
                    : "Insira sua chave de API ou token. Você encontra isso no painel de desenvolvedor ou configurações da API do seu CRM."}
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
                      placeholder={API_URL_PLACEHOLDERS[tokenDialog.provider] ?? "ex: https://api.exemplo.com ou deixe vazio"}
                      value={apiUrlInput}
                      onChange={(e) => setApiUrlInput(e.target.value)}
                      disabled={!!connecting}
                    />
                    <p className="text-xs text-muted-foreground">RD Station, Zoho, Bitrix24 e Salesforce podem exigir URL. Deixe vazio se não for necessário.</p>
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
      </div>
    </AdminPageWrapper>
  );
}
