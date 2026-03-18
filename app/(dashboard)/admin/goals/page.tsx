"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  DollarSign,
  CalendarCheck,
  Loader2,
  Check,
  Pencil,
  X,
  Plus,
  Target,
  Crosshair,
} from "lucide-react";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import {
  useGoals,
  useUpdateGoalTarget,
  useInsertTeamGoal,
  usePeople,
  useUpsertIndividualGoal,
  useSquads,
  useAllPeople,
} from "@/lib/queries";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";
import type { Goal, Person, IndividualGoalConfig, PersonWithSquad } from "@/types";
import { SDR_GOAL_METRICS, CLOSER_GOAL_METRICS } from "@/lib/goal-metrics";

const GOAL_CONFIG = {
  revenue: { label: "Receita", icon: DollarSign, format: formatCurrency },
  booked: { label: "Agendados", icon: CalendarCheck, format: (v: number) => String(v) },
} as const;

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmt(value: number, format: "currency" | "number"): string {
  if (format === "currency") {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return value.toLocaleString("pt-BR");
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function GoalsPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"gerais" | "individuais">("gerais");

  useEffect(() => {
    if (tabParam === "individuais") setActiveTab("individuais");
    else if (tabParam === "gerais") setActiveTab("gerais");
  }, [tabParam]);

  return (
    <AdminPageWrapper
      title="Metas"
      description="Defina e acompanhe metas gerais do período e metas individuais para SDRs e Closers"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "gerais" | "individuais")}>
        <TabsList className="mb-4">
          <TabsTrigger value="gerais" className="gap-2">
            <Target className="h-4 w-4" />
            Metas gerais
          </TabsTrigger>
          <TabsTrigger value="individuais" className="gap-2">
            <Crosshair className="h-4 w-4" />
            Metas individuais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gerais">
          <MetasGeraisTab />
        </TabsContent>

        <TabsContent value="individuais">
          <MetasIndividuaisTab />
        </TabsContent>
      </Tabs>
    </AdminPageWrapper>
  );
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
    if (!isNaN(parsed) && parsed > 0) onSave(parsed);
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
              <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="h-8 text-sm" />
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
                <p className="text-sm font-medium tabular-nums text-muted-foreground">{config.format(goal.target)}</p>
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

