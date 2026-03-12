"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { FunnelStep } from "@/types";

interface FunnelBlockProps {
  steps: FunnelStep[];
  title?: string;
  onClick?: (step: FunnelStep) => void;
  loading?: boolean;
  vertical?: boolean;
}

export function FunnelBlock({
  steps,
  title,
  onClick,
  loading,
  vertical = true,
}: FunnelBlockProps) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-4">
        {title && <Skeleton className="h-4 w-32" />}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  const maxCount = Math.max(...steps.map((s) => s.count), 1);

  return (
    <div className="rounded-xl border bg-card p-5">
      {title && (
        <div className="mb-4 flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
        </div>
      )}

      <div className={cn(vertical ? "space-y-1" : "flex gap-4 items-end")}>
        {steps.map((step, i) => {
          const widthPct = (step.count / maxCount) * 100;

          return (
            <button
              key={step.key}
              type="button"
              className={cn(
                "w-full text-left rounded-lg px-3 py-2.5 transition-colors",
                onClick ? "cursor-pointer hover:bg-muted/50" : "cursor-default",
              )}
              onClick={() => onClick?.(step)}
              disabled={!onClick}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{step.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {step.count.toLocaleString("pt-BR")}
                  </span>
                  {i > 0 && step.conversionFromPrevious !== undefined && (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                      {step.conversionFromPrevious.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all duration-500 ease-out"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
