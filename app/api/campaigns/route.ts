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
      .from("campaigns")
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

    const { name, source, medium, investment, impressions, clicks, leads, booked, received, won, revenue, period_start, period_end } = body;

    if (!name || !period_start || !period_end) {
      throw new ApiError("VALIDATION", "name, period_start e period_end são obrigatórios.", 400);
    }

    const { data, error } = await adminClient
      .from("campaigns")
      .insert({
        name,
        source: source || "",
        medium: medium || "",
        investment: investment || 0,
        impressions: impressions || 0,
        clicks: clicks || 0,
        leads: leads || 0,
        booked: booked || 0,
        received: received || 0,
        won: won || 0,
        revenue: revenue || 0,
        period_start,
        period_end,
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
