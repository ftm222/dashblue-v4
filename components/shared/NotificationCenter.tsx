"use client";

import Link from "next/link";
import { AlertTriangle, Bell, Info, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Alert } from "@/types";

interface NotificationCenterProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
}

const ICON_MAP: Record<Alert["type"], typeof XCircle> = {
  critical: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const DOT_COLORS: Record<Alert["type"], string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

const CARD_STYLES: Record<Alert["type"], string> = {
  critical:
    "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30",
  warning:
    "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30",
  info: "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30",
};

const ICON_COLORS: Record<Alert["type"], string> = {
  critical: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
};

const PRIORITY: Record<Alert["type"], number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

export function NotificationCenter({
  alerts,
  onDismiss,
}: NotificationCenterProps) {
  const sorted = [...alerts].sort(
    (a, b) => PRIORITY[b.type] - PRIORITY[a.type],
  );
  const count = alerts.length;
  const hasCritical = alerts.some((a) => a.type === "critical");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Notificações"
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
                hasCritical ? "bg-red-500" : "bg-amber-500",
              )}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notificações</h3>
          {count > 0 && (
            <span className="text-xs text-muted-foreground">
              {count} {count === 1 ? "alerta" : "alertas"}
            </span>
          )}
        </div>

        <ScrollArea className="max-h-72">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-3">
              {sorted.map((alert) => {
                const Icon = ICON_MAP[alert.type];
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "relative flex gap-3 rounded-lg border p-3",
                      CARD_STYLES[alert.type],
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 shrink-0",
                        ICON_COLORS[alert.type],
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-medium leading-snug">
                        {alert.message}
                      </p>
                      {alert.link && (
                        <Link
                          href={alert.link}
                          className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
                        >
                          Ver detalhes
                        </Link>
                      )}
                    </div>

                    {alert.dismissible && onDismiss && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0 opacity-60 hover:opacity-100"
                        onClick={() => onDismiss(alert.id)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Fechar</span>
                      </Button>
                    )}

                    <div
                      className={cn(
                        "absolute left-0 top-3 h-2 w-2 -translate-x-1/2 rounded-full",
                        DOT_COLORS[alert.type],
                      )}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
