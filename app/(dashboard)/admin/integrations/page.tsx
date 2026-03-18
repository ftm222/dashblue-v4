"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AdminPageWrapper } from "@/features/admin/AdminPageWrapper";

const IntegrationsPageContent = dynamic(
  () => import("./IntegrationsContent").then((m) => ({ default: m.IntegrationsPageContent })),
  {
    loading: () => (
      <AdminPageWrapper title="Integrações" description="Carregando...">
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminPageWrapper>
    ),
    ssr: false,
  }
);

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <AdminPageWrapper title="Integrações" description="Carregando...">
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </AdminPageWrapper>
      }
    >
      <IntegrationsPageContent />
    </Suspense>
  );
}
