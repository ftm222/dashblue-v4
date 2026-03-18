export type CRMProvider = "kommo" | "hubspot" | "pipedrive";

export interface CRMTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  company_domain?: string; // Pipedrive: extraído de api_domain no OAuth
}

export interface CRMConfig {
  provider: CRMProvider;
  tokens: CRMTokens;
  account_domain?: string;
  portal_id?: string;
  company_domain?: string;
  webhook_secret?: string;
}

export interface CRMContact {
  external_id: string;
  name: string;
  email?: string;
  phone?: string;
  crm_url: string;
  pipeline_stage: string;
  value: number;
  created_at: string;
  updated_at: string;
  tags: string[];
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  responsible_id?: string;
  responsible_name?: string;
}

export interface CRMCampaign {
  external_id: string;
  name: string;
  source: string;
  medium: string;
  investment: number;
  impressions: number;
  clicks: number;
  leads: number;
  period_start: string;
  period_end: string;
}

export interface CRMAdapter {
  provider: CRMProvider;
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<CRMTokens>;
  refreshTokens(tokens: CRMTokens): Promise<CRMTokens>;
  fetchContacts(tokens: CRMTokens, since?: string, config?: CRMConfig): Promise<CRMContact[]>;
  fetchPipelineStages(tokens: CRMTokens): Promise<{ id: string; name: string; order: number }[]>;
  buildContactUrl(externalId: string, config: CRMConfig): string;
  testConnection(tokens: CRMTokens): Promise<boolean>;
}

export interface CRMProviderConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scopes: string[];
}

export function isCRMConfig(value: unknown): value is CRMConfig {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.provider !== "string") return false;
  const validProviders = ["kommo", "hubspot", "pipedrive", "generic", "asaas", "rdstation", "zoho", "bitrix24", "salesforce"];
  if (!validProviders.includes(obj.provider)) return false;
  if (!obj.tokens || typeof obj.tokens !== "object") return false;
  const tokens = obj.tokens as Record<string, unknown>;
  return (
    typeof tokens.access_token === "string" &&
    typeof tokens.refresh_token === "string" &&
    typeof tokens.expires_at === "number"
  );
}

export function getProviderEnvConfig(provider: CRMProvider): CRMProviderConfig {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/integrations/callback?provider=${provider}`;

  switch (provider) {
    case "kommo":
      return {
        client_id: process.env.KOMMO_CLIENT_ID || "",
        client_secret: process.env.KOMMO_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        scopes: ["crm", "contacts", "leads"],
      };
    case "hubspot":
      return {
        client_id: process.env.HUBSPOT_CLIENT_ID || "",
        client_secret: process.env.HUBSPOT_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        scopes: ["crm.objects.contacts.read", "crm.objects.deals.read", "crm.schemas.deals.read"],
      };
    case "pipedrive":
      return {
        client_id: process.env.PIPEDRIVE_CLIENT_ID || "",
        client_secret: process.env.PIPEDRIVE_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        scopes: ["deals:read", "contacts:read"],
      };
  }
}
