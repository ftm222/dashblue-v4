export interface MetaTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export interface MetaConfig {
  provider: "meta";
  tokens: MetaTokens;
  ad_account_id?: string;
}

export interface MetaAdAccount {
  id: string;
  account_id: string;
  name: string;
}

export interface MetaCampaignSummary {
  id: string;
  name: string;
  status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  objective?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
}
