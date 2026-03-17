import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

const STRIPE_KEYS = [
  "secret_key",
  "webhook_secret",
  "price_starter_monthly",
  "price_starter_yearly",
  "price_pro_monthly",
  "price_pro_yearly",
] as const;

function maskSecret(value: string): string {
  if (!value || value.length < 8) return value ? "••••••••" : "";
  return value.slice(0, 7) + "••••••••" + value.slice(-4);
}

export interface StripeOrgConfig {
  secret_key?: string;
  webhook_secret?: string;
  price_starter_monthly?: string;
  price_starter_yearly?: string;
  price_pro_monthly?: string;
  price_pro_yearly?: string;
}

/** GET - Retorna config Stripe com chaves sensíveis mascaradas */
export async function GET(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);
    const admin = getAdminClient();
    const { data } = await admin
      .from("organizations")
      .select("settings")
      .eq("id", orgId)
      .single();
    const settings = (data?.settings as Record<string, unknown>) ?? {};
    const stripe = (settings.stripe ?? {}) as Record<string, string>;
    const masked: Record<string, string> = {};
    for (const key of STRIPE_KEYS) {
      const val = stripe[key];
      if (val) {
        masked[key] = key === "secret_key" || key === "webhook_secret" ? maskSecret(val) : val;
      }
    }
    return NextResponse.json(masked);
  } catch (e) {
    return apiErrorResponse(e as Error);
  }
}

/** POST - Salva config Stripe em organizations.settings.stripe */
export async function POST(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);
    const body = await request.json();
    if (typeof body !== "object" || body === null) {
      throw new ApiError("VALIDATION_ERROR", "Body inválido", 400);
    }
    const clear = body.clear === true;
    const stripe: Record<string, string> = {};
    if (!clear) {
      const isMasked = (v: string) => /•{4,}/.test(v);
      for (const key of STRIPE_KEYS) {
        const val = body[key];
        if (val != null && typeof val === "string") {
          const trimmed = val.trim();
          if (trimmed && !isMasked(trimmed)) stripe[key] = trimmed;
        }
      }
    }
    const admin = getAdminClient();
    const { data: org } = await admin
      .from("organizations")
      .select("settings")
      .eq("id", orgId)
      .single();
    const current = (org?.settings as Record<string, unknown>) ?? {};
    const currentStripe = (current.stripe ?? {}) as Record<string, string>;
    const mergedStripe = clear ? {} : { ...currentStripe, ...stripe };
    const merged = { ...current, stripe: mergedStripe };
    const { error } = await (admin.from("organizations") as any)
      .update({ settings: merged })
      .eq("id", orgId);
    if (error) throw new ApiError("DB_ERROR", error.message, 500);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiErrorResponse(e as Error);
  }
}
