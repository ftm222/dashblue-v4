"use client";

import { useState } from "react";
import { DollarSign, CalendarCheck, Loader2 } from "lucide-react";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useGoals, useUpdateGoalTarget } from "@/lib/queries";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import type { Goal } from "@/types";

const GOAL_CONFIG = {
  revenue: { label: "Receita", icon: DollarSign, format: formatCurrency },
  booked: { label: "Agendados", icon: CalendarCheck, format: (v: number) => String(v) },
} as const;

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function GoalCard({ goal, onSave, saving }: { goal: Goal; onSave: (value: number) => void; saving: boolean }) {
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState(String(goal.target));
  const config = GOAL_CONFIG[goal.type as keyof typeof GOAL_CONFIG];
  if (!config) return null;
  const Icon = config.icon;
  const percentage = Math.min(Math.round((goal.current / goal.target) * 100), 100);

  function save() {
    const parsed = Number(target);
    if (!isNaN(parsed) && parsed > 0) {
      onSave(parsed);
    }
    setEditing(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{config.label}</CardTitle>
          </div>
          {!editing && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(true)}>
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {editing ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Meta</Label>
              <Input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Salvar
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Atual</p>
                <p className="text-lg font-bold tabular-nums">{config.format(goal.current)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Meta</p>
                <p className="text-sm font-medium tabular-nums text-muted-foreground">
                  {config.format(goal.target)}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <Progress value={percentage} className="h-2" />
              <p className="text-xs text-muted-foreground text-right tabular-nums">{percentage}%</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function GoalsPage() {
  const { period } = usePeriodFilter();
  const { data, isLoading, isError, refetch } = useGoals(period);
  const updateMut = useUpdateGoalTarget();

  function handleSaveGoal(goalId: string, value: number) {
    updateMut.mutate({ goalId, target: value });
  }

  return (
    <AdminPageWrapper title="Metas" description="Defina e acompanhe suas metas do período">
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      )}

      {isError && <ErrorState onRetry={() => refetch()} />}

      {data && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onSave={(value) => handleSaveGoal(goal.id, value)}
              saving={updateMut.isPending}
            />
          ))}
        </div>
      )}
    </AdminPageWrapper>
  );
}
