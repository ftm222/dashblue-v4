import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { personCreateSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const admin = getAdminClient();
    let query = admin
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
    const { user, orgId } = await getAuthUserWithOrg(request);
    const raw = await request.json();
    const { data: body, error: validationError } = validateBody(personCreateSchema, raw);
    if (!body) {
      throw new ApiError("VALIDATION", validationError!, 400);
    }

    const { name, role, squad_id, avatar_url } = body;

    const admin = getAdminClient();
    const { data, error } = await (admin.from("people") as any)
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

    await logAudit(admin, {
      userId: user.id,
      orgId,
      action: "person_create",
      entityType: "person",
      entityId: data.id,
      details: { name: data.name, role: data.role },
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
