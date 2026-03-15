import type { CRMAdapter, CRMTokens, CRMContact, CRMConfig, CRMProviderConfig } from "./types";

const PIPEDRIVE_AUTH_URL = "https://oauth.pipedrive.com/oauth/authorize";
const PIPEDRIVE_TOKEN_URL = "https://oauth.pipedrive.com/oauth/token";
const PIPEDRIVE_API = "https://api.pipedrive.com/v1";

function extractCompanyDomain(apiDomain?: string): string | undefined {
  if (!apiDomain || typeof apiDomain !== "string") return undefined;
  try {
    const url = apiDomain.startsWith("http") ? apiDomain : `https://${apiDomain}`;
    const host = new URL(url).hostname;
    const match = host.match(/^([^.]+)\.pipedrive\.com$/);
    return match ? match[1] : undefined;
  } catch {
    return undefined;
  }
}

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
      const companyDomain = extractCompanyDomain(data.api_domain);
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
        ...(companyDomain && { company_domain: companyDomain }),
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
      const companyDomain = extractCompanyDomain(data.api_domain) ?? tokens.company_domain;
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
        ...(companyDomain && { company_domain: companyDomain }),
      };
    },

    async fetchContacts(tokens: CRMTokens, since?: string, config?: CRMConfig): Promise<CRMContact[]> {
      const companyDomain = config?.company_domain ?? tokens.company_domain ?? "";
      const allDeals: Record<string, unknown>[] = [];
      let start = 0;
      const limit = 100;

      // Paginação de deals
      while (true) {
        const params = new URLSearchParams({
          limit: String(limit),
          start: String(start),
          status: "all_not_deleted",
        });
        if (since) {
          params.set("sort", "update_time DESC");
        }

        const res = await fetch(`${PIPEDRIVE_API}/deals?${params}`, {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (!res.ok) throw new Error(`Pipedrive API error: ${res.status}`);

        const data = await res.json();
        if (!data.success) throw new Error("Pipedrive retornou erro");

        const deals = data.data ?? [];
        if (deals.length === 0) break;

        const sinceTs = since ? Math.floor(new Date(since).getTime() / 1000) : 0;
        for (const d of deals as Record<string, unknown>[]) {
          const ut = d.update_time as string | number | undefined;
          const ts = typeof ut === "string" ? new Date(ut).getTime() / 1000 : Number(ut) || 0;
          if (!since || ts >= sinceTs) allDeals.push(d);
          else if (since) break; // ordenado por update_time DESC, parar ao encontrar deal antigo
        }
        if (since && (deals as Record<string, unknown>[]).some((d) => {
          const ut = d.update_time as string | number | undefined;
          const ts = typeof ut === "string" ? new Date(ut).getTime() / 1000 : Number(ut) || 0;
          return ts < sinceTs;
        })) break;

        const addData = data.additional_data;
        const nextStart = addData?.pagination?.next_start;
        if (nextStart == null || deals.length < limit) break;
        start = nextStart;
      }

      // Sync incremental: filtrar deals atualizados desde last_sync
      const sinceTs = since ? Math.floor(new Date(since).getTime() / 1000) : 0;
      const dealsToProcess = sinceTs > 0
        ? allDeals.filter((d) => {
            const ut = d.update_time as string | number | undefined;
            const ts = typeof ut === "string" ? new Date(ut).getTime() / 1000 : Number(ut) || 0;
            return ts >= sinceTs;
          })
        : allDeals;

      // Coletar person_ids únicos para buscar emails/telefones
      const personIds = [...new Set(dealsToProcess.map((d) => d.person_id).filter(Boolean))] as number[];
      const personMap = new Map<number, { email?: string; phone?: string }>();

      // Buscar detalhes das persons em lotes (evitar muitas requisições)
      const batchSize = 50;
      for (let i = 0; i < personIds.length; i += batchSize) {
        const batch = personIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (id) => {
            const res = await fetch(`${PIPEDRIVE_API}/persons/${id}`, {
              headers: { Authorization: `Bearer ${tokens.access_token}` },
            });
            if (!res.ok) return;
            const pData = await res.json();
            if (!pData.success || !pData.data) return;
            const p = pData.data as Record<string, unknown>;
            const emails = (p.email as Array<{ value: string }>) ?? [];
            const phones = (p.phone as Array<{ value: string }>) ?? [];
            personMap.set(id, {
              email: emails[0]?.value,
              phone: phones[0]?.value,
            });
          })
        );
      }

      return dealsToProcess.map((deal: Record<string, unknown>) => {
        const personId = deal.person_id as number | null | undefined;
        const personData = personId ? personMap.get(personId) : undefined;
        const org = deal.org_id as Record<string, unknown> | null | undefined;
        const orgName = org && typeof org === "object" && org.name ? String(org.name) : undefined;

        return {
          external_id: String(deal.id),
          name: (deal.title as string) || orgName || "Sem nome",
          email: personData?.email,
          phone: personData?.phone,
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
      const res = await fetch(`${PIPEDRIVE_API}/stages?limit=500`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (!res.ok) throw new Error(`Pipedrive stages error: ${res.status}`);

      const data = await res.json();
      const stages = data.data ?? [];

      return stages
        .map((s: Record<string, unknown>) => ({
          id: String(s.id),
          name: String(s.name),
          order: Number(s.order_nr) || 0,
        }))
        .sort((a: { order: number }, b: { order: number }) => a.order - b.order);
    },

    buildContactUrl(externalId: string, config: CRMConfig) {
      const domain = config.company_domain || "app";
      return `https://${domain}.pipedrive.com/deal/${externalId}`;
    },

    async testConnection(tokens: CRMTokens) {
      const res = await fetch(`${PIPEDRIVE_API}/users/me`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      return res.ok;
    },
  };
}
