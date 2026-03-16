import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase-admin";
import { getCRMAdapter, isValidProvider } from "@/lib/crm/registry";
import type { CRMConfig } from "@/lib/crm/types";
import { exchangeMetaCode, testMetaConnection } from "@/lib/meta/oauth";

function isValidProviderOrMeta(p: string): boolean {
  return isValidProvider(p) || p === "meta";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectPage = `${baseUrl}/admin/integrations`;

  if (error) {
    return NextResponse.redirect(`${redirectPage}?error=${encodeURIComponent(error)}`);
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${redirectPage}?error=missing_params`);
  }

  try {
    const state = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    const { integrationId, provider } = state;

    if (!integrationId || !provider || !isValidProviderOrMeta(provider)) {
      return NextResponse.redirect(`${redirectPage}?error=invalid_state`);
    }

    const { data: integration } = await adminClient
      .from("integrations")
      .select("organization_id")
      .eq("id", integrationId)
      .single();
    if (!integration?.organization_id) {
      return NextResponse.redirect(`${redirectPage}?error=integration_not_found`);
    }
    const orgId = integration.organization_id;

    let config: Record<string, unknown>;
    const actionLog = provider === "meta" ? "meta_connected" : "crm_connected";

    if (provider === "meta") {
      const tokens = await exchangeMetaCode(code);
      const isValid = await testMetaConnection(tokens.access_token);
      if (!isValid) {
        return NextResponse.redirect(`${redirectPage}?error=connection_test_failed`);
      }
      config = {
        provider: "meta",
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.access_token,
          expires_at: tokens.expires_at,
        },
      };
    } else {
      const adapter = getCRMAdapter(provider);
      const tokens = await adapter.exchangeCode(code);

      const isValid = await adapter.testConnection(tokens);
      if (!isValid) {
        return NextResponse.redirect(`${redirectPage}?error=connection_test_failed`);
      }

      config = {
        provider,
        tokens,
        ...(tokens.company_domain && { company_domain: tokens.company_domain }),
      } as CRMConfig;
    }

    await adminClient
      .from("integrations")
      .update({ status: "connected", config, last_sync: null })
      .eq("id", integrationId);

    await adminClient.from("logs").insert({
      action: actionLog,
      entity_type: "integration",
      entity_id: integrationId,
      organization_id: orgId,
      details: { message: `${provider} conectado com sucesso`, provider },
    });

    const checklistKey = provider === "meta" ? "connect-ads" : "connect-crm";
    const { data: checkItem } = await adminClient
      .from("setup_checklist")
      .select("id")
      .eq("organization_id", orgId)
      .eq("key", checklistKey)
      .maybeSingle();

    if (checkItem) {
      await adminClient
        .from("setup_checklist")
        .update({ completed: true })
        .eq("id", checkItem.id);
    }

    return NextResponse.redirect(`${redirectPage}?success=connected`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.redirect(`${redirectPage}?error=${encodeURIComponent(message)}`);
  }
}
