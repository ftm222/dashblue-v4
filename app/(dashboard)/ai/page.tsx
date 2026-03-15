"use client";

import { Brain } from "lucide-react";
import { DiagnosticsList } from "@/features/ai-diagnosis/DiagnosticsList";

export default function AIDiagnosisPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="rounded-lg bg-slate-50/80 dark:bg-slate-900/40 p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Diagnóstico AI</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Análise automatizada baseada em evidências
          </p>
        </div>

        <DiagnosticsList />

        <p className="text-xs text-muted-foreground/70 text-center pt-2">
          Toda conclusão é baseada em dados reais. Clique em &quot;Ver evidências&quot; para validar.
        </p>
      </div>
    </div>
  );
}
