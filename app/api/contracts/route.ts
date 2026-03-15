import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase-admin";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getAuthUser(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new ApiError("UNAUTHORIZED", "Token ausente.", 401);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
  const { data } = await supabase.auth.getUser(token);
  if (!data?.user) throw new ApiError("UNAUTHORIZED", "Token inválido.", 401);

  const orgId = data.user.user_metadata?.organization_id as string | undefined;
  if (!orgId) throw new ApiError("FORBIDDEN", "Usuário sem organização.", 403);

  return { user: data.user, orgId };
}

export async function GET(request: Request) {
  try {
    const { orgId } = await getAuthUser(request);

    const { data, error } = await adminClient
      .from("contracts")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { orgId } = await getAuthUser(request);
    const body = await request.json();

    const { client_name, value, status, sdr_id, closer_id, squad_id, evidence_id, signed_at, paid_at } = body;

    if (!client_name || value === undefined || !status) {
      throw new ApiError("VALIDATION", "client_name, value e status são obrigatórios.", 400);
    }

    const { data, error } = await adminClient
      .from("contracts")
      .insert({
        client_name,
        value,
        status,
        sdr_id: sdr_id || null,
        closer_id: closer_id || null,
        squad_id: squad_id || null,
        evidence_id: evidence_id || null,
        signed_at: signed_at || null,
        paid_at: paid_at || null,
        organization_id: orgId,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
