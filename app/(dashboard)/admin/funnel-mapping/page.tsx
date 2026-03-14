"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { useFunnelMappings, useUpsertFunnelMappings } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface LocalMapping {
  id: string;
  stepKey: string;
  stepLabel: string;
  crmField: string;
  crmValue: string;
}

export default function FunnelMappingPage() {
  const { data, isLoading, isError, refetch } = useFunnelMappings();
  const upsertMut = useUpsertFunnelMappings();
  const [local, setLocal] = useState<LocalMapping[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) {
      setLocal(data);
      setDirty(false);
    }
  }, [data]);

  function update(index: number, field: "crmField" | "crmValue", value: string) {
    setLocal((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setDirty(true);
  }

  function handleSave() {
    upsertMut.mutate(local, {
      onSuccess: () => setDirty(false),
    });
  }

  return (
    <AdminPageWrapper title="Mapeamento de Funil" description="Configure como as etapas do CRM mapeiam para o funil">
      {isError && <ErrorState onRetry={() => refetch()} />}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
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
                  <TableHead>Etapa</TableHead>
                  <TableHead>Campo CRM</TableHead>
                  <TableHead>Valor CRM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {local.map((m, i) => (
                  <TableRow key={m.id}>
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
            <Button size="sm" onClick={handleSave} disabled={!dirty || upsertMut.isPending}>
              {upsertMut.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Salvar mapeamento
            </Button>
            {upsertMut.isSuccess && !dirty && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Salvo com sucesso!
              </span>
            )}
          </div>
        </div>
      )}
    </AdminPageWrapper>
  );
}
