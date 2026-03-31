import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { contractUpdateSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, orgId } = await getAuthUserWithOrg(request);
    const { id } = await params;
    const raw = await request.json();
    const { data: body, error: validationError } = validateBody(contractUpdateSchema, raw);
    if (!body) {
      throw new ApiError("VALIDATION", validationError!, 400);
    }

    const { client_name, value, status, sdr_id, closer_id, squad_id, evidence_id, signed_at, paid_at } = body;

    const fields: Record<string, unknown> = {};
    if (client_name !== undefined) fields.client_name = client_name;
    if (value !== undefined) fields.value = value;
    if (status !== undefined) fields.status = status;
    if (sdr_id !== undefined) fields.sdr_id = sdr_id;
    if (closer_id !== undefined) fields.closer_id = closer_id;
    if (squad_id !== undefined) fields.squad_id = squad_id;
    if (evidence_id !== undefined) fields.evidence_id = evidence_id;
    if (signed_at !== undefined) fields.signed_at = signed_at;
    if (paid_at !== undefined) fields.paid_at = paid_at;

    const admin = getAdminClient();
    const { data, error } = await (admin.from("contracts") as any)
      .update(fields)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select("*")
      .single();

    if (error) throw error;

    await logAudit(admin, {
      userId: user.id,
      orgId,
      action: "contract_update",
      entityType: "contract",
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
    const { error } = await admin
      .from("contracts")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) throw error;

    await logAudit(admin, {
      userId: user.id,
      orgId,
      action: "contract_delete",
      entityType: "contract",
      entityId: id,
      details: {},
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
