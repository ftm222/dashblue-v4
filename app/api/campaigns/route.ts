import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { campaignCreateSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);
    const admin = getAdminClient();

    const { data, error } = await admin
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
    const { user, orgId } = await getAuthUserWithOrg(request);
    const raw = await request.json();
    const { data: body, error: validationError } = validateBody(campaignCreateSchema, raw);
    if (!body) {
      throw new ApiError("VALIDATION", validationError!, 400);
    }

    const { name, source, medium, investment, impressions, clicks, leads, booked, received, won, revenue, period_start, period_end } = body;

    const admin = getAdminClient();
    const { data, error } = await (admin.from("campaigns") as any)
      .insert({
        name,
        source: source ?? "",
        medium: medium ?? "",
        investment: investment ?? 0,
        impressions: impressions ?? 0,
        clicks: clicks ?? 0,
        leads: leads ?? 0,
        booked: booked ?? 0,
        received: received ?? 0,
        won: won ?? 0,
        revenue: revenue ?? 0,
        period_start,
        period_end,
        organization_id: orgId,
      })
      .select("*")
      .single();

    if (error) throw error;

    await logAudit(admin, {
      userId: user.id,
      orgId,
      action: "campaign_create",
      entityType: "campaign",
      entityId: data.id,
      details: { name: data.name, source: data.source },
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
