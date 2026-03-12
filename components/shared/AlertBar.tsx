"use client";

import Link from "next/link";
import { AlertTriangle, Info, X, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Alert } from "@/types";

interface AlertBarProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
}

const PRIORITY: Record<Alert["type"], number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

const STYLES: Record<Alert["type"], string> = {
  critical: "bg-red-600 text-white",
  warning: "bg-amber-500 text-amber-950",
  info: "bg-blue-600 text-white",
};

const ICONS: Record<Alert["type"], typeof XCircle> = {
  critical: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export function AlertBar({ alerts, onDismiss }: AlertBarProps) {
  if (alerts.length === 0) return null;

  const sorted = [...alerts].sort(
    (a, b) => PRIORITY[b.type] - PRIORITY[a.type],
  );
  const top = sorted[0];
  const remaining = sorted.length - 1;
  const Icon = ICONS[top.type];

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 animate-fade-in",
        STYLES[top.type],
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />

      <span className="flex-1 text-sm font-medium truncate">
        {top.message}
      </span>

      {top.link && (
        <Link
          href={top.link}
          className="text-sm underline underline-offset-2 shrink-0"
        >
          Ver mais
        </Link>
      )}

      {remaining > 0 && (
        <Badge variant="secondary" className="shrink-0 text-xs">
          +{remaining}
        </Badge>
      )}

      {top.dismissible && onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 hover:bg-white/20"
          onClick={() => onDismiss(top.id)}
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Fechar</span>
        </Button>
      )}
    </div>
  );
}
