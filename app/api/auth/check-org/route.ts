/**
 * GET /api/auth/check-org - Diagnóstico: verifica se o usuário tem organização vinculada.
 * Retorna hasOrg, orgId e source (metadata | profile | none) sem lançar erro.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ hasOrg: false, source: "none", error: "Supabase não configurado" }, { status: 500 });
    }

    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ hasOrg: false, source: "none", error: "Token ausente" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const { data } = await supabase.auth.getUser(token);
    if (!data?.user) {
      return NextResponse.json({ hasOrg: false, source: "none", error: "Token inválido" }, { status: 401 });
    }

    let orgId = data.user.user_metadata?.organization_id as string | undefined;
    let source: "metadata" | "profile" | "none" = orgId ? "metadata" : "none";

    if (!orgId) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("organization_id")
        .eq("id", data.user.id)
        .single();
      orgId = profile?.organization_id ?? undefined;
      source = orgId ? "profile" : "none";
    }

    return NextResponse.json({
      hasOrg: Boolean(orgId),
      orgId: orgId ?? null,
      source,
      userId: data.user.id,
    });
  } catch (err) {
    console.error("[check-org]", err);
    return NextResponse.json(
      { hasOrg: false, source: "none", error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
