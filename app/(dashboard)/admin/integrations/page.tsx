"use client";

import { useIntegrations } from "@/lib/queries";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";

const STATUS_CONFIG = {
  connected: { label: "Conectado", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent" },
  disconnected: { label: "Desconectado", className: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-transparent" },
  error: { label: "Erro", className: "bg-red-500/15 text-red-700 dark:text-red-400 border-transparent" },
} as const;

export default function IntegrationsPage() {
  const { data, isLoading, isError, refetch } = useIntegrations();

  return (
    <AdminPageWrapper title="Integrações" description="Conecte suas fontes de dados">
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && <ErrorState onRetry={() => refetch()} />}

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((integration) => {
            const status = STATUS_CONFIG[integration.status];
            const isConnected = integration.status === "connected";

            return (
              <Card key={integration.id}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{integration.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{integration.type}</p>
                    </div>
                    <Badge className={status.className}>{status.label}</Badge>
                  </div>

                  {integration.lastSync && (
                    <p className="text-xs text-muted-foreground">
                      Última sincronização:{" "}
                      {new Date(integration.lastSync).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}

                  <Button
                    variant={isConnected ? "outline" : "default"}
                    size="sm"
                    className="w-full"
                  >
                    {isConnected ? "Desconectar" : "Conectar"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AdminPageWrapper>
  );
}
