"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h2 className="text-lg font-bold">Algo deu errado</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ocorreu um erro inesperado. Tente recarregar a página ou entre em contato com o suporte
          se o problema persistir.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 font-mono">
            Código: {error.digest}
          </p>
        )}
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
