import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase-admin";
import { syncIntegration, fetchCRMStages } from "@/lib/crm/sync";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new ApiError("CONFIG_ERROR", "Supabase não configurado.", 500);
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError("UNAUTHORIZED", "Token de autenticação ausente.", 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) {
      throw new ApiError("UNAUTHORIZED", "Token inválido.", 401);
    }

    const { integrationId, action } = await request.json();

    if (!integrationId) {
      throw new ApiError("MISSING_PARAM", "integrationId é obrigatório.", 400);
    }

    let orgId = userData.user.user_metadata?.organization_id as string | undefined;
    if (!orgId) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("organization_id")
        .eq("id", userData.user.id)
        .single();
      orgId = profile?.organization_id ?? undefined;
    }
    if (!orgId) {
      throw new ApiError("FORBIDDEN", "Usuário sem organização.", 403);
    }

    const { data: integration } = await adminClient
      .from("integrations")
      .select("organization_id")
      .eq("id", integrationId)
      .single();

    if (!integration || integration.organization_id !== orgId) {
      throw new ApiError("FORBIDDEN", "Integração não pertence à sua organização.", 403);
    }

    if (action === "stages") {
      const stages = await fetchCRMStages(integrationId);
      return NextResponse.json({ stages });
    }

    const result = await syncIntegration(integrationId);
    return NextResponse.json({ result });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
