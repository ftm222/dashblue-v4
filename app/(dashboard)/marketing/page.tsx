"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MarketingKPIs } from "@/features/marketing/MarketingKPIs";
import { AttributionAlerts } from "@/features/marketing/AttributionAlerts";
import { CampaignTable } from "@/features/marketing/CampaignTable";
import { TrafficGoals } from "@/features/marketing/TrafficGoals";
import { ChannelBreakdown } from "@/features/marketing/ChannelBreakdown";
import { DailyPerformance } from "@/features/marketing/DailyPerformance";
import { useTVMode } from "@/providers/TVModeProvider";

export default function MarketingPage() {
  const { enabled: tvMode } = useTVMode();

  return (
    <div className="w-full space-y-6 px-6 py-6">
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
    </div>
  );
}
