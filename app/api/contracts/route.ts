import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { contractCreateSchema, validateBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);

    const admin = getAdminClient();
    const { data, error } = await admin
      .from("contracts")
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
    const { data: body, error: validationError } = validateBody(contractCreateSchema, raw);
    if (!body) {
      throw new ApiError("VALIDATION", validationError!, 400);
    }

    const { client_name, value, status, sdr_id, closer_id, squad_id, evidence_id, signed_at, paid_at } = body;

    const admin = getAdminClient();
    const { data, error } = await (admin.from("contracts") as any)
      .insert({
        client_name,
        value,
        status,
        sdr_id: sdr_id ?? null,
        closer_id: closer_id ?? null,
        squad_id: squad_id ?? null,
        evidence_id: evidence_id ?? null,
        signed_at: signed_at ?? null,
        paid_at: paid_at ?? null,
        organization_id: orgId,
      })
      .select("*")
      .single();

    if (error) throw error;

    await logAudit(admin, {
      userId: user.id,
      orgId,
      action: "contract_create",
      entityType: "contract",
      entityId: data.id,
      details: { client_name: data.client_name, value: data.value, status: data.status },
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
