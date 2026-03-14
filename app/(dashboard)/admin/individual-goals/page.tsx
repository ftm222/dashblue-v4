"use client";

import { useState } from "react";
import { Check, ChevronRight, Pencil, X } from "lucide-react";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { usePeople, useUpsertIndividualGoal } from "@/lib/queries";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";
import type {
  Person,
  IndividualGoalConfig,
} from "@/types";
import { SDR_GOAL_METRICS, CLOSER_GOAL_METRICS } from "@/lib/goal-metrics";

function fmt(value: number, format: "currency" | "number"): string {
  if (format === "currency") {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return value.toLocaleString("pt-BR");
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
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
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {fmt(current, config.format)}
          </span>
        </div>

        {target > 0 ? (
          <div className="mt-1.5 flex items-center gap-3">
            <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-muted/80">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  done
                    ? "bg-emerald-500 dark:bg-emerald-400"
                    : high
                      ? "bg-amber-500 dark:bg-amber-400"
                      : "bg-primary/70",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className={cn(
                "shrink-0 text-[11px] font-medium tabular-nums",
                done
                  ? "text-emerald-600 dark:text-emerald-400"
                  : high
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground",
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
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
              onClick={handleSave}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            {target > 0 && (
              <span className="text-xs font-medium tabular-nums text-muted-foreground mr-1">
                {fmt(target, config.format)}
              </span>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                setInputValue(String(target || ""));
                setEditing(true);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
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
          {person.squad && (
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
              Squad {person.squad}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {goalConfigs.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i < defined
                  ? allDone
                    ? "bg-emerald-500 dark:bg-emerald-400"
                    : "bg-primary"
                  : "bg-muted-foreground/20",
              )}
            />
          ))}
          <span className="ml-1 text-[10px] tabular-nums text-muted-foreground">
            {defined}/{goalConfigs.length}
          </span>
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

export default function IndividualGoalsPage() {
  const { period } = usePeriodFilter();
  const { data: sdrs, isLoading: sdrsLoading, isError: sdrsError, refetch: refetchSdrs } = usePeople("sdr", period);
  const { data: closers, isLoading: closersLoading, isError: closersError, refetch: refetchClosers } = usePeople("closer", period);
  const upsertGoal = useUpsertIndividualGoal();

  const [targets, setTargets] = useState<Record<string, Record<string, number>>>({});

  function handleSaveTarget(personId: string, metric: string, value: number) {
    setTargets((prev) => ({
      ...prev,
      [personId]: { ...(prev[personId] ?? {}), [metric]: value },
    }));

    upsertGoal.mutate({
      personId,
      type: metric,
      target: value,
      periodStart: period.from.toISOString().slice(0, 10),
      periodEnd: period.to.toISOString().slice(0, 10),
    });
  }

  const isLoading = sdrsLoading || closersLoading;
  const isError = sdrsError || closersError;

  return (
    <AdminPageWrapper title="Metas Individuais" description="Defina metas de performance para cada SDR e Closer">
      {isError && (
        <ErrorState
          onRetry={() => {
            if (sdrsError) refetchSdrs();
            if (closersError) refetchClosers();
          }}
        />
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && !isError && (
        <Tabs defaultValue="sdrs" className="space-y-5">
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
        </Tabs>
      )}
    </AdminPageWrapper>
  );
}
