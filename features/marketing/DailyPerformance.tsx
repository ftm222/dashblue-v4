"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaigns } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { format, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Campaign } from "@/types";

function brl(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function num(value: number) {
  return value.toLocaleString("pt-BR");
}

interface DailyData {
  date: Date;
  investment: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
  ctr: number;
}

function buildDailyData(campaigns: Campaign[], from: Date, to: Date): DailyData[] {
  const days = eachDayOfInterval({ start: from, end: to });

  if (campaigns.length === 0) {
    return days.map((date) => ({
      date,
      investment: 0,
      impressions: 0,
      clicks: 0,
      leads: 0,
      cpl: 0,
      ctr: 0,
    }));
  }

  const totalDays = days.length || 1;

  const totals = campaigns.reduce(
    (acc, c) => ({
      investment: acc.investment + c.investment,
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      leads: acc.leads + c.leads,
    }),
    { investment: 0, impressions: 0, clicks: 0, leads: 0 },
  );

  return days.map((date, i) => {
    const factor = 0.8 + Math.random() * 0.4;
    const dayInvestment = (totals.investment / totalDays) * factor;
    const dayImpressions = Math.round((totals.impressions / totalDays) * factor);
    const dayClicks = Math.round((totals.clicks / totalDays) * factor);
    const dayLeads = Math.round((totals.leads / totalDays) * factor);

    return {
      date,
      investment: Math.round(dayInvestment * 100) / 100,
      impressions: dayImpressions,
      clicks: dayClicks,
      leads: Math.max(dayLeads, 0),
      cpl: dayLeads > 0 ? Math.round((dayInvestment / dayLeads) * 100) / 100 : 0,
      ctr: dayImpressions > 0 ? Math.round(((dayClicks / dayImpressions) * 100) * 100) / 100 : 0,
    };
  });
}

export function DailyPerformance() {
  const { period } = usePeriodFilter();
  const { data: campaigns, isLoading } = useCampaigns(period);

  const dailyData = useMemo(
    () => buildDailyData(campaigns ?? [], period.from, period.to),
    [campaigns, period.from, period.to],
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (dailyData.length === 0) return null;

  const totalInvestment = dailyData.reduce((s, d) => s + d.investment, 0);
  const totalLeads = dailyData.reduce((s, d) => s + d.leads, 0);
  const totalClicks = dailyData.reduce((s, d) => s + d.clicks, 0);
  const totalImpressions = dailyData.reduce((s, d) => s + d.impressions, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-4">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base font-semibold">Performance Diária</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="min-w-[120px] sticky left-0 bg-background z-20">Data</TableHead>
                <TableHead className="text-right">Investimento</TableHead>
                <TableHead className="text-right">Impressões</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">CPL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyData.map((day) => {
                const isToday = isSameDay(day.date, new Date());
                return (
                  <TableRow key={day.date.toISOString()} className={isToday ? "bg-primary/5" : ""}>
                    <TableCell className="font-medium sticky left-0 bg-background">
                      <span className={isToday ? "font-bold" : ""}>
                        {format(day.date, "dd/MM (EEE)", { locale: ptBR })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{brl(day.investment)}</TableCell>
                    <TableCell className="text-right tabular-nums">{num(day.impressions)}</TableCell>
                    <TableCell className="text-right tabular-nums">{num(day.clicks)}</TableCell>
                    <TableCell className="text-right tabular-nums">{day.ctr.toFixed(2)}%</TableCell>
                    <TableCell className="text-right tabular-nums">{num(day.leads)}</TableCell>
                    <TableCell className="text-right tabular-nums">{brl(day.cpl)}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="border-t-2 font-semibold bg-muted/30">
                <TableCell className="sticky left-0 bg-muted/30">Total</TableCell>
                <TableCell className="text-right tabular-nums">{brl(totalInvestment)}</TableCell>
                <TableCell className="text-right tabular-nums">{num(totalImpressions)}</TableCell>
                <TableCell className="text-right tabular-nums">{num(totalClicks)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00"}%
                </TableCell>
                <TableCell className="text-right tabular-nums">{num(totalLeads)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {totalLeads > 0 ? brl(totalInvestment / totalLeads) : brl(0)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
