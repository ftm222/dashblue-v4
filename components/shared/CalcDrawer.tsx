"use client";

import { Calculator, FileText, ListChecks } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CalcDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  kpiKey: string;
}

const KPI_FORMULAS: Record<string, { summary: string; formula: string }> = {
  investment: {
    summary: "Total investido em mídia paga no período selecionado.",
    formula: "Soma de todos os gastos de campanhas ativas no período.",
  },
  cpl: {
    summary: "Custo médio para gerar um lead.",
    formula: "CPL = Investimento Total / Número de Leads",
  },
  leads: {
    summary: "Total de leads gerados no período.",
    formula: "Contagem de contatos criados via formulários e integrações.",
  },
  booked: {
    summary: "Reuniões agendadas no período.",
    formula: "Contagem de leads que avançaram para etapa 'Agendado'.",
  },
  received: {
    summary: "Reuniões realizadas no período.",
    formula: "Contagem de leads que avançaram para etapa 'Atendido'.",
  },
  won: {
    summary: "Vendas fechadas no período.",
    formula: "Contagem de leads que avançaram para etapa 'Ganho'.",
  },
  revenue: {
    summary: "Receita total gerada pelas vendas.",
    formula: "Soma do valor de todos os deals marcados como 'Ganho'.",
  },
  roas: {
    summary: "Retorno sobre investimento em mídia.",
    formula: "ROAS = Receita / Investimento",
  },
  cac: {
    summary: "Custo de aquisição por cliente.",
    formula: "CAC = Investimento Total / Número de Clientes (Won)",
  },
  ticket: {
    summary: "Ticket médio por venda.",
    formula: "Ticket Médio = Receita Total / Número de Vendas",
  },
  conversion_rate: {
    summary: "Taxa de conversão geral do funil.",
    formula: "Conversão = Vendas / Leads × 100",
  },
  show_rate: {
    summary: "Taxa de comparecimento às reuniões.",
    formula: "Show Rate = Reuniões Realizadas / Reuniões Agendadas × 100",
  },
};

export function CalcDrawer({ open, onClose, title, kpiKey }: CalcDrawerProps) {
  const router = useRouter();
  const info = KPI_FORMULAS[kpiKey] ?? {
    summary: "Métrica personalizada.",
    formula: "Fórmula não disponível.",
  };

  function handleNavigateEvidence(step?: string) {
    const params = new URLSearchParams({ kpi: kpiKey });
    if (step) params.set("funnelStep", step);
    onClose();
    router.push(`/evidence?${params.toString()}`);
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className="sr-only">
            Detalhes de cálculo do KPI
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="resumo" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="resumo" className="flex-1 gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="formula" className="flex-1 gap-1.5">
              <Calculator className="h-3.5 w-3.5" />
              Como calculamos
            </TabsTrigger>
            <TabsTrigger value="evidencias" className="flex-1 gap-1.5">
              <ListChecks className="h-3.5 w-3.5" />
              Evidências
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {info.summary}
            </p>
          </TabsContent>

          <TabsContent value="formula" className="mt-4 space-y-4">
            <div className="rounded-md border bg-muted/30 p-4">
              <p className="text-sm font-mono leading-relaxed">
                {info.formula}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="evidencias" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Consulte a tabela de evidências para ver os registros que compõem
              este indicador.
            </p>
            <ul className="space-y-1.5 text-sm">
              <li>
                <button
                  onClick={() => handleNavigateEvidence()}
                  className="text-primary underline underline-offset-2 cursor-pointer hover:text-primary/80"
                >
                  Ver todos os registros
                </button>
              </li>
              {(kpiKey === "conversion_rate" || kpiKey === "won" || kpiKey === "received") && (
                <>
                  <li>
                    <button
                      onClick={() => handleNavigateEvidence("received")}
                      className="text-primary underline underline-offset-2 cursor-pointer hover:text-primary/80"
                    >
                      Ver registros recebidos
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigateEvidence("won")}
                      className="text-primary underline underline-offset-2 cursor-pointer hover:text-primary/80"
                    >
                      Ver registros fechados (won)
                    </button>
                  </li>
                </>
              )}
            </ul>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