function MetasGeraisTab() {
  const { period } = usePeriodFilter();
  const { data, isLoading, isError, refetch } = useGoals(period);
  const { data: squads } = useSquads();
  const updateMut = useUpdateGoalTarget();
  const insertMut = useInsertTeamGoal();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState<"revenue" | "booked">("revenue");
  const [newTarget, setNewTarget] = useState("");
  const [newRole, setNewRole] = useState<"sdr" | "closer" | "org">("org");
  const [newSquadId, setNewSquadId] = useState<string>("");
  const [newDescription, setNewDescription] = useState("");

  function handleSaveGoal(goalId: string, value: number) {
    updateMut.mutate({ goalId, target: value });
  }

  function handleAddGoal() {
    const parsed = Number(newTarget);
    if (isNaN(parsed) || parsed <= 0) return;
    const periodStart = period.from.toISOString().slice(0, 10);
    const periodEnd = period.to.toISOString().slice(0, 10);
    insertMut.mutate(
      {
        type: newType,
        target: parsed,
        periodStart,
        periodEnd,
        role: newRole === "org" ? undefined : newRole,
        squadId: newSquadId || undefined,
        description: newDescription.trim() || undefined,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setNewTarget("");
          setNewDescription("");
          setNewSquadId("");
        },
      },
    );
  }

  const availableTypes = useMemo(() => ["revenue", "booked"] as const, []);

  useEffect(() => {
    if (dialogOpen && !availableTypes.includes(newType)) {
      setNewType(availableTypes[0]);
    }
  }, [dialogOpen, newType, availableTypes]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setDialogOpen(true)}
          disabled={insertMut.isPending}
        >
          <Plus className="h-4 w-4" />
          Adicionar meta
        </Button>
      </div>

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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar nova meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Público-alvo</Label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as "sdr" | "closer" | "org")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="org">Organização (todos)</option>
                <option value="sdr">SDR</option>
                <option value="closer">Closer</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Equipe</Label>
              <select
                value={newSquadId}
                onChange={(e) => setNewSquadId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Todas as equipes</option>
                {(squads ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as "revenue" | "booked")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {availableTypes.map((t) => (
                  <option key={t} value={t}>
                    {GOAL_CONFIG[t].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Valor da meta</Label>
              <Input
                type="number"
                min={1}
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder={newType === "revenue" ? "Ex: 50000" : "Ex: 100"}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descreva do que se trata esta meta..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddGoal}
              disabled={!newTarget || Number(newTarget) <= 0 || insertMut.isPending}
            >
              {insertMut.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface GoalRowProps {
  config: IndividualGoalConfig;
  current: number;
  target: number;
  onSave: (value: number) => void;
}

function GoalRow({ config, current, target, onSave }: GoalRowProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(target || ""));
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const done = pct >= 100;
  const high = pct >= 70;

  function handleSave() {
    const parsed = Number(inputValue);
    if (!isNaN(parsed) && parsed > 0) onSave(parsed);
    setEditing(false);
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{config.label}</span>
          <span className="text-[11px] tabular-nums text-muted-foreground">{fmt(current, config.format)}</span>
        </div>
        {target > 0 ? (
          <div className="mt-1.5 flex items-center gap-3">
            <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-muted/80">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  done ? "bg-emerald-500 dark:bg-emerald-400" : high ? "bg-amber-500 dark:bg-amber-400" : "bg-primary/70",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className={cn(
                "shrink-0 text-[11px] font-medium tabular-nums",
                done ? "text-emerald-600 dark:text-emerald-400" : high ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
              )}
            >
              {pct}%
            </span>
          </div>
        ) : (
          <p className="mt-1 text-[11px] text-muted-foreground/50">Nenhuma meta definida</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {editing ? (
          <>
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-7 w-24 text-xs rounded-md border-primary/30 focus-visible:ring-primary/20"
              placeholder="Meta"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400" onClick={handleSave}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            {target > 0 ? (
              <span className="text-xs font-medium tabular-nums text-muted-foreground mr-1">{fmt(target, config.format)}</span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  setInputValue("");
                  setEditing(true);
                }}
              >
                Definir meta
              </Button>
            )}
            {target > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  setInputValue(String(target));
                  setEditing(true);
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface PersonGoalCardProps {
  person: Person;
  goalConfigs: IndividualGoalConfig[];
  targets: Record<string, number>;
  onSaveTarget: (personId: string, metric: string, value: number) => void;
}

function PersonGoalCard({ person, goalConfigs, targets, onSaveTarget }: PersonGoalCardProps) {
  const defined = goalConfigs.filter((c) => (targets[c.metric] ?? 0) > 0).length;
  const allDone = defined === goalConfigs.length;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={person.avatarUrl} alt={person.name} />
          <AvatarFallback className="text-[10px] font-medium bg-muted">{initials(person.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{person.name}</p>
          {person.squad && <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Squad {person.squad}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {goalConfigs.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i < defined ? (allDone ? "bg-emerald-500 dark:bg-emerald-400" : "bg-primary") : "bg-muted-foreground/20",
              )}
            />
          ))}
          <span className="ml-1 text-[10px] tabular-nums text-muted-foreground">{defined}/{goalConfigs.length}</span>
        </div>
      </div>
      <div className="divide-y divide-border/50 px-1">
        {goalConfigs.map((config) => {
          const kpi = person.kpis.find((k) => k.key === config.metric);
          return (
            <GoalRow
              key={config.metric}
              config={config}
              current={kpi?.value ?? 0}
              target={targets[config.metric] ?? 0}
              onSave={(value) => onSaveTarget(person.id, config.metric, value)}
            />
          );
        })}
      </div>
    </div>
  );
}

const ALL_INDIVIDUAL_METRICS = [...SDR_GOAL_METRICS, ...CLOSER_GOAL_METRICS];

function MetasIndividuaisTab() {
  const { period } = usePeriodFilter();
  const { data: sdrs, isLoading: sdrsLoading, isError: sdrsError, refetch: refetchSdrs } = usePeople("sdr", period);
  const { data: closers, isLoading: closersLoading, isError: closersError, refetch: refetchClosers } = usePeople("closer", period);
  const { data: allPeople } = useAllPeople();
  const { data: squads } = useSquads();
  const upsertGoal = useUpsertIndividualGoal();
  const [targets, setTargets] = useState<Record<string, Record<string, number>>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<"sdr" | "closer">("sdr");
  const [newPersonId, setNewPersonId] = useState("");
  const [newSquadId, setNewSquadId] = useState("");
  const [newType, setNewType] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const peopleByRole = ((allPeople ?? []) as PersonWithSquad[]).filter((p) => p.role === newRole);
  const configsByRole = newRole === "sdr" ? SDR_GOAL_METRICS : CLOSER_GOAL_METRICS;
  const metricLabels = Object.fromEntries(ALL_INDIVIDUAL_METRICS.map((c) => [c.metric, c.label]));

  function handleSaveTarget(personId: string, metric: string, value: number) {
    setTargets((prev) => ({ ...prev, [personId]: { ...(prev[personId] ?? {}), [metric]: value } }));
    upsertGoal.mutate({ personId, type: metric, target: value, periodStart: period.from.toISOString().slice(0, 10), periodEnd: period.to.toISOString().slice(0, 10) });
  }

  function handleAddIndividualGoal() {
    const parsed = Number(newTarget);
    if (!newPersonId || isNaN(parsed) || parsed <= 0 || !newType) return;
    const periodStart = period.from.toISOString().slice(0, 10);
    const periodEnd = period.to.toISOString().slice(0, 10);
    upsertGoal.mutate(
      {
        personId: newPersonId,
        type: newType,
        target: parsed,
        periodStart,
        periodEnd,
        role: newRole,
        squadId: newSquadId || undefined,
        description: newDescription.trim() || undefined,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setNewPersonId("");
          setNewSquadId("");
          setNewType("");
          setNewTarget("");
          setNewDescription("");
          setTargets((prev) => ({ ...prev, [newPersonId]: { ...(prev[newPersonId] ?? {}), [newType]: parsed } }));
        },
      },
    );
  }

  useEffect(() => {
    if (dialogOpen && configsByRole.length > 0 && !configsByRole.some((c) => c.metric === newType)) {
      setNewType(configsByRole[0].metric);
    }
  }, [dialogOpen, configsByRole, newType]);

  useEffect(() => {
    if (dialogOpen && peopleByRole.length > 0 && !peopleByRole.some((p) => p.id === newPersonId)) {
      setNewPersonId("");
    }
  }, [dialogOpen, newRole, peopleByRole, newPersonId]);

  const isLoading = sdrsLoading || closersLoading;
  const isError = sdrsError || closersError;

  if (isError) {
    return <ErrorState onRetry={() => { if (sdrsError) refetchSdrs(); if (closersError) refetchClosers(); }} />;
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="sdrs" className="space-y-5">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)} disabled={upsertGoal.isPending}>
          <Plus className="h-4 w-4" />
          Cadastrar metas
        </Button>
      </div>
      <TabsList className="h-9">
        <TabsTrigger value="sdrs" className="gap-1.5 text-xs px-4">
          SDRs
          <span className="ml-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
            {sdrs?.length ?? 0}
          </span>
        </TabsTrigger>
        <TabsTrigger value="closers" className="gap-1.5 text-xs px-4">
          Closers
          <span className="ml-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
            {closers?.length ?? 0}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sdrs">
        {sdrs && sdrs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {sdrs.map((person) => (
              <PersonGoalCard
                key={person.id}
                person={person}
                goalConfigs={SDR_GOAL_METRICS}
                targets={targets[person.id] ?? {}}
                onSaveTarget={handleSaveTarget}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhum SDR encontrado no período.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="closers">
        {closers && closers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {closers.map((person) => (
              <PersonGoalCard
                key={person.id}
                person={person}
                goalConfigs={CLOSER_GOAL_METRICS}
                targets={targets[person.id] ?? {}}
                onSaveTarget={handleSaveTarget}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhum Closer encontrado no período.</p>
          </div>
        )}
      </TabsContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar meta individual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Público-alvo</Label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as "sdr" | "closer")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="sdr">SDR</option>
                <option value="closer">Closer</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Equipe</Label>
              <select
                value={newSquadId}
                onChange={(e) => setNewSquadId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Todas as equipes</option>
                {(squads ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Pessoa</Label>
              <select
                value={newPersonId}
                onChange={(e) => setNewPersonId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Selecione a pessoa</option>
                {peopleByRole.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.squads?.name ? ` (${p.squads.name})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de meta</Label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Selecione</option>
                {configsByRole.map((c) => (
                  <option key={c.metric} value={c.metric}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Valor da meta</Label>
              <Input
                type="number"
                min={1}
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="Ex: 10 ou 50000"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descreva do que se trata esta meta..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddIndividualGoal}
              disabled={!newPersonId || !newType || !newTarget || Number(newTarget) <= 0 || upsertGoal.isPending}
            >
              {upsertGoal.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <GoalsPageContent />
    </Suspense>
  );
}
