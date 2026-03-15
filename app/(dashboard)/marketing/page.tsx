"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MarketingKPIs } from "@/features/marketing/MarketingKPIs";
import { AttributionAlerts } from "@/features/marketing/AttributionAlerts";
import { CampaignTable } from "@/features/marketing/CampaignTable";
import { TrafficGoals } from "@/features/marketing/TrafficGoals";
import { ChannelBreakdown } from "@/features/marketing/ChannelBreakdown";
import { DailyPerformance } from "@/features/marketing/DailyPerformance";
import { CampaignFormDialog } from "@/features/marketing/CampaignFormDialog";
import { useTVMode } from "@/providers/TVModeProvider";

export default function MarketingPage() {
  const { enabled: tvMode } = useTVMode();
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Tráfego & Marketing</h1>
          <p className="text-sm text-muted-foreground/80">Análise de campanhas e ROI</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCampaignDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Campanha
        </Button>
      </div>

      <MarketingKPIs />
      <AttributionAlerts />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChannelBreakdown />
        </div>
        <TrafficGoals />
      </div>

      <DailyPerformance />

      <Tabs defaultValue={tvMode ? "full" : "media"}>
        <TabsList>
          <TabsTrigger value="media">Mídia</TabsTrigger>
          <TabsTrigger value="full">Funil Completo</TabsTrigger>
        </TabsList>
        <TabsContent value="media">
          <CampaignTable view="media" />
        </TabsContent>
        <TabsContent value="full">
          <CampaignTable view="full" />
        </TabsContent>
      </Tabs>

      <CampaignFormDialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen} />
    </div>
  );
}
