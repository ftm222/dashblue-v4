"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const isChunkLoadError = (err: Error) =>
  err?.name === "ChunkLoadError" ||
  (typeof err?.message === "string" && err.message.toLowerCase().includes("loading chunk"));

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  const chunkError = isChunkLoadError(error);

  function handleReload() {
    if (chunkError) {
      // Hard refresh para limpar cache de chunks corrompidos
      window.location.reload();
    } else {
      reset();
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <h2 className="text-lg font-bold">Erro ao carregar</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {chunkError
            ? "Falha ao carregar os arquivos da página. Isso costuma ocorrer por cache desatualizado. Use Ctrl+Shift+R (ou Cmd+Shift+R no Mac) para recarregar forçando a limpeza do cache."
            : "Não foi possível carregar esta página. Isso pode ser temporário — tente novamente ou volte à página anterior."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 font-mono">
            Ref: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <Link href="/overview">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Overview
            </Button>
          </Link>
          <Button onClick={handleReload} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {chunkError ? "Recarregar página" : "Recarregar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
