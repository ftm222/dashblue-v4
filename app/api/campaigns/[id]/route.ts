import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { campaignUpdateSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, orgId } = await getAuthUserWithOrg(request);
    const { id } = await params;
    const raw = await request.json();
    const { data: body, error: validationError } = validateBody(campaignUpdateSchema, raw);
    if (!body) {
      throw new ApiError("VALIDATION", validationError!, 400);
    }

    const fields: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
      if (body[key as keyof typeof body] !== undefined) {
        fields[key] = body[key as keyof typeof body];
      }
    }

    const admin = getAdminClient();
    const { data, error } = await (admin.from("campaigns") as any)
      .update(fields)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select("*")
      .single();

    if (error) throw error;

    await logAudit(admin, {
      userId: user.id,
      orgId,
      action: "campaign_update",
      entityType: "campaign",
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
      .from("campaigns")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) throw error;

    await logAudit(admin, {
      userId: user.id,
      orgId,
      action: "campaign_delete",
      entityType: "campaign",
      entityId: id,
      details: {},
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
