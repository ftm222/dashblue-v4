import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { syncIntegration } from "@/lib/crm/sync";
import { isCRMConfig } from "@/lib/crm/types";
import type { CRMConfig } from "@/lib/crm/types";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import crypto from "crypto";

function verifyHMAC(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const prefixed = `sha256=${expected}`;

  return (
    crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(signature.startsWith("sha256=") ? prefixed : expected),
    )
  );
}

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    const rl = await rateLimit(ip, "webhook");
    if (!rl.success) return rl.response!;

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get("id");

    if (!integrationId) {
      return NextResponse.json({ error: "Missing integration id" }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data: integration } = await admin
      .from("integrations")
      .select("id, config")
      .eq("id", integrationId)
      .single();

    const int = integration as { id: string; config?: unknown } | null;
    if (!int) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    if (!isCRMConfig(int.config)) {
      return NextResponse.json({ error: "Integration not configured" }, { status: 400 });
    }
    const config: CRMConfig = int.config as CRMConfig;

    const rawBody = await request.text();

    if (config.webhook_secret) {
      const signature =
        request.headers.get("x-webhook-signature") ||
        request.headers.get("x-hub-signature-256") ||
        request.headers.get("x-signature") ||
        "";

      if (!signature || !verifyHMAC(rawBody, signature, config.webhook_secret)) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }
    }

    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = {};
    }

    await (admin.from("logs") as any).insert({
      action: "webhook_received",
      entity_type: "integration",
      entity_id: integrationId,
      details: {
        message: `Webhook recebido de ${config.provider}`,
        provider: config.provider,
        event_type: body.event || body.type || "unknown",
      },
    });

    const result = await syncIntegration(integrationId);

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
