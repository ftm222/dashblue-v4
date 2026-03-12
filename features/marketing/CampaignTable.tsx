"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCampaigns } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useDrillDown } from "@/providers/DrillDownProvider";
import type { Campaign } from "@/types";

function brl(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function num(value: number) {
  return value.toLocaleString("pt-BR");
}

function pct(value: number) {
  return `${value.toFixed(2)}%`;
}

interface CampaignTableProps {
  view: "media" | "full";
}

const MEDIA_COLUMNS: { key: keyof Campaign; label: string; format: (v: number) => string; align: string }[] = [
  { key: "investment", label: "Investimento", format: brl, align: "text-right" },
  { key: "impressions", label: "Impressões", format: num, align: "text-right" },
  { key: "clicks", label: "Cliques", format: num, align: "text-right" },
  { key: "ctr", label: "CTR", format: pct, align: "text-right" },
  { key: "cpc", label: "CPC", format: brl, align: "text-right" },
  { key: "cpl", label: "CPL", format: brl, align: "text-right" },
];

const FUNNEL_COLUMNS: { key: keyof Campaign; label: string; format: (v: number) => string; align: string }[] = [
  { key: "leads", label: "Leads", format: num, align: "text-right" },
  { key: "booked", label: "Booked", format: num, align: "text-right" },
  { key: "received", label: "Received", format: num, align: "text-right" },
  { key: "won", label: "Won", format: num, align: "text-right" },
  { key: "revenue", label: "Revenue", format: brl, align: "text-right" },
];

export function CampaignTable({ view }: CampaignTableProps) {
  const { period } = usePeriodFilter();
  const drillDown = useDrillDown();
  const { data: campaigns, isLoading, isError, refetch } = useCampaigns(period);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <EmptyState
        title="Nenhuma campanha encontrada"
        description="Ajuste o período ou verifique suas integrações."
      />
    );
  }

  const dataColumns = view === "media"
    ? MEDIA_COLUMNS
    : [...MEDIA_COLUMNS, ...FUNNEL_COLUMNS];

  const handleCellClick = (campaign: Campaign, colKey: string) => {
    drillDown.openEvidence(campaign.name, {
      campaignId: campaign.id,
      kpi: colKey,
    });
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          {view === "full" && (
            <TableRow className="border-b-0">
              <TableHead colSpan={2} className="bg-background" />
              <TableHead
                colSpan={MEDIA_COLUMNS.length}
                className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30"
              >
                Mídia
              </TableHead>
              <TableHead
                colSpan={FUNNEL_COLUMNS.length}
                className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30"
              >
                Funil via UTM
              </TableHead>
            </TableRow>
          )}
          <TableRow>
            <TableHead className="min-w-[200px] sticky left-0 bg-background z-20">
              Nome
            </TableHead>
            <TableHead className="min-w-[100px]">Fonte</TableHead>
            {dataColumns.map((col) => (
              <TableHead key={col.key} className={`min-w-[110px] ${col.align}`}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id} className="h-12">
              <TableCell className="font-medium sticky left-0 bg-background">
                {campaign.name}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {campaign.source}
              </TableCell>
              {dataColumns.map((col) => (
                <TableCell
                  key={col.key}
                  role="button"
                  tabIndex={0}
                  className={`${col.align} tabular-nums cursor-pointer hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset`}
                  onClick={() => handleCellClick(campaign, col.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCellClick(campaign, col.key);
                    }
                  }}
                >
                  {col.format(campaign[col.key] as number)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
