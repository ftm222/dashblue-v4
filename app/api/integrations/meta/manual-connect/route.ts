import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase-admin";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { testMetaConnection } from "@/lib/meta/oauth";

const META_TOKEN_EXPIRY_MS = 60 * 24 * 60 * 60 * 1000; // 60 dias (long-lived)

/**
 * POST /api/integrations/meta/manual-connect
 * Conecta Meta Ads via token manual (Graph API Explorer / long-lived).
 * Alternativa quando META_APP_ID/SECRET não estão configurados para OAuth.
 */
export async function POST(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);
    const body = await request.json();

    const { integrationId, access_token } = body;

    if (!integrationId || !access_token) {
      throw new ApiError("VALIDATION", "integrationId e access_token são obrigatórios.", 400);
    }

    const token = String(access_token).trim();
    if (!token) {
      throw new ApiError("VALIDATION", "Access token não pode estar vazio.", 400);
    }

    const { data: integration } = await adminClient
      .from("integrations")
      .select("id, organization_id, name, type")
      .eq("id", integrationId)
      .single();

    if (!integration || integration.organization_id !== orgId) {
      throw new ApiError("FORBIDDEN", "Integração não pertence à sua organização.", 403);
    }

    if (integration.type !== "ads" || !integration.name.toLowerCase().includes("meta")) {
      throw new ApiError("INVALID_TYPE", "Esta rota é apenas para integrações Meta Ads.", 400);
    }

    const isValid = await testMetaConnection(token);
    if (!isValid) {
      throw new ApiError("CONNECTION_FAILED", "Token inválido ou expirado. Gere um novo no Graph API Explorer.", 400);
    }

    const config = {
      provider: "meta",
      tokens: {
        access_token: token,
        expires_at: Date.now() + META_TOKEN_EXPIRY_MS,
      },
    };

    await adminClient
      .from("integrations")
      .update({ status: "connected", config, last_sync: null })
      .eq("id", integrationId);

    await adminClient.from("logs").insert({
      action: "meta_ads_connected",
      entity_type: "integration",
      entity_id: integrationId,
      organization_id: orgId,
      details: { message: "Meta Ads conectado via token manual", provider: "meta" },
    });

    return NextResponse.json({ success: true, message: "Meta Ads conectado com sucesso!" });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
