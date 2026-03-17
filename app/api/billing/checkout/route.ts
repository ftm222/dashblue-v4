import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createCheckoutSession } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase-admin";
import { z } from "zod";
import { apiErrorResponse, ApiError } from "@/lib/api-error";

const checkoutSchema = z.object({
  planId: z.enum(["starter", "pro"]),
  interval: z.enum(["month", "year"]).default("month"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError("UNAUTHORIZED", "Token não fornecido", 401);

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new ApiError("UNAUTHORIZED", "Não autorizado", 401);

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, email, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      throw new ApiError("NO_ORG", "Organização não encontrada", 404);
    }

    if (!["owner", "admin"].includes(profile.role)) {
      throw new ApiError("FORBIDDEN", "Apenas owner/admin podem gerenciar billing", 403);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { data: orgData } = await adminClient
      .from("organizations")
      .select("settings")
      .eq("id", profile.organization_id)
      .single();
    const orgTyped = orgData as { settings?: Record<string, unknown> } | null;
    const stripeConfig = orgTyped?.settings?.stripe;

    const checkoutUrl = await createCheckoutSession({
      organizationId: profile.organization_id,
      planId: parsed.data.planId,
      interval: parsed.data.interval,
      customerEmail: profile.email,
      successUrl: `${appUrl}/admin/setup?billing=success`,
      cancelUrl: `${appUrl}/admin/setup?billing=canceled`,
      stripeConfig: stripeConfig as Record<string, string> | undefined,
    });

    if (!checkoutUrl) {
      throw new ApiError("STRIPE_ERROR", "Stripe não configurado ou plano inválido", 500);
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
