import type { CRMAdapter, CRMTokens, CRMContact, CRMConfig, CRMProviderConfig } from "./types";

const HUBSPOT_AUTH_URL = "https://app.hubspot.com/oauth/authorize";
const HUBSPOT_TOKEN_URL = "https://api.hubapi.com/oauth/v1/token";
const HUBSPOT_API = "https://api.hubapi.com";

export function createHubSpotAdapter(env: CRMProviderConfig): CRMAdapter {
  return {
    provider: "hubspot",

    getAuthUrl(state: string) {
      const params = new URLSearchParams({
        client_id: env.client_id,
        redirect_uri: env.redirect_uri,
        scope: env.scopes.join(" "),
        state,
      });
      return `${HUBSPOT_AUTH_URL}?${params}`;
    },

    async exchangeCode(code: string): Promise<CRMTokens> {
      const res = await fetch(HUBSPOT_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: env.client_id,
          client_secret: env.client_secret,
          redirect_uri: env.redirect_uri,
          code,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`HubSpot OAuth error: ${err}`);
      }

      const data = await res.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };
    },

    async refreshTokens(tokens: CRMTokens): Promise<CRMTokens> {
      const res = await fetch(HUBSPOT_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: env.client_id,
          client_secret: env.client_secret,
          refresh_token: tokens.refresh_token,
        }),
      });

      if (!res.ok) throw new Error("Falha ao renovar token HubSpot");

      const data = await res.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };
    },

    async fetchContacts(tokens: CRMTokens, since?: string, _config?: import("./types").CRMConfig): Promise<CRMContact[]> {
      const properties = [
        "dealname", "amount", "dealstage", "pipeline",
        "hs_analytics_source", "hs_analytics_source_data_1",
        "hs_analytics_source_data_2", "createdate", "hs_lastmodifieddate",
      ].join(",");

      let url = `${HUBSPOT_API}/crm/v3/objects/deals?limit=100&properties=${properties}`;
      if (since) {
        url += `&filterGroups=[{"filters":[{"propertyName":"hs_lastmodifieddate","operator":"GTE","value":"${new Date(since).getTime()}"}]}]`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!res.ok) throw new Error(`HubSpot API error: ${res.status}`);

      const data = await res.json();
      const deals = data.results ?? [];

      let portalId = "";
      try {
        const accRes = await fetch(`${HUBSPOT_API}/account-info/v3/details`, {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (accRes.ok) {
          const acc = await accRes.json();
          portalId = String(acc.portalId || "");
        }
      } catch { /* ignore */ }

      return deals.map((deal: Record<string, unknown>) => {
        const props = deal.properties as Record<string, string | null>;
        const dealId = String(deal.id);

        return {
          external_id: dealId,
          name: props.dealname || "Sem nome",
          crm_url: portalId
            ? `https://app.hubspot.com/contacts/${portalId}/deal/${dealId}`
            : `https://app.hubspot.com/deal/${dealId}`,
          pipeline_stage: props.dealstage || "",
          value: Number(props.amount) || 0,
          created_at: props.createdate || new Date().toISOString(),
          updated_at: props.hs_lastmodifieddate || new Date().toISOString(),
          tags: [],
          utm_source: props.hs_analytics_source || undefined,
          utm_medium: props.hs_analytics_source_data_1 || undefined,
          utm_campaign: props.hs_analytics_source_data_2 || undefined,
        };
      });
    },

    async fetchPipelineStages(tokens: CRMTokens) {
      const res = await fetch(`${HUBSPOT_API}/crm/v3/pipelines/deals`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!res.ok) throw new Error(`HubSpot pipelines error: ${res.status}`);

      const data = await res.json();
      const stages: { id: string; name: string; order: number }[] = [];

      for (const pipeline of data.results ?? []) {
        for (const stage of pipeline.stages ?? []) {
          stages.push({
            id: stage.id,
            name: stage.label,
            order: stage.displayOrder ?? 0,
          });
        }
      }

      return stages.sort((a, b) => a.order - b.order);
    },

    buildContactUrl(externalId: string, config: CRMConfig) {
      const portalId = config.portal_id || "";
      return portalId
        ? `https://app.hubspot.com/contacts/${portalId}/deal/${externalId}`
        : `https://app.hubspot.com/deal/${externalId}`;
    },

    async testConnection(tokens: CRMTokens) {
      const res = await fetch(`${HUBSPOT_API}/account-info/v3/details`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      return res.ok;
    },
  };
}
