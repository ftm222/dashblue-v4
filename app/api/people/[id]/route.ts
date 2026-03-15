import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase-admin";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { getAuthUserWithOrg } from "@/lib/api-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);
    const { id } = await params;
    const body = await request.json();

    const { name, role, squad_id, avatar_url, active } = body;

    const fields: Record<string, unknown> = {};
    if (name !== undefined) fields.name = name;
    if (role !== undefined) fields.role = role;
    if (squad_id !== undefined) fields.squad_id = squad_id || null;
    if (avatar_url !== undefined) fields.avatar_url = avatar_url || null;
    if (active !== undefined) fields.active = active;

    const { data, error } = await adminClient
      .from("people")
      .update(fields)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select("*, squads(name)")
      .single();

    if (error) throw error;

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
    const { orgId } = await getAuthUserWithOrg(request);
    const { id } = await params;

    const { error } = await adminClient
      .from("people")
      .update({ active: false })
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
