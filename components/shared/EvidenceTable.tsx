"use client";

import { Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import type { EvidenceRecord } from "@/types";

interface EvidenceTableProps {
  records: EvidenceRecord[];
  loading?: boolean;
  onOpenCRM?: (url: string) => void;
  onCopyContact?: (text: string) => void;
  emptyMessage?: string;
}

const BADGE_STYLES: Record<string, string> = {
  assinado: "bg-emerald-500/15 text-emerald-700 border-transparent",
  pago: "bg-blue-500/15 text-blue-700 border-transparent",
  ticket_ausente: "bg-red-500/15 text-red-700 border-transparent",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function EvidenceTable({
  records,
  loading,
  onOpenCRM,
  onCopyContact,
  emptyMessage,
}: EvidenceTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <EmptyState
        title="Nenhuma evidência encontrada"
        description={
          emptyMessage ??
          "Ajuste os filtros ou verifique se há leads no CRM com os UTMs correspondentes."
        }
      />
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative w-full overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>SDR</TableHead>
              <TableHead>Closer</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Badges</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id} className="hover:bg-muted/40">
                <TableCell className="py-3 font-medium">
                  {r.contactName}
                </TableCell>
                <TableCell className="py-3 tabular-nums">
                  {r.phone ?? "—"}
                </TableCell>
                <TableCell className="py-3">{r.funnelStep}</TableCell>
                <TableCell className="py-3">{r.sdr ?? "—"}</TableCell>
                <TableCell className="py-3">{r.closer ?? "—"}</TableCell>
                <TableCell className="py-3 text-right tabular-nums">
                  {r.value !== undefined ? formatCurrency(r.value) : "—"}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {r.tags.map((tag, i) => (
                      <Badge key={`${tag}-${i}`} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {r.badges.map((badge, i) => (
                      <Badge
                        key={`${badge}-${i}`}
                        className={cn("text-[10px]", BADGE_STYLES[badge])}
                      >
                        {badge.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="py-3 tabular-nums whitespace-nowrap">
                  {formatDate(r.createdAt)}
                </TableCell>
                <TableCell className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onOpenCRM && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onOpenCRM(r.crmUrl)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Abrir CRM</TooltipContent>
                      </Tooltip>
                    )}
                    {onCopyContact && (r.phone || r.email) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              onCopyContact(r.phone ?? r.email ?? "")
                            }
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copiar contato</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
