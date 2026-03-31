import { NextResponse } from "next/server";
import { getAdminClient, adminClient } from "@/lib/supabase-admin";
import { getCRMAdapter } from "@/lib/crm/registry";
import { testMetaConnection } from "@/lib/ads/meta";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import type { CRMConfig, CRMTokens } from "@/lib/crm/types";
import type { MetaAdsConfig } from "@/lib/ads/types";

const MANUAL_TOKEN_EXPIRY_MS = 10 * 365 * 24 * 60 * 60 * 1000; // 10 anos

export async function POST(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);
    const body = await request.json();

    const { integrationId, provider, access_token, account_domain, company_domain, portal_id, api_url, ad_account_id } = body;

    if (!integrationId || !provider || !access_token) {
      throw new ApiError("VALIDATION", "integrationId, provider e access_token são obrigatórios.", 400);
    }

    const validCrmProviders = ["kommo", "hubspot", "pipedrive", "generic", "asaas", "rdstation", "zoho", "bitrix24", "salesforce"];
    const validAdsProviders = ["meta"];
    const validProviders = [...validCrmProviders, ...validAdsProviders];
    if (!validProviders.includes(provider)) {
      throw new ApiError(
        "INVALID_PROVIDER",
        "Provider inválido. Use: kommo, hubspot, pipedrive, rdstation, zoho, bitrix24, salesforce, asaas, meta ou generic.",
        400,
      );
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

    const int = integration as { organization_id?: string; type?: string } | null;
    if (!int || int.organization_id !== orgId) {
      throw new ApiError("FORBIDDEN", "Integração não pertence à sua organização.", 403);
    }

    if (provider === "meta") {
      if (int.type !== "ads") {
        throw new ApiError("INVALID_TYPE", "O provider Meta deve ser usado em integrações do tipo Ads.", 400);
      }
      const isValid = await testMetaConnection(token);
      if (!isValid) {
        throw new ApiError(
          "CONNECTION_FAILED",
          "Token inválido ou sem permissão. Verifique se o token tem ads_read e ads_management.",
          400,
        );
      }

      const config: MetaAdsConfig = {
        provider: "meta",
        tokens: { access_token: token, expires_at: Date.now() + MANUAL_TOKEN_EXPIRY_MS },
        ...(ad_account_id && { ad_account_id: String(ad_account_id).replace(/^act_/, "") }),
      };

      const admin = getAdminClient();
      await (admin.from("integrations") as any)
        .update({ status: "connected", config, last_sync: null })
        .eq("id", integrationId);

      await (admin.from("logs") as any).insert({
        action: "ads_connected",
        entity_type: "integration",
        entity_id: integrationId,
        organization_id: orgId,
        details: { message: "Meta Ads conectado via token", provider: "meta" },
      });

      const { data: checkItem } = await adminClient
        .from("setup_checklist")
        .select("id")
        .eq("organization_id", orgId)
        .eq("key", "connect-ads")
        .maybeSingle();

      if (checkItem) {
        await (admin.from("setup_checklist") as any)
          .update({ completed: true })
          .eq("id", (checkItem as { id: string }).id);
      }

      return NextResponse.json({ success: true, message: "Meta Ads conectado com sucesso!" });
    }

    if (int.type !== "crm") {
      throw new ApiError("INVALID_TYPE", "Apenas integrações CRM podem ser conectadas com este provider.", 400);
    }

    const tokens: CRMTokens = {
      access_token: token,
      refresh_token: token,
      expires_at: Date.now() + MANUAL_TOKEN_EXPIRY_MS,
    };

    const isGenericProvider = ["generic", "asaas", "rdstation", "zoho", "bitrix24", "salesforce"].includes(provider);
    if (!isGenericProvider) {
      const adapter = getCRMAdapter(provider as "kommo" | "hubspot" | "pipedrive");
      const isValid = await adapter.testConnection(tokens);
      if (!isValid) {
        throw new ApiError("CONNECTION_FAILED", "Token inválido ou sem permissão. Verifique e tente novamente.", 400);
      }
    }

    const config = {
      provider,
      tokens,
      account_domain: account_domain || undefined,
      company_domain: company_domain || undefined,
      portal_id: portal_id || undefined,
      api_url: api_url || undefined,
    } as CRMConfig & { api_url?: string };

    const admin = getAdminClient();
    await (admin.from("integrations") as any)
      .update({ status: "connected", config, last_sync: null })
      .eq("id", integrationId);

    await (admin.from("logs") as any).insert({
      action: "crm_connected",
      entity_type: "integration",
      entity_id: integrationId,
      organization_id: orgId,
      details: { message: `${provider} conectado via token manual`, provider },
    });

    const { data: checkItem } = await adminClient
      .from("setup_checklist")
      .select("id")
      .eq("organization_id", orgId)
      .eq("key", "connect-crm")
      .maybeSingle();

    if (checkItem) {
      await (admin.from("setup_checklist") as any)
        .update({ completed: true })
        .eq("id", (checkItem as { id: string }).id);
    }

    return NextResponse.json({ success: true, message: "CRM conectado com sucesso!" });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
