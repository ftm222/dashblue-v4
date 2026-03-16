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
    const { status, force_reset_sync } = body;

    const { data: integration } = await adminClient
      .from("integrations")
      .select("organization_id, status")
      .eq("id", id)
      .single();

    if (!integration || integration.organization_id !== orgId) {
      throw new ApiError("FORBIDDEN", "Integração não pertence à sua organização.", 403);
    }

    let update: Record<string, unknown>;

    if (force_reset_sync === true && integration.status === "syncing") {
      update = { status: "connected" };
    } else if (status && ["connected", "disconnected"].includes(status)) {
      update = { status };
      if (status === "disconnected") {
        update.last_sync = null;
      }
    } else {
      throw new ApiError("VALIDATION", "Informe status ('connected' ou 'disconnected') ou force_reset_sync.", 400);
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

/**
 * DELETE /api/integrations/[id] - Remove a integração permanentemente.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await getAuthUserWithOrg(_request);
    const { id } = await params;

    const { data: integration } = await adminClient
      .from("integrations")
      .select("organization_id")
      .eq("id", id)
      .single();

    if (!integration || integration.organization_id !== orgId) {
      throw new ApiError("FORBIDDEN", "Integração não pertence à sua organização.", 403);
    }

    const { error } = await adminClient
      .from("integrations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
