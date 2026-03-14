"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaigns } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import type { Campaign } from "@/types";

function brl(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function num(value: number) {
  return value.toLocaleString("pt-BR");
}

function pct(value: number) {
  return `${value.toFixed(1)}%`;
}

const CHANNEL_COLORS: Record<string, string> = {
  facebook: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  instagram: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  google: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  linkedin: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
};

interface ChannelData {
  source: string;
  campaigns: number;
  investment: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
  ctr: number;
  won: number;
  revenue: number;
}

function aggregateByChannel(campaigns: Campaign[]): ChannelData[] {
  const map = new Map<string, Omit<ChannelData, "source" | "cpl" | "ctr">>();

  for (const c of campaigns) {
    const key = (c.source || "outros").toLowerCase();
    const existing = map.get(key) ?? {
      campaigns: 0,
      investment: 0,
      impressions: 0,
      clicks: 0,
      leads: 0,
      won: 0,
      revenue: 0,
    };
    existing.campaigns++;
    existing.investment += c.investment;
    existing.impressions += c.impressions;
    existing.clicks += c.clicks;
    existing.leads += c.leads;
    existing.won += c.won;
    existing.revenue += c.revenue;
    map.set(key, existing);
  }

  return Array.from(map.entries())
    .map(([source, data]) => ({
      source,
      ...data,
      cpl: data.leads > 0 ? data.investment / data.leads : 0,
      ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
    }))
    .sort((a, b) => b.investment - a.investment);
}

export function ChannelBreakdown() {
  const { period } = usePeriodFilter();
  const { data: campaigns, isLoading } = useCampaigns(period);

  const channels = useMemo(
    () => aggregateByChannel(campaigns ?? []),
    [campaigns],
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (channels.length === 0) return null;

  const totalInvestment = channels.reduce((s, c) => s + c.investment, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-4">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base font-semibold">Performance por Canal</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Canal</TableHead>
                <TableHead className="text-right">Campanhas</TableHead>
                <TableHead className="text-right">Investimento</TableHead>
                <TableHead className="text-right">% Total</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((ch) => {
                const shareOfTotal = totalInvestment > 0 ? (ch.investment / totalInvestment) * 100 : 0;
                const colorClass = CHANNEL_COLORS[ch.source] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";

                return (
                  <TableRow key={ch.source}>
                    <TableCell>
                      <Badge variant="secondary" className={colorClass}>
                        {ch.source.charAt(0).toUpperCase() + ch.source.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{ch.campaigns}</TableCell>
                    <TableCell className="text-right tabular-nums">{brl(ch.investment)}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(shareOfTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums">{num(ch.leads)}</TableCell>
                    <TableCell className="text-right tabular-nums">{brl(ch.cpl)}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(ch.ctr)}</TableCell>
                    <TableCell className="text-right tabular-nums">{num(ch.won)}</TableCell>
                    <TableCell className="text-right tabular-nums">{brl(ch.revenue)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
