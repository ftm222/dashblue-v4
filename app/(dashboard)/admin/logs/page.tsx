"use client";

import { useState } from "react";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { useLogs } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 10;

const ACTION_LABELS: Record<string, string> = {
  login: "Login",
  sync: "Sincronização",
  config: "Configuração",
  export: "Exportação",
  invite: "Convite",
  error: "Erro",
  update: "Atualização",
  insert: "Criação",
  delete: "Exclusão",
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LogsPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = useLogs(page, PAGE_SIZE);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const logs = data?.data ?? [];

  return (
    <AdminPageWrapper title="Logs" description="Histórico de ações e eventos do sistema">
      {isError && <ErrorState onRetry={() => refetch()} />}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-4">
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="tabular-nums whitespace-nowrap text-sm">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{log.user}</TableCell>
                      <TableCell className="text-sm">{ACTION_LABELS[log.action] ?? log.action}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.details}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground tabular-nums">
                Página {page + 1} de {totalPages} ({data?.total ?? 0} registros)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminPageWrapper>
  );
}
