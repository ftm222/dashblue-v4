"use client";

import { useState, useMemo, useEffect } from "react";
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
import { ChevronRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

const LEVEL_LABELS: Record<string, string> = {
  campaign: "Campanha",
  ad_set: "Conjunto de anúncios",
  ad: "Anúncio",
};

interface TreeNode {
  item: Campaign;
  children: TreeNode[];
}

function buildTree(campaigns: Campaign[]): TreeNode[] {
  const byExternalId = new Map<string, Campaign>();
  const byParent = new Map<string | null, Campaign[]>();
  for (const c of campaigns) {
    const extId = c.externalId ?? c.id;
    byExternalId.set(extId, c);
    const parent = c.parentExternalId ?? null;
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent)!.push(c);
  }
  function toNode(c: Campaign): TreeNode {
    const extId = c.externalId ?? c.id;
    const children = (byParent.get(extId) ?? []).map(toNode);
    return { item: c, children };
  }
  return (byParent.get(null) ?? []).map(toNode);
}

function flattenTree(nodes: TreeNode[], expanded: Set<string>, depth: number): { node: TreeNode; depth: number }[] {
  const out: { node: TreeNode; depth: number }[] = [];
  for (const n of nodes) {
    out.push({ node: n, depth });
    const extId = n.item.externalId ?? n.item.id;
    if (n.children.length > 0 && expanded.has(extId)) {
      out.push(...flattenTree(n.children, expanded, depth + 1));
    }
  }
  return out;
}

export function CampaignTable({ view }: CampaignTableProps) {
  const { period } = usePeriodFilter();
  const drillDown = useDrillDown();
  const { data: campaigns, isLoading, isError, refetch } = useCampaigns(period);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const tree = useMemo(() => (campaigns ? buildTree(campaigns) : []), [campaigns]);
  const hasHierarchy = useMemo(
    () => campaigns?.some((c) => c.level && c.level !== "campaign"),
    [campaigns],
  );
  // Expande campanhas e ad sets por padrão para exibir conjuntos e anúncios
  const defaultExpanded = useMemo(() => {
    if (!hasHierarchy || !tree.length) return new Set<string>();
    const ids = new Set<string>();
    for (const n of tree) {
      const extId = n.item.externalId ?? n.item.id;
      if (n.children.length > 0) ids.add(extId);
    }
    for (const n of tree) {
      for (const child of n.children) {
        const extId = child.item.externalId ?? child.item.id;
        if (child.children.length > 0) ids.add(extId);
      }
    }
    return ids;
  }, [hasHierarchy, tree]);

  useEffect(() => {
    if (defaultExpanded.size > 0) setExpanded(defaultExpanded);
  }, [defaultExpanded]);
  const flatRows = useMemo(
    () => (hasHierarchy ? flattenTree(tree, expanded, 0) : campaigns?.map((c) => ({ node: { item: c, children: [] }, depth: 0 })) ?? []),
    [tree, expanded, hasHierarchy, campaigns],
  );

  const toggleExpand = (extId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(extId)) next.delete(extId);
      else next.add(extId);
      return next;
    });
  };

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
    const filters: Record<string, string> = {
      utmCampaign: campaign.name,
      kpi: colKey,
    };
    const funnelStepMap: Record<string, string> = {
      leads: "leads",
      booked: "booked",
      received: "received",
      won: "won",
    };
    const funnelStep = funnelStepMap[colKey];
    if (funnelStep) filters.funnelStep = funnelStep;
    drillDown.openEvidence(campaign.name, filters);
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          {view === "full" && (
            <TableRow className="border-b-0">
              <TableHead colSpan={hasHierarchy ? 3 : 2} className="bg-background" />
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
            <TableHead className="min-w-[40px] w-10 sticky left-0 bg-background z-20" />
            <TableHead className="min-w-[200px] sticky left-10 bg-background z-20">
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
          {flatRows.map(({ node, depth }) => {
            const campaign = node.item;
            const extId = campaign.externalId ?? campaign.id;
            const hasChildren = node.children.length > 0;
            const isExpanded = expanded.has(extId);
            const level = campaign.level ?? "campaign";

            return (
              <TableRow key={campaign.id} className="h-12">
                <TableCell className="w-10 p-0 sticky left-0 bg-background">
                  {hasHierarchy && hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(extId)}
                      className="inline-flex size-10 items-center justify-center text-muted-foreground hover:bg-muted rounded"
                      aria-label={isExpanded ? "Recolher" : "Expandir"}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  ) : null}
                </TableCell>
                <TableCell
                  className="font-medium sticky left-10 bg-background"
                  style={hasHierarchy ? { paddingLeft: `${12 + depth * 20}px` } : undefined}
                >
                  <div className="flex items-center gap-2">
                    {hasHierarchy && <Badge variant="secondary" className="text-xs font-normal shrink-0">{LEVEL_LABELS[level] ?? level}</Badge>}
                    {campaign.name}
                  </div>
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
