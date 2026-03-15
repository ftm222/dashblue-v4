import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase-admin";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error";

/**
 * GET /api/integrations - Lista integrações da organização.
 * Usa API + adminClient para evitar falha de RLS quando profiles.organization_id está desatualizado.
 */
export async function GET(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);

    const { data, error } = await adminClient
      .from("integrations")
      .select("id, name, type, status, last_sync")
      .eq("organization_id", orgId)
      .order("name");

    if (error) throw error;

    const items = (data ?? []).map((i) => ({
      id: i.id,
      name: i.name,
      type: i.type,
      status: i.status,
      lastSync: i.last_sync ?? undefined,
    }));

    return NextResponse.json(items);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
