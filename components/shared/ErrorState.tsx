"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Erro ao carregar dados",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>

      <h3 className="text-base font-semibold text-foreground">{title}</h3>

      {message && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {message}
        </p>
      )}

      {onRetry && (
        <Button variant="outline" className="mt-4" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
