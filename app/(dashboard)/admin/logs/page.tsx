"use client";

import { useState } from "react";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

const MOCK_LOGS: LogEntry[] = [
  { id: "1", timestamp: "2026-02-27T14:30:00", user: "Lucas Silva", action: "login", details: "Login via email" },
  { id: "2", timestamp: "2026-02-27T14:25:00", user: "Mariana Santos", action: "sync", details: "Sincronização manual com Kommo CRM" },
  { id: "3", timestamp: "2026-02-27T13:50:00", user: "Lucas Silva", action: "config", details: "Alterou mapeamento de funil: etapa 'Negociação'" },
  { id: "4", timestamp: "2026-02-27T12:00:00", user: "Sistema", action: "sync", details: "Sincronização automática Meta Ads concluída" },
  { id: "5", timestamp: "2026-02-27T11:30:00", user: "Pedro Oliveira", action: "export", details: "Exportou CSV de evidências (150 registros)" },
  { id: "6", timestamp: "2026-02-26T18:00:00", user: "Mariana Santos", action: "config", details: "Atualizou meta de receita para R$ 500.000" },
  { id: "7", timestamp: "2026-02-26T16:45:00", user: "Lucas Silva", action: "invite", details: "Convidou Ana Souza como viewer" },
  { id: "8", timestamp: "2026-02-26T15:20:00", user: "Sistema", action: "error", details: "Falha na sincronização Google Ads: timeout" },
  { id: "9", timestamp: "2026-02-26T10:00:00", user: "Sistema", action: "sync", details: "Sincronização automática Kommo CRM concluída" },
  { id: "10", timestamp: "2026-02-25T17:30:00", user: "Lucas Silva", action: "config", details: "Conectou integração Meta Ads" },
  { id: "11", timestamp: "2026-02-25T16:00:00", user: "Mariana Santos", action: "login", details: "Login via email" },
  { id: "12", timestamp: "2026-02-25T14:15:00", user: "Sistema", action: "sync", details: "Primeira sincronização Kommo CRM concluída" },
];

const PAGE_SIZE = 5;

const ACTION_LABELS: Record<string, string> = {
  login: "Login",
  sync: "Sincronização",
  config: "Configuração",
  export: "Exportação",
  invite: "Convite",
  error: "Erro",
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

  const totalPages = Math.ceil(MOCK_LOGS.length / PAGE_SIZE);
  const paginated = MOCK_LOGS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <AdminPageWrapper title="Logs" description="Histórico de ações e eventos do sistema">
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
              {paginated.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="tabular-nums whitespace-nowrap text-sm">
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{log.user}</TableCell>
                  <TableCell className="text-sm">{ACTION_LABELS[log.action] ?? log.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground tabular-nums">
            Página {page + 1} de {totalPages}
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
      </div>
    </AdminPageWrapper>
  );
}
