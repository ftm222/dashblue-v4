import type { CRMAdapter, CRMTokens, CRMContact, CRMConfig, CRMProviderConfig } from "./types";

export function createKommoAdapter(env: CRMProviderConfig): CRMAdapter {
  return {
    provider: "kommo",

    getAuthUrl(state: string) {
      const params = new URLSearchParams({
        client_id: env.client_id,
        redirect_uri: env.redirect_uri,
        state,
        mode: "post_message",
      });
      return `https://www.kommo.com/oauth?${params}`;
    },

    async exchangeCode(code: string): Promise<CRMTokens> {
      const res = await fetch("https://www.kommo.com/oauth2/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: env.client_id,
          client_secret: env.client_secret,
          grant_type: "authorization_code",
          code,
          redirect_uri: env.redirect_uri,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Kommo OAuth error: ${err}`);
      }

      const data = await res.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };
    },

    async refreshTokens(tokens: CRMTokens): Promise<CRMTokens> {
      const res = await fetch("https://www.kommo.com/oauth2/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: env.client_id,
          client_secret: env.client_secret,
          grant_type: "refresh_token",
          refresh_token: tokens.refresh_token,
          redirect_uri: env.redirect_uri,
        }),
      });

      if (!res.ok) throw new Error("Falha ao renovar token Kommo");

      const data = await res.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };
    },

    async fetchContacts(tokens: CRMTokens, since?: string, _config?: import("./types").CRMConfig): Promise<CRMContact[]> {
      const params = new URLSearchParams({ limit: "250" });
      if (since) params.set("filter[updated_at][from]", String(Math.floor(new Date(since).getTime() / 1000)));

      const res = await fetch(`https://www.kommo.com/api/v4/leads?${params}`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!res.ok) {
        if (res.status === 204) return [];
        throw new Error(`Kommo API error: ${res.status}`);
      }

      const data = await res.json();
      const leads = data?._embedded?.leads ?? [];

      return leads.map((lead: Record<string, unknown>) => {
        const customFields = (lead.custom_fields_values as Array<Record<string, unknown>>) ?? [];
        const getField = (name: string) => {
          const field = customFields.find((f) => f.field_name === name);
          const values = field?.values as Array<Record<string, unknown>> | undefined;
          return values?.[0]?.value as string | undefined;
        };

        return {
          external_id: String(lead.id),
          name: (lead.name as string) || "Sem nome",
          email: getField("Email"),
          phone: getField("Telefone") || getField("Phone"),
          crm_url: `https://www.kommo.com/leads/detail/${lead.id}`,
          pipeline_stage: String((lead as Record<string, unknown>).status_id ?? ""),
          value: Number((lead as Record<string, unknown>).price) || 0,
          created_at: new Date(Number(lead.created_at) * 1000).toISOString(),
          updated_at: new Date(Number(lead.updated_at) * 1000).toISOString(),
          tags: ((lead._embedded as Record<string, unknown>)?.tags as Array<{ name: string }> ?? []).map((t) => t.name),
          utm_source: getField("utm_source"),
          utm_medium: getField("utm_medium"),
          utm_campaign: getField("utm_campaign"),
          responsible_id: String((lead as Record<string, unknown>).responsible_user_id ?? ""),
        };
      });
    },

    async fetchPipelineStages(tokens: CRMTokens) {
      const res = await fetch("https://www.kommo.com/api/v4/leads/pipelines", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!res.ok) throw new Error(`Kommo pipelines error: ${res.status}`);

      const data = await res.json();
      const pipelines = data?._embedded?.pipelines ?? [];
      const stages: { id: string; name: string; order: number }[] = [];

      for (const pipeline of pipelines) {
        const statuses = (pipeline._embedded as Record<string, unknown>)?.statuses as Array<Record<string, unknown>> ?? [];
        for (const status of statuses) {
          stages.push({
            id: String(status.id),
            name: String(status.name),
            order: Number(status.sort) || 0,
          });
        }
      }

      return stages.sort((a, b) => a.order - b.order);
    },

    buildContactUrl(externalId: string) {
      return `https://www.kommo.com/leads/detail/${externalId}`;
    },

    async testConnection(tokens: CRMTokens) {
      const res = await fetch("https://www.kommo.com/api/v4/account", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      return res.ok;
    },
  };
}
