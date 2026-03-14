import type { CRMAdapter, CRMTokens, CRMContact, CRMConfig, CRMProviderConfig } from "./types";

const PIPEDRIVE_AUTH_URL = "https://oauth.pipedrive.com/oauth/authorize";
const PIPEDRIVE_TOKEN_URL = "https://oauth.pipedrive.com/oauth/token";

export function createPipedriveAdapter(env: CRMProviderConfig): CRMAdapter {
  return {
    provider: "pipedrive",

    getAuthUrl(state: string) {
      const params = new URLSearchParams({
        client_id: env.client_id,
        redirect_uri: env.redirect_uri,
        state,
      });
      return `${PIPEDRIVE_AUTH_URL}?${params}`;
    },

    async exchangeCode(code: string): Promise<CRMTokens> {
      const res = await fetch(PIPEDRIVE_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${env.client_id}:${env.client_secret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: env.redirect_uri,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Pipedrive OAuth error: ${err}`);
      }

      const data = await res.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };
    },

    async refreshTokens(tokens: CRMTokens): Promise<CRMTokens> {
      const res = await fetch(PIPEDRIVE_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${env.client_id}:${env.client_secret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: tokens.refresh_token,
        }),
      });

      if (!res.ok) throw new Error("Falha ao renovar token Pipedrive");

      const data = await res.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };
    },

    async fetchContacts(tokens: CRMTokens, since?: string): Promise<CRMContact[]> {
      let url = "https://api.pipedrive.com/v1/deals?limit=100&status=all_not_deleted";
      if (since) {
        url += `&filter_id=0&sort=update_time DESC`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!res.ok) throw new Error(`Pipedrive API error: ${res.status}`);

      const data = await res.json();
      if (!data.success) throw new Error("Pipedrive retornou erro");

      const deals = data.data ?? [];
      const companyDomain = data.additional_data?.company_domain || "";

      return deals.map((deal: Record<string, unknown>) => {
        const person = deal.person_id as Record<string, unknown> | null;
        const org = deal.org_id as Record<string, unknown> | null;

        return {
          external_id: String(deal.id),
          name: (deal.title as string) || (org?.name as string) || "Sem nome",
          email: (person as Record<string, unknown[]> | null)?.email?.[0]
            ? String(((person as Record<string, unknown[]>).email[0] as Record<string, unknown>).value)
            : undefined,
          phone: (person as Record<string, unknown[]> | null)?.phone?.[0]
            ? String(((person as Record<string, unknown[]>).phone[0] as Record<string, unknown>).value)
            : undefined,
          crm_url: companyDomain
            ? `https://${companyDomain}.pipedrive.com/deal/${deal.id}`
            : `https://app.pipedrive.com/deal/${deal.id}`,
          pipeline_stage: String(deal.stage_id ?? ""),
          value: Number(deal.value) || 0,
          created_at: String(deal.add_time || new Date().toISOString()),
          updated_at: String(deal.update_time || new Date().toISOString()),
          tags: deal.label ? [String(deal.label)] : [],
        };
      });
    },

    async fetchPipelineStages(tokens: CRMTokens) {
      const res = await fetch("https://api.pipedrive.com/v1/stages?limit=500", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!res.ok) throw new Error(`Pipedrive stages error: ${res.status}`);

      const data = await res.json();
      const stages = data.data ?? [];

      return stages.map((s: Record<string, unknown>) => ({
        id: String(s.id),
        name: String(s.name),
        order: Number(s.order_nr) || 0,
      })).sort((a: { order: number }, b: { order: number }) => a.order - b.order);
    },

    buildContactUrl(externalId: string, config: CRMConfig) {
      const domain = config.company_domain || "app";
      return `https://${domain}.pipedrive.com/deal/${externalId}`;
    },

    async testConnection(tokens: CRMTokens) {
      const res = await fetch("https://api.pipedrive.com/v1/users/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      return res.ok;
    },
  };
}
