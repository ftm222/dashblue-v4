/**
 * Meta (Facebook) Marketing API - OAuth 2.0
 * https://developers.facebook.com/docs/marketing-api/get-started/authentication
 */

const META_OAUTH_BASE = "https://www.facebook.com/v21.0/dialog/oauth";
const META_GRAPH_BASE = "https://graph.facebook.com/v21.0";

export interface MetaTokens {
  access_token: string;
  expires_at: number;
}

export interface MetaEnvConfig {
  app_id: string;
  app_secret: string;
  redirect_uri: string;
}

export function getMetaEnvConfig(): MetaEnvConfig {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    app_id: process.env.META_APP_ID || "",
    app_secret: process.env.META_APP_SECRET || "",
    redirect_uri: `${baseUrl}/api/integrations/callback?provider=meta`,
  };
}

export function getMetaAuthUrl(state: string): string {
  const { app_id, redirect_uri } = getMetaEnvConfig();
  const scope = "ads_management,ads_read,business_management";
  const params = new URLSearchParams({
    client_id: app_id,
    redirect_uri,
    state,
    scope,
  });
  return `${META_OAUTH_BASE}?${params.toString()}`;
}

export async function exchangeMetaCode(code: string): Promise<MetaTokens> {
  const { app_id, app_secret, redirect_uri } = getMetaEnvConfig();
  if (!app_id || !app_secret) {
    throw new Error("META_APP_ID e META_APP_SECRET não configurados.");
  }

  const tokenUrl = `${META_GRAPH_BASE}/oauth/access_token?${new URLSearchParams({
    client_id: app_id,
    client_secret: app_secret,
    redirect_uri,
    code,
  })}`;

  const res = await fetch(tokenUrl);
  const data = (await res.json()) as { access_token?: string; expires_in?: number; error?: { message: string } };

  if (data.error) {
    throw new Error(data.error.message || "Falha ao trocar código por token.");
  }
  if (!data.access_token) {
    throw new Error("Resposta da Meta sem access_token.");
  }

  const shortLivedToken = data.access_token;
  const expiresIn = data.expires_in ?? 0;

  if (expiresIn > 0 && expiresIn < 60 * 60 * 24) {
    const longLived = await getLongLivedToken(shortLivedToken);
    return longLived;
  }

  return {
    access_token: shortLivedToken,
    expires_at: Date.now() + (expiresIn > 0 ? expiresIn * 1000 : 60 * 24 * 60 * 60 * 1000),
  };
}

async function getLongLivedToken(shortLivedToken: string): Promise<MetaTokens> {
  const { app_id, app_secret } = getMetaEnvConfig();

  const url = `${META_GRAPH_BASE}/oauth/access_token?${new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: app_id,
    client_secret: app_secret,
    fb_exchange_token: shortLivedToken,
  })}`;

  const res = await fetch(url);
  const data = (await res.json()) as { access_token?: string; expires_in?: number; error?: { message: string } };

  if (data.error) {
    throw new Error(data.error.message || "Falha ao obter token de longa duração.");
  }

  const expiresIn = data.expires_in ?? 60 * 24 * 60 * 60;
  return {
    access_token: data.access_token!,
    expires_at: Date.now() + expiresIn * 1000,
  };
}

/** Valida token testando acesso às contas de anúncios (requer ads_read/ads_management) */
export async function testMetaConnection(accessToken: string): Promise<boolean> {
  const res = await fetch(
    `${META_GRAPH_BASE}/me/adaccounts?fields=id,account_id,name&limit=1&access_token=${encodeURIComponent(accessToken)}`,
  );
  const data = (await res.json()) as { data?: unknown[]; error?: { message: string } };
  if (data.error) return false;
  return Array.isArray(data.data);
}
