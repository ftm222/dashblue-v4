import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { personUpdateSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, orgId } = await getAuthUserWithOrg(request);
    const { id } = await params;
    const raw = await request.json();
    const { data: body, error: validationError } = validateBody(personUpdateSchema, raw);
    if (!body) {
      throw new ApiError("VALIDATION", validationError!, 400);
    }

    const { name, role, squad_id, avatar_url, active } = body;

    const fields: Record<string, unknown> = {};
    if (name !== undefined) fields.name = name;
    if (role !== undefined) fields.role = role;
    if (squad_id !== undefined) fields.squad_id = squad_id;
    if (avatar_url !== undefined) fields.avatar_url = avatar_url;
    if (active !== undefined) fields.active = active;

    const admin = getAdminClient();
    const { data, error } = await (admin.from("people") as any)
      .update(fields)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select("*, squads(name)")
      .single();

    if (error) throw error;

    await logAudit(admin, {
      userId: user.id,
      orgId,
      action: "person_update",
      entityType: "person",
      entityId: id,
      details: fields,
    });

    return NextResponse.json({ data });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, orgId } = await getAuthUserWithOrg(request);
    const { id } = await params;

    const admin = getAdminClient();
    const { error } = await (admin.from("people") as any)
      .update({ active: false })
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) throw error;

    await logAudit(admin, {
      userId: user.id,
      orgId,
      action: "person_deactivate",
      entityType: "person",
      entityId: id,
      details: {},
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
