import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase-admin";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

/**
 * PATCH /api/integrations/[id] - Atualiza status da integração.
 * Usa API + adminClient para evitar falha de RLS.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);
    const { id } = await params;

    const body = await request.json();
    const { status } = body;

    if (!status || !["connected", "disconnected"].includes(status)) {
      throw new ApiError("VALIDATION", "status deve ser 'connected' ou 'disconnected'.", 400);
    }

    const { data: integration } = await adminClient
      .from("integrations")
      .select("organization_id")
      .eq("id", id)
      .single();

    if (!integration || integration.organization_id !== orgId) {
      throw new ApiError("FORBIDDEN", "Integração não pertence à sua organização.", 403);
    }

    const update: Record<string, unknown> = { status };
    if (status === "disconnected") {
      update.last_sync = null;
    }

    const { error } = await adminClient
      .from("integrations")
      .update(update)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
