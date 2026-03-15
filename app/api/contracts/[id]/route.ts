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

    const { client_name, value, status, sdr_id, closer_id, squad_id, evidence_id, signed_at, paid_at } = body;

    const fields: Record<string, unknown> = {};
    if (client_name !== undefined) fields.client_name = client_name;
    if (value !== undefined) fields.value = value;
    if (status !== undefined) fields.status = status;
    if (sdr_id !== undefined) fields.sdr_id = sdr_id || null;
    if (closer_id !== undefined) fields.closer_id = closer_id || null;
    if (squad_id !== undefined) fields.squad_id = squad_id || null;
    if (evidence_id !== undefined) fields.evidence_id = evidence_id || null;
    if (signed_at !== undefined) fields.signed_at = signed_at || null;
    if (paid_at !== undefined) fields.paid_at = paid_at || null;

    const { data, error } = await adminClient
      .from("contracts")
      .update(fields)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select("*")
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
      .from("contracts")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
