import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase-admin";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { getAuthUserWithOrg } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    let query = adminClient
      .from("people")
      .select("*, squads(name)")
      .eq("organization_id", orgId)
      .order("name");

    if (role === "sdr" || role === "closer") {
      query = query.eq("role", role);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);
    const body = await request.json();

    const { name, role, squad_id, avatar_url } = body;
    if (!name || !role) {
      throw new ApiError("VALIDATION", "name e role são obrigatórios.", 400);
    }
    if (!["sdr", "closer"].includes(role)) {
      throw new ApiError("VALIDATION", "role deve ser sdr ou closer.", 400);
    }

    const { data, error } = await adminClient
      .from("people")
      .insert({
        name,
        role,
        squad_id: squad_id || null,
        avatar_url: avatar_url || null,
        organization_id: orgId,
        active: true,
      })
      .select("*, squads(name)")
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
