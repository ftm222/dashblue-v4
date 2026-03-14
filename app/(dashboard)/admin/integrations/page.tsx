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
} from "lucide-react";
import { useIntegrations, useUpdateIntegrationStatus } from "@/lib/queries";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { Integration } from "@/types";

const STATUS_CONFIG = {
  connected: { label: "Conectado", icon: CheckCircle2, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent" },
  disconnected: { label: "Desconectado", icon: Unlink, className: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-transparent" },
  error: { label: "Erro", icon: AlertCircle, className: "bg-red-500/15 text-red-700 dark:text-red-400 border-transparent" },
  syncing: { label: "Sincronizando", icon: RefreshCw, className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-transparent" },
} as const;

const PROVIDER_MAP: Record<string, { provider: string; logo: string }> = {
  "Kommo CRM": { provider: "kommo", logo: "K" },
  "HubSpot": { provider: "hubspot", logo: "H" },
  "Pipedrive": { provider: "pipedrive", logo: "P" },
};

const PROVIDER_COLORS: Record<string, string> = {
  kommo: "bg-blue-600",
  hubspot: "bg-orange-500",
  pipedrive: "bg-green-600",
  default: "bg-slate-600",
};

function getProvider(name: string) {
  for (const [key, val] of Object.entries(PROVIDER_MAP)) {
    if (name.toLowerCase().includes(key.toLowerCase()) || name.toLowerCase().includes(val.provider)) {
      return val;
    }
  }
  return null;
}

export default function IntegrationsPage() {
  const { data, isLoading, isError, refetch } = useIntegrations();
  const updateMut = useUpdateIntegrationStatus();
  const searchParams = useSearchParams();

  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ id: string; message: string } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [disconnectDialog, setDisconnectDialog] = useState<Integration | null>(null);
  const [webhookDialog, setWebhookDialog] = useState<Integration | null>(null);

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
    if (!providerInfo) {
      setToast({ type: "error", message: "Provider não suportado para esta integração." });
      return;
    }

    setConnecting(integration.id);

    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerInfo.provider,
          integrationId: integration.id,
        }),
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

  async function handleSync(integration: Integration) {
    setSyncing(integration.id);
    setSyncResult(null);

    try {
      const res = await fetch("/api/integrations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <AdminPageWrapper title="Integrações" description="Conecte suas fontes de dados via OAuth">
      {/* Toast */}
      {toast && (
        <div className={`mb-4 rounded-lg border px-4 py-3 flex items-center gap-2 ${
          toast.type === "success"
            ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
            : "border-red-200 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <p className="text-sm">{toast.message}</p>
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && <ErrorState onRetry={() => refetch()} />}

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((integration) => {
            const statusCfg = STATUS_CONFIG[integration.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.disconnected;
            const StatusIcon = statusCfg.icon;
            const isConnected = integration.status === "connected";
            const isSyncing = integration.status === "syncing" || syncing === integration.id;
            const providerInfo = getProvider(integration.name);
            const providerColor = providerInfo ? PROVIDER_COLORS[providerInfo.provider] : PROVIDER_COLORS.default;
            const isCRM = integration.type === "crm";

            return (
              <Card key={integration.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 border-b p-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-sm ${providerColor}`}>
                      {providerInfo?.logo || integration.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{integration.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{integration.type}</p>
                    </div>
                    <Badge className={`shrink-0 gap-1 ${statusCfg.className}`}>
                      <StatusIcon className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                      {isSyncing ? "Sincronizando" : statusCfg.label}
                    </Badge>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3">
                    {integration.lastSync && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Última sync:{" "}
                        {new Date(integration.lastSync).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}

                    {syncResult?.id === integration.id && (
                      <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">{syncResult.message}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {isConnected ? (
                        <>
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1 gap-1.5"
                              disabled={isSyncing}
                              onClick={() => handleSync(integration)}
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                              {isSyncing ? "Sincronizando..." : "Sincronizar"}
                            </Button>
                            {isCRM && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setWebhookDialog(integration)}
                                title="Configurar Webhook"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                            onClick={() => handleDisconnect(integration)}
                          >
                            <Unlink className="h-3.5 w-3.5" />
                            Desconectar
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full gap-1.5"
                          disabled={connecting === integration.id}
                          onClick={() => {
                            if (isCRM && providerInfo) {
                              handleConnect(integration);
                            } else {
                              handleConnect(integration);
                            }
                          }}
                        >
                          {connecting === integration.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Link2 className="h-3.5 w-3.5" />
                          )}
                          {connecting === integration.id ? "Redirecionando..." : "Conectar via OAuth"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Disconnect Dialog */}
      <Dialog open={!!disconnectDialog} onOpenChange={() => setDisconnectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desconectar {disconnectDialog?.name}</DialogTitle>
            <DialogDescription>
              A integração será desconectada e a sincronização automática será interrompida. 
              Os dados já importados serão mantidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectDialog(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDisconnect} disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Desconectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook Dialog */}
      <Dialog open={!!webhookDialog} onOpenChange={() => setWebhookDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook URL</DialogTitle>
            <DialogDescription>
              Configure esta URL no seu CRM para receber atualizações em tempo real.
              Sempre que um lead mudar de etapa ou for criado, o Dashblue será notificado automaticamente.
            </DialogDescription>
          </DialogHeader>
          {webhookDialog && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                <code className="flex-1 text-xs break-all">{getWebhookUrl(webhookDialog)}</code>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyWebhookUrl(webhookDialog)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <strong>Método:</strong> POST<br />
                  <strong>Content-Type:</strong> application/json<br />
                  <strong>Quando configurar:</strong> Em &quot;Webhooks&quot; ou &quot;Automações&quot; do seu CRM
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setWebhookDialog(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
