"use client";

import { Suspense } from "react";
import { Table2 } from "lucide-react";
import { EvidencePageContent } from "@/features/evidence/EvidencePageContent";
import { PageSkeleton } from "@/components/shared/DrawerSkeleton";

export default function EvidencePage() {
  return (
    <div className="w-full px-6 py-6 space-y-4">
      <div>
        <div className="flex items-center gap-2.5">
          <Table2 className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">Evidências</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Registros detalhados de leads e negociações
        </p>
      </div>

      <Suspense fallback={<PageSkeleton />}>
        <EvidencePageContent />
      </Suspense>
    </div>
  );
}
