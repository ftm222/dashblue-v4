import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase-admin";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { getMetaEnvConfig } from "@/lib/meta/oauth";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import crypto from "crypto";

/**
 * POST /api/integrations/meta/connect
 * Inicia o fluxo OAuth do Meta (Facebook Ads / Marketing API).
 */
export async function POST(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);
    const { integrationId } = await request.json();

    if (!integrationId) {
      throw new ApiError("MISSING_PARAM", "integrationId é obrigatório.", 400);
    }

    const { data: integration } = await adminClient
      .from("integrations")
      .select("id, organization_id")
      .eq("id", integrationId)
      .single();

    if (!integration || integration.organization_id !== orgId) {
      throw new ApiError("FORBIDDEN", "Integração não pertence à sua organização.", 403);
    }

    const config = getMetaEnvConfig();
    if (!config.app_id || !config.app_secret) {
      throw new ApiError(
        "MISSING_CREDENTIALS",
        "Credenciais Meta não configuradas. Adicione META_APP_ID e META_APP_SECRET no .env.local",
        400,
      );
    }

    const state = Buffer.from(
      JSON.stringify({ integrationId, provider: "meta", nonce: crypto.randomUUID() }),
    ).toString("base64url");

    const scope = "ads_management,ads_read,business_management";
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?${new URLSearchParams({
      client_id: config.app_id,
      redirect_uri: config.redirect_uri,
      state,
      scope,
      response_type: "code",
    })}`;

    return NextResponse.json({ authUrl, state });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
