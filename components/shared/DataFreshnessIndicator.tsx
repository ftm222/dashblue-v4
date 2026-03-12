"use client";

import { useDataFreshness } from "@/providers/DataFreshnessProvider";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  fresh: {
    dot: "bg-emerald-500",
    animate: false,
    label: "Atualizado agora",
  },
  warning: {
    dot: "bg-yellow-500",
    animate: false,
    label: (s: number) => `Atualizado há ${s}s`,
  },
  critical: {
    dot: "bg-red-500",
    animate: true,
    label: (s: number) => `Atualizado há ${Math.floor(s / 60)}min`,
  },
  unknown: {
    dot: "bg-gray-400",
    animate: false,
    label: "Sem dados",
  },
} as const;

export function DataFreshnessIndicator() {
  const { status, secondsSinceSync } = useDataFreshness();
  const config = STATUS_CONFIG[status];

  const label =
    typeof config.label === "function"
      ? config.label(secondsSinceSync)
      : config.label;

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full",
          config.dot,
          config.animate && "animate-pulse-dot",
        )}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
