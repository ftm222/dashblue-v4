"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RankingItem {
  id: string;
  name: string;
  avatarUrl?: string;
  value: number;
  format: "currency" | "number";
}

interface RankingBlockProps {
  title: string;
  items: RankingItem[];
  onItemClick?: (id: string) => void;
  loading?: boolean;
  limit?: number;
}

function formatRankValue(value: number, format: "currency" | "number"): string {
  if (format === "currency") {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return value.toLocaleString("pt-BR");
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const RANK_COLORS = [
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-slate-400/15 text-slate-500 dark:text-slate-400",
  "bg-orange-500/15 text-orange-600 dark:text-orange-400",
];

export function RankingBlock({
  title,
  items,
  onItemClick,
  loading,
  limit = 5,
}: RankingBlockProps) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <Skeleton className="h-3 w-28" />
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const visible = items.slice(0, limit);
  const maxValue = Math.max(...visible.map((i) => i.value), 1);

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      </div>

      <ol className="space-y-1">
        {visible.map((item, i) => {
          const rank = i + 1;
          const isTop3 = rank <= 3;
          const barWidth = (item.value / maxValue) * 100;

          return (
            <li key={item.id}>
              <button
                type="button"
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                  "hover:bg-muted/40",
                  onItemClick && "cursor-pointer",
                )}
                onClick={() => onItemClick?.(item.id)}
                disabled={!onItemClick}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold tabular-nums",
                    isTop3 ? RANK_COLORS[i] : "text-muted-foreground/50",
                  )}
                >
                  {rank}
                </span>

                <Avatar className="h-7 w-7 rounded-lg">
                  {item.avatarUrl && <AvatarImage src={item.avatarUrl} alt={item.name} />}
                  <AvatarFallback className="rounded-lg text-[9px] font-medium bg-muted">
                    {initials(item.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <span className="block truncate text-sm font-medium">{item.name}</span>
                  <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-primary/40 transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
                  {formatRankValue(item.value, item.format)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
