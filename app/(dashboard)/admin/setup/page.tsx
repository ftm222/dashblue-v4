"use client";

import { useState } from "react";
import Link from "next/link";
import { useSetupChecklist } from "@/lib/queries";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function FullChecklist() {
  const { data, isLoading } = useSetupChecklist();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const completed = data.filter((item) => item.completed).length;
  const percentage = Math.round((completed / data.length) * 100);

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Checklist de Configuração</h3>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {completed}/{data.length} ({percentage}%)
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3 py-1">
              <div className="flex items-center gap-2.5">
                <Checkbox checked={item.completed} disabled className="pointer-events-none" />
                <span className="text-sm">{item.label}</span>
              </div>
              <Link href={item.route}>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  Ir →
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SetupPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function handleConfirm() {
    setDialogOpen(false);
    setConfirmed(true);
  }

  return (
    <AdminPageWrapper title="Configuração" description="Gerencie a configuração inicial da plataforma">
      <FullChecklist />

      <div className="pt-4 space-y-3">
        <h3 className="text-base font-semibold">Zona de Perigo</h3>
        <Card className="border-red-200 dark:border-red-900/40">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium">Trocar CRM</p>
              <p className="text-xs text-muted-foreground">
                Desconectar CRM atual e conectar outro
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setDialogOpen(true)}>
              Trocar CRM
            </Button>
          </CardContent>
        </Card>

        {confirmed && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            CRM desconectado com sucesso. Configure a nova integração em Integrações.
          </p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar CRM</DialogTitle>
            <DialogDescription>
              Esta ação irá resetar todo o mapeamento de funil e o checklist de configuração
              voltará ao estado pendente. Você precisará reconfigurar todas as etapas após a
              troca. Tem certeza que deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Confirmar troca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
