import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
