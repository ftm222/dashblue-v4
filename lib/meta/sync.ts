/**
 * Sincronização Meta Ads - Marketing API
 * Busca campanhas, investimento, impressões, cliques e leads e grava na tabela campaigns.
 */
import { adminClient } from "@/lib/supabase-admin";

const META_GRAPH_BASE = "https://graph.facebook.com/v21.0";

export interface MetaSyncResult {
  created: number;
  updated: number;
  campaigns: number;
  message: string;
}

interface MetaConfig {
  provider: "meta";
  tokens: { access_token: string; expires_at: number };
}

function isMetaConfig(c: unknown): c is MetaConfig {
  if (!c || typeof c !== "object") return false;
  const o = c as Record<string, unknown>;
  return o.provider === "meta" && o.tokens != null && typeof (o.tokens as Record<string, unknown>).access_token === "string";
}

interface MetaAdAccount {
  id: string;
  account_id: string;
  name: string;
}

interface MetaInsight {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
  actions?: Array<{ action_type: string; value: string }>;
}

async function fetchMeta<T>(path: string, accessToken: string): Promise<T> {
  const url = `${META_GRAPH_BASE}${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url);
  const data = (await res.json()) as T & { error?: { message: string } };
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error((data.error as { message: string }).message || "Erro na API Meta");
  }
  return data;
}

async function getAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
  const data = (await fetchMeta<{ data?: MetaAdAccount[] }>(
    "/me/adaccounts?fields=id,account_id,name&limit=100",
    accessToken,
  )) as { data?: MetaAdAccount[] };
  return data.data ?? [];
}

async function getInsights(
  adAccountId: string,
  level: "campaign" | "adset" | "ad",
  since: string,
  until: string,
  accessToken: string,
): Promise<MetaInsight[]> {
  const timeRange = JSON.stringify({ since, until });
  const fields =
    level === "campaign"
      ? "campaign_id,campaign_name,impressions,clicks,spend,actions"
      : level === "adset"
        ? "adset_id,adset_name,campaign_id,campaign_name,impressions,clicks,spend,actions"
        : "ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,impressions,clicks,spend,actions";
  const data = (await fetchMeta<{ data?: MetaInsight[] }>(
    `/${adAccountId}/insights?level=${level}&fields=${fields}&time_range=${encodeURIComponent(timeRange)}&limit=500`,
    accessToken,
  )) as { data?: MetaInsight[] };
  return data.data ?? [];
}

function extractLeadsFromActions(actions: MetaInsight["actions"]): number {
  if (!actions || !Array.isArray(actions)) return 0;
  const leadTypes = ["lead", "omni_lead"];
  let total = 0;
  for (const a of actions) {
    if (leadTypes.includes(a.action_type)) {
      total += parseInt(a.value || "0", 10);
    }
  }
  return total;
}

export async function syncMetaAds(integrationId: string): Promise<MetaSyncResult> {
  const { data: integration, error: intError } = await adminClient
    .from("integrations")
    .select("id, organization_id, name, config, type")
    .eq("id", integrationId)
    .single();

  if (intError || !integration) {
    throw new Error("Integração não encontrada");
  }

  if (!isMetaConfig(integration.config)) {
    throw new Error("Integração Meta Ads não configurada (sem tokens)");
  }

  const config = integration.config as MetaConfig;
  const orgId = integration.organization_id as string;
  const accessToken = config.tokens.access_token;

  await adminClient.from("integrations").update({ status: "syncing" }).eq("id", integrationId);

  let created = 0;
  let updated = 0;
  const syncedCampaignIds = new Set<string>();

  try {
    const adAccounts = await getAdAccounts(accessToken);
    if (adAccounts.length === 0) {
      await adminClient
        .from("integrations")
        .update({ status: "connected", last_sync: new Date().toISOString() })
        .eq("id", integrationId);
      return {
        created: 0,
        updated: 0,
        campaigns: 0,
        message: "Nenhuma conta de anúncios encontrada no Meta.",
      };
    }

    const now = new Date();
    const periods: { since: string; until: string; periodStart: string; periodEnd: string }[] = [];

    // Mês atual (1º ao dia atual)
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    periods.push({
      since: currentMonthStart.toISOString().slice(0, 10),
      until: currentMonthEnd.toISOString().slice(0, 10),
      periodStart: currentMonthStart.toISOString().slice(0, 10),
      periodEnd: currentMonthEnd.toISOString().slice(0, 10),
    });

    // Mês anterior (completo)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    periods.push({
      since: lastMonthStart.toISOString().slice(0, 10),
      until: lastMonthEnd.toISOString().slice(0, 10),
      periodStart: lastMonthStart.toISOString().slice(0, 10),
      periodEnd: lastMonthEnd.toISOString().slice(0, 10),
    });

    for (const account of adAccounts) {
      for (const period of periods) {
        const insights = await getInsights(account.id, "campaign", period.since, period.until, accessToken);

        for (const insight of insights) {
          const campaignId = insight.campaign_id;
          const campaignName = insight.campaign_name || "Sem nome";
          if (!campaignId) continue;

          const spend = parseFloat(insight.spend || "0");
          const impressions = parseInt(insight.impressions || "0", 10);
          const clicks = parseInt(insight.clicks || "0", 10);
          const leads = extractLeadsFromActions(insight.actions);

          const externalId = `${campaignId}_${period.periodStart}`;

          const { data: existing } = await adminClient
            .from("campaigns")
            .select("id")
            .eq("organization_id", orgId)
            .eq("integration_id", integrationId)
            .eq("external_id", externalId)
            .maybeSingle();

          const record = {
            organization_id: orgId,
            integration_id: integrationId,
            external_id: externalId,
            name: campaignName,
            source: "meta",
            medium: "cpc",
            level: "campaign" as const,
            parent_external_id: null,
            investment: Math.round(spend * 100) / 100,
            impressions,
            clicks,
            leads,
            booked: 0,
            received: 0,
            won: 0,
            revenue: 0,
            period_start: period.periodStart,
            period_end: period.periodEnd,
            synced_at: new Date().toISOString(),
          };

          if (existing) {
            const { error: updErr } = await adminClient
              .from("campaigns")
              .update(record)
              .eq("id", existing.id);
            if (!updErr) {
              updated++;
              syncedCampaignIds.add(campaignId);
            }
          } else {
            const { error: insErr } = await adminClient.from("campaigns").insert(record);
            if (!insErr) {
              created++;
              syncedCampaignIds.add(campaignId);
            }
          }
        }

        // Ad sets (conjuntos de anúncios)
        const adSetInsights = await getInsights(account.id, "adset", period.since, period.until, accessToken);
        const campaignExternalId = (cid: string) => `${cid}_${period.periodStart}`;
        for (const insight of adSetInsights) {
          const adsetId = insight.adset_id;
          const adsetName = insight.adset_name || "Sem nome";
          const campaignId = insight.campaign_id;
          if (!adsetId || !campaignId) continue;

          const spend = parseFloat(insight.spend || "0");
          const impressions = parseInt(insight.impressions || "0", 10);
          const clicks = parseInt(insight.clicks || "0", 10);
          const leads = extractLeadsFromActions(insight.actions);

          const externalId = `${adsetId}_${period.periodStart}`;
          const parentExternalId = campaignExternalId(campaignId);

          const { data: existingAdSet } = await adminClient
            .from("campaigns")
            .select("id")
            .eq("organization_id", orgId)
            .eq("integration_id", integrationId)
            .eq("external_id", externalId)
            .maybeSingle();

          const adSetRecord = {
            organization_id: orgId,
            integration_id: integrationId,
            external_id: externalId,
            parent_external_id: parentExternalId,
            name: adsetName,
            source: "meta",
            medium: "cpc",
            level: "ad_set" as const,
            investment: Math.round(spend * 100) / 100,
            impressions,
            clicks,
            leads,
            booked: 0,
            received: 0,
            won: 0,
            revenue: 0,
            period_start: period.periodStart,
            period_end: period.periodEnd,
            synced_at: new Date().toISOString(),
          };

          if (existingAdSet) {
            const { error: e } = await adminClient.from("campaigns").update(adSetRecord).eq("id", existingAdSet.id);
            if (!e) {
              updated++;
              syncedCampaignIds.add(campaignId);
            }
          } else {
            const { error: e } = await adminClient.from("campaigns").insert(adSetRecord);
            if (!e) {
              created++;
              syncedCampaignIds.add(campaignId);
            }
          }
        }

        // Ads (anúncios)
        const adInsights = await getInsights(account.id, "ad", period.since, period.until, accessToken);
        const adsetExternalId = (aid: string) => `${aid}_${period.periodStart}`;
        for (const insight of adInsights) {
          const adId = insight.ad_id;
          const adName = insight.ad_name || "Sem nome";
          const adsetId = insight.adset_id;
          if (!adId || !adsetId) continue;

          const spend = parseFloat(insight.spend || "0");
          const impressions = parseInt(insight.impressions || "0", 10);
          const clicks = parseInt(insight.clicks || "0", 10);
          const leads = extractLeadsFromActions(insight.actions);

          const externalId = `${adId}_${period.periodStart}`;
          const parentExternalId = adsetExternalId(adsetId);

          const { data: existingAd } = await adminClient
            .from("campaigns")
            .select("id")
            .eq("organization_id", orgId)
            .eq("integration_id", integrationId)
            .eq("external_id", externalId)
            .maybeSingle();

          const adRecord = {
            organization_id: orgId,
            integration_id: integrationId,
            external_id: externalId,
            parent_external_id: parentExternalId,
            name: adName,
            source: "meta",
            medium: "cpc",
            level: "ad" as const,
            investment: Math.round(spend * 100) / 100,
            impressions,
            clicks,
            leads,
            booked: 0,
            received: 0,
            won: 0,
            revenue: 0,
            period_start: period.periodStart,
            period_end: period.periodEnd,
            synced_at: new Date().toISOString(),
          };

          if (existingAd) {
            const { error: e } = await adminClient.from("campaigns").update(adRecord).eq("id", existingAd.id);
            if (!e) updated++;
          } else {
            const { error: e } = await adminClient.from("campaigns").insert(adRecord);
            if (!e) created++;
          }
        }
      }
    }

    await adminClient
      .from("integrations")
      .update({ status: "connected", last_sync: new Date().toISOString() })
      .eq("id", integrationId);

    const totalCampaigns = syncedCampaignIds.size;
    const result = {
      created,
      updated,
      campaigns: totalCampaigns,
      message: `${totalCampaigns} campanhas sincronizadas: ${created} novas, ${updated} atualizadas.`,
    };

    await adminClient.from("logs").insert({
      action: "meta_ads_sync",
      entity_type: "integration",
      entity_id: integrationId,
      organization_id: orgId,
      details: { message: result.message, provider: "meta", ...result },
    });

    return result;
  } catch (err) {
    await adminClient.from("integrations").update({ status: "error" }).eq("id", integrationId);

    const message = err instanceof Error ? err.message : "Erro desconhecido";
    await adminClient.from("logs").insert({
      action: "meta_ads_sync_error",
      entity_type: "integration",
      entity_id: integrationId,
      organization_id: orgId,
      details: { message, provider: "meta" },
    });

    throw err;
  }
}
