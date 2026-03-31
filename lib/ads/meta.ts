/**
 * Cliente para Meta Marketing API (Facebook/Instagram Ads).
 * Documentação: https://developers.facebook.com/docs/marketing-api
 */
import type { MetaAdsConfig, AdsCampaignRow } from "./types";

const GRAPH_API = "https://graph.facebook.com/v18.0";

async function metaFetch(
  path: string,
  token: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  const url = new URL(`${GRAPH_API}${path}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta API ${res.status}: ${err.slice(0, 200)}`);
  }
  return res.json();
}

/** Valida token e retorna dados do usuário (teste de conexão) */
export async function testMetaConnection(accessToken: string): Promise<boolean> {
  const data = await metaFetch("/me", accessToken, { fields: "id,name" }) as { id?: string };
  return Boolean(data?.id);
}

/** Lista contas de anúncios do usuário */
export async function fetchAdAccounts(accessToken: string): Promise<{ id: string; name: string }[]> {
  const data = await metaFetch("/me/adaccounts", accessToken, {
    fields: "id,name,account_id",
  }) as { data?: { id: string; name: string; account_id?: string }[] };

  const list = data?.data ?? [];
  return list.map((a) => ({
    id: a.id.startsWith("act_") ? a.id : `act_${a.id}`,
    name: a.name,
  }));
}

/** Extrai leads dos actions do Meta (lead, onsite_conversion.lead_grouped, etc.) */
function parseLeadsFromActions(actions: unknown): number {
  if (!Array.isArray(actions)) return 0;
  let n = 0;
  const LEAD_TYPES = ["lead", "onsite_conversion.lead_grouped", "onsite_web_app_lead", "lead_grouped"];
  for (const a of actions) {
    const obj = a && typeof a === "object" ? a as Record<string, unknown> : {};
    const t = String(obj.action_type ?? obj.action ?? "").toLowerCase();
    const val = typeof obj.value === "string" ? obj.value : String(obj.value ?? "0");
    if (LEAD_TYPES.some((lt) => t === lt || t.includes("lead"))) {
      n += parseInt(val, 10) || 0;
    }
  }
  return n;
}

/** Busca campanhas e métricas por conta de anúncios */
export async function fetchCampaignsFromMeta(
  config: MetaAdsConfig,
  periodStart: string,
  periodEnd: string
): Promise<AdsCampaignRow[]> {
  const token = config.tokens.access_token;
  let accountIds: string[] = [];

  if (config.ad_account_id) {
    accountIds = [config.ad_account_id.startsWith("act_") ? config.ad_account_id : `act_${config.ad_account_id}`];
  } else {
    const accounts = await fetchAdAccounts(token);
    if (accounts.length === 0) {
      throw new Error(
        "Nenhuma conta de anúncios encontrada. Verifique as permissões do token (ads_read, ads_management)."
      );
    }
    accountIds = accounts.map((a) => (a.id.startsWith("act_") ? a.id : `act_${a.id}`));
  }

  const rows: AdsCampaignRow[] = [];
  const timeRange = `{"since":"${periodStart}","until":"${periodEnd}"}`;

  for (const actId of accountIds) {
    const insightsRes = await metaFetch(`/${actId}/insights`, token, {
      level: "campaign",
      time_range: timeRange,
      fields: "campaign_id,campaign_name,spend,impressions,clicks,actions",
      time_increment: "all_days",
      limit: "500",
    }) as {
      data?: {
        campaign_id?: string;
        campaign_name?: string;
        spend?: string;
        impressions?: string;
        clicks?: string;
        actions?: { action_type?: string; value?: string }[];
      }[];
    };

    const insights = insightsRes?.data ?? [];

    for (const insight of insights) {
      const spend = parseFloat(insight.spend ?? "0") || 0;
      const impressions = parseInt(insight.impressions ?? "0", 10) || 0;
      const clicks = parseInt(insight.clicks ?? "0", 10) || 0;
      const leads = parseLeadsFromActions(insight.actions);
      const campaignId = insight.campaign_id ?? `unknown_${rows.length}`;
      const campaignName = insight.campaign_name ?? "Campanha";

      rows.push({
        external_id: campaignId,
        name: campaignName,
        source: "Meta Ads",
        medium: "ads",
        investment: Math.round(spend * 100) / 100,
        impressions,
        clicks,
        leads,
        period_start: periodStart,
        period_end: periodEnd,
      });
    }

    if (insights.length === 0) {
      const campaignsRes = await metaFetch(`/${actId}/campaigns`, token, {
        fields: "id,name",
        limit: "100",
      }) as { data?: { id: string; name: string }[] };

      const campaigns = campaignsRes?.data ?? [];
      for (const camp of campaigns) {
        rows.push({
          external_id: camp.id,
          name: camp.name,
          source: "Meta Ads",
          medium: "ads",
          investment: 0,
          impressions: 0,
          clicks: 0,
          leads: 0,
          period_start: periodStart,
          period_end: periodEnd,
        });
      }
    }
  }

  return rows;
}
