"use client";

import { useState } from "react";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/lib/use-local-storage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FunnelMapping } from "@/types";

const INITIAL_MAPPINGS: FunnelMapping[] = [
  { stepKey: "leads", stepLabel: "Leads", crmField: "pipeline_status", crmValue: "Novo Lead" },
  { stepKey: "booked", stepLabel: "Agendados", crmField: "pipeline_status", crmValue: "Agendado" },
  { stepKey: "received", stepLabel: "Recebidos", crmField: "pipeline_status", crmValue: "Recebido" },
  { stepKey: "negotiation", stepLabel: "Negociação", crmField: "pipeline_status", crmValue: "Em Negociação" },
  { stepKey: "won", stepLabel: "Fechados", crmField: "pipeline_status", crmValue: "Ganho" },
];

export default function FunnelMappingPage() {
  const [mappings, setMappings] = useLocalStorage<FunnelMapping[]>("dashblue:funnel-mapping", INITIAL_MAPPINGS);
  const [saved, setSaved] = useState(false);

  function update(index: number, field: keyof FunnelMapping, value: string) {
    setMappings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setSaved(false);
  }

  return (
    <AdminPageWrapper title="Mapeamento de Funil" description="Configure como as etapas do CRM mapeiam para o funil">
      <div className="space-y-4">
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etapa</TableHead>
                <TableHead>Campo CRM</TableHead>
                <TableHead>Valor CRM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((m, i) => (
                <TableRow key={m.stepKey}>
                  <TableCell className="font-medium">{m.stepLabel}</TableCell>
                  <TableCell>
                    <Input
                      value={m.crmField}
                      onChange={(e) => update(i, "crmField", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={m.crmValue}
                      onChange={(e) => update(i, "crmValue", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => setSaved(true)}>
            Salvar mapeamento
          </Button>
          {saved && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              Salvo com sucesso!
            </span>
          )}
        </div>
      </div>
    </AdminPageWrapper>
  );
}
