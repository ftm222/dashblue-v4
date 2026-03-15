import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase-admin";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { getAuthUserWithOrg } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);

    const { data, error } = await adminClient
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
    const { orgId } = await getAuthUserWithOrg(request);
    const body = await request.json();

    const { client_name, value, status, sdr_id, closer_id, squad_id, evidence_id, signed_at, paid_at } = body;

    if (!client_name || value === undefined || !status) {
      throw new ApiError("VALIDATION", "client_name, value e status são obrigatórios.", 400);
    }

    const { data, error } = await adminClient
      .from("contracts")
      .insert({
        client_name,
        value,
        status,
        sdr_id: sdr_id || null,
        closer_id: closer_id || null,
        squad_id: squad_id || null,
        evidence_id: evidence_id || null,
        signed_at: signed_at || null,
        paid_at: paid_at || null,
        organization_id: orgId,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
