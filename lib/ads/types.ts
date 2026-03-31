export type AdsProvider = "meta";

export interface AdsTokens {
  access_token: string;
  expires_at?: number;
}

export interface MetaAdsConfig {
  provider: "meta";
  tokens: AdsTokens;
  ad_account_id?: string; // opcional: usar primeiro se múltiplas contas
}

export interface AdsCampaignRow {
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

export function isMetaAdsConfig(value: unknown): value is MetaAdsConfig {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  if (obj.provider !== "meta") return false;
  if (!obj.tokens || typeof obj.tokens !== "object") return false;
  const tokens = obj.tokens as Record<string, unknown>;
  return typeof tokens.access_token === "string" && tokens.access_token.length > 10;
}
