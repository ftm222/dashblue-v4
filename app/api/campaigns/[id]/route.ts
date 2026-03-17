import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
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

    const allowedFields = [
      "name", "source", "medium", "investment", "impressions", "clicks",
      "leads", "booked", "received", "won", "revenue", "period_start", "period_end",
    ];

    const fields: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) fields[key] = body[key];
    }

    const admin = getAdminClient();
    const { data, error } = await (admin.from("campaigns") as any)
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

    const admin = getAdminClient();
    const { error } = await admin
      .from("campaigns")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
