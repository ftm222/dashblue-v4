"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MasterDetailItem {
  id: string;
  name: string;
  avatarUrl?: string;
  subtitle?: string;
  value?: number;
  valueFormat?: string;
}

interface MasterDetailRailProps {
  items: MasterDetailItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  searchable?: boolean;
  loading?: boolean;
  title?: string;
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function formatItemValue(value: number, format?: string): string {
  if (format === "currency") {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (format === "percent") {
    return `${value.toFixed(1)}%`;
  }
  return value.toLocaleString("pt-BR");
}

export function MasterDetailRail({
  items,
  selectedId,
  onSelect,
  searchable,
  loading,
  title,
}: MasterDetailRailProps) {
  const [query, setQuery] = useState("");

  const filtered = searchable
    ? items.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  if (loading) {
    return (
      <aside className="w-72 shrink-0 border-r bg-card/50">
        {title && (
          <div className="px-4 pt-5 pb-2">
            <Skeleton className="h-4 w-24" />
          </div>
        )}
        {searchable && (
          <div className="px-4 pb-3">
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        )}
        <div className="space-y-1 px-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2.5">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 shrink-0 border-r bg-card/50 flex flex-col">
      {title && (
        <div className="px-4 pt-5 pb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h2>
        </div>
      )}

      {searchable && (
        <div className="px-3 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-8 text-xs rounded-lg border-transparent bg-muted/50 focus-visible:bg-background focus-visible:border-border placeholder:text-muted-foreground/40"
            />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="space-y-0.5 px-3 pb-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-all duration-150",
                "hover:bg-muted/50",
                selectedId === item.id
                  ? "bg-primary/8 shadow-sm ring-1 ring-primary/15"
                  : "ring-0",
              )}
              onClick={() => onSelect(item.id)}
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {item.avatarUrl && (
                  <AvatarImage src={item.avatarUrl} alt={item.name} />
                )}
                <AvatarFallback className="rounded-lg text-[10px] font-medium bg-muted">
                  {initials(item.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                {item.subtitle && (
                  <p className="truncate text-[11px] text-muted-foreground/60">
                    {item.subtitle}
                  </p>
                )}
              </div>

              {item.value !== undefined && (
                <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground/70">
                  {formatItemValue(item.value, item.valueFormat)}
                </span>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
