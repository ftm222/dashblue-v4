import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createBillingPortalSession } from "@/lib/stripe";
import { apiErrorResponse, ApiError } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
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
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      throw new ApiError("NO_ORG", "Organização não encontrada", 404);
    }

    if (!["owner", "admin"].includes(profile.role)) {
      throw new ApiError("FORBIDDEN", "Apenas owner/admin podem acessar billing", 403);
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", profile.organization_id)
      .single();

    if (!org?.stripe_customer_id) {
      throw new ApiError("NO_SUBSCRIPTION", "Nenhuma assinatura ativa encontrada", 404);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalUrl = await createBillingPortalSession({
      stripeCustomerId: org.stripe_customer_id,
      returnUrl: `${appUrl}/settings`,
    });

    if (!portalUrl) {
      throw new ApiError("STRIPE_ERROR", "Erro ao criar sessão de billing", 500);
    }

    return NextResponse.json({ url: portalUrl });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
