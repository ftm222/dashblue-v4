"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  Phone,
  PhoneOff,
  Clock,
  Repeat,
  TrendingDown,
  PhoneCall,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CLOSER_GOAL_METRICS } from "@/lib/goal-metrics";
import type { Person, IndividualGoalTargets, CallMetrics, IndividualGoalConfig } from "@/types";

interface CloserAccordionListProps {
  closers: Person[];
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function fmt(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatVal(value: number, format: "currency" | "number"): string {
  if (format === "currency") {
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
    return `R$ ${value.toLocaleString("pt-BR")}`;
  }
  return value.toLocaleString("pt-BR");
}

function useGoalTargets(): IndividualGoalTargets {
  const [targets, setTargets] = useState<IndividualGoalTargets>({});
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("dashblue:individual-goals");
      if (raw) setTargets(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);
  return targets;
}

function CallMetricPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
      <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", color)}>
        <Icon className="h-3 w-3" />
      </div>
      <div>
        <p className="text-xs font-semibold tabular-nums leading-none">{value}</p>
        <p className="text-[9px] text-muted-foreground leading-none mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function GoalMiniRow({ config, current, target }: { config: IndividualGoalConfig; current: number; target: number }) {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const done = pct >= 100;
  const high = pct >= 70;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{config.label}</span>
        <span className={cn(
          "text-[11px] font-medium tabular-nums",
          done ? "text-emerald-600 dark:text-emerald-400"
            : high ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground",
        )}>
          {formatVal(current, config.format)} / {formatVal(target, config.format)} ({pct}%)
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            done ? "bg-emerald-500 dark:bg-emerald-400"
              : high ? "bg-amber-500 dark:bg-amber-400"
                : "bg-primary/70",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AccordionItem({ closer, allTargets }: { closer: Person; allTargets: IndividualGoalTargets }) {
  const [open, setOpen] = useState(false);
  const cm = closer.callMetrics;
  const personTargets = allTargets[closer.id] ?? {};

  const revenue = closer.kpis.find((k) => k.key === "revenue")?.value ?? 0;
  const won = closer.kpis.find((k) => k.key === "won")?.value ?? 0;
  const received = closer.kpis.find((k) => k.key === "received")?.value ?? 0;
  const conversion = received > 0 ? ((won / received) * 100).toFixed(0) : "0";

  const goalsWithTargets = CLOSER_GOAL_METRICS.filter((g) => (personTargets[g.metric] ?? 0) > 0);

  return (
    <div className={cn("border-b border-border/50 last:border-0 transition-colors", open && "bg-muted/[0.03]")}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/20"
      >
        <Avatar className="h-8 w-8 rounded-lg shrink-0">
          <AvatarImage src={closer.avatarUrl} alt={closer.name} />
          <AvatarFallback className="rounded-lg text-[10px] font-medium bg-primary/10 text-primary">
            {initials(closer.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">{closer.name}</span>
            {closer.squad && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0">
                {closer.squad}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground tabular-nums">
            <span>{fmt(revenue)}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{won} contratos</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{conversion}% conv.</span>
            {cm && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="flex items-center gap-0.5">
                  <Phone className="h-2.5 w-2.5" /> {cm.totalCalls}
                </span>
              </>
            )}
          </div>
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Content */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-4 space-y-4">
            {/* Call metrics */}
            {cm && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                  Ligações
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <CallMetricPill icon={Phone} label="Total" value={cm.totalCalls.toString()} color="bg-primary/10 text-primary" />
                  <CallMetricPill icon={PhoneCall} label="Atendidas" value={cm.answeredCalls.toString()} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
                  <CallMetricPill icon={PhoneOff} label="Não atendidas" value={cm.missedCalls.toString()} color="bg-red-500/10 text-red-600 dark:text-red-400" />
                  <CallMetricPill icon={Clock} label="Duração média" value={`${cm.avgDurationMinutes.toFixed(0)} min`} color="bg-violet-500/10 text-violet-600 dark:text-violet-400" />
                  <CallMetricPill icon={TrendingDown} label="Calls p/ fechar" value={cm.callsToClose.toFixed(1)} color="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
                  <CallMetricPill icon={Repeat} label="Follow-ups" value={cm.followUps.toString()} color="bg-sky-500/10 text-sky-600 dark:text-sky-400" />
                </div>
              </div>
            )}

            {/* Individual goals */}
            {goalsWithTargets.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                  Metas
                </p>
                <div className="space-y-2.5">
                  {goalsWithTargets.map((config) => {
                    const current = closer.kpis.find((k) => k.key === config.metric)?.value ?? 0;
                    const target = personTargets[config.metric] ?? 0;
                    return <GoalMiniRow key={config.metric} config={config} current={current} target={target} />;
                  })}
                </div>
              </div>
            )}

            {/* KPIs summary */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                Indicadores
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
                {closer.kpis.map((kpi) => (
                  <div key={kpi.key} className="flex items-baseline justify-between py-0.5">
                    <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
                    <span className="text-[11px] font-medium tabular-nums">
                      {kpi.format === "currency"
                        ? fmt(kpi.value)
                        : kpi.format === "percent"
                          ? `${kpi.value}%`
                          : kpi.value.toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CloserAccordionList({ closers }: CloserAccordionListProps) {
  const allTargets = useGoalTargets();

  const sorted = useMemo(
    () =>
      [...closers].sort((a, b) => {
        const ra = a.kpis.find((k) => k.key === "revenue")?.value ?? 0;
        const rb = b.kpis.find((k) => k.key === "revenue")?.value ?? 0;
        return rb - ra;
      }),
    [closers],
  );

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Detalhe por Closer
          </h3>
        </div>
      </div>
      {sorted.map((closer) => (
        <AccordionItem key={closer.id} closer={closer} allTargets={allTargets} />
      ))}
    </div>
  );
}
