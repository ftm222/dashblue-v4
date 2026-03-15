import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase-admin";
import { getCRMAdapter, isValidProvider } from "@/lib/crm/registry";
import type { CRMConfig } from "@/lib/crm/types";

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

    if (!integrationId || !provider || !isValidProvider(provider)) {
      return NextResponse.redirect(`${redirectPage}?error=invalid_state`);
    }

    const adapter = getCRMAdapter(provider);
    const tokens = await adapter.exchangeCode(code);

    const isValid = await adapter.testConnection(tokens);
    if (!isValid) {
      return NextResponse.redirect(`${redirectPage}?error=connection_test_failed`);
    }

    const config: CRMConfig = { provider, tokens };

    await adminClient
      .from("integrations")
      .update({ status: "connected", config, last_sync: null })
      .eq("id", integrationId);

    await adminClient.from("logs").insert({
      action: "crm_connected",
      entity_type: "integration",
      entity_id: integrationId,
      details: { message: `${provider} conectado com sucesso`, provider },
    });

    const { data: checkItem } = await adminClient
      .from("setup_checklist")
      .select("id")
      .eq("key", "connect-crm")
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
