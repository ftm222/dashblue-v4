"use client";

import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

const ATTRIBUTION_WARNINGS = [
  {
    id: "utm-missing",
    title: "UTMs ausentes",
    description:
      "Alguns leads chegaram sem parâmetros UTM. A atribuição de campanha pode estar incompleta.",
  },
  {
    id: "no-match",
    title: "Atribuição sem correspondência",
    description:
      "Leads com UTMs que não correspondem a nenhuma campanha ativa. Verifique a nomenclatura das campanhas.",
  },
];

export function AttributionAlerts() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {ATTRIBUTION_WARNINGS.map((warning) => (
        <Card
          key={warning.id}
          className="flex items-start gap-3 border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              {warning.title}
            </p>
            <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-300">
              {warning.description}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
