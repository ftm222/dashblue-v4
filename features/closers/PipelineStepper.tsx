"use client";

import { cn } from "@/lib/utils";

interface PipelineStep {
  key: string;
  label: string;
  count: number;
}

interface PipelineStepperProps {
  steps: PipelineStep[];
  onStepClick?: (step: PipelineStep) => void;
}

export function PipelineStepper({ steps, onStepClick }: PipelineStepperProps) {
  const maxCount = Math.max(...steps.map((s) => s.count), 1);

  return (
    <div className="flex items-start justify-between gap-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const intensity = step.count / maxCount;
        const isActive = step.count > 0;

        return (
          <div key={step.key} className="flex flex-1 items-start">
            <button
              type="button"
              className={cn(
                "group flex flex-col items-center gap-2 transition-transform",
                onStepClick && "cursor-pointer hover:scale-105",
              )}
              onClick={() => onStepClick?.(step)}
              disabled={!onStepClick}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold tabular-nums transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:bg-primary/15 group-hover:ring-primary/30"
                    : "bg-muted text-muted-foreground/50 ring-1 ring-border",
                )}
                style={
                  isActive
                    ? { opacity: Math.max(0.6, intensity) }
                    : undefined
                }
              >
                {step.count}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium text-center leading-tight max-w-[5rem]",
                  isActive ? "text-foreground" : "text-muted-foreground/60",
                )}
              >
                {step.label}
              </span>
            </button>

            {!isLast && (
              <div className="mt-5 flex flex-1 items-center px-2">
                <div className="relative h-px w-full">
                  <div className="absolute inset-0 bg-border" />
                  {isActive && steps[i + 1]?.count > 0 && (
                    <div className="absolute inset-0 bg-primary/30" />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
