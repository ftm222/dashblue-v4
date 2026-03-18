import { NextResponse } from "next/server";
import { adminClient, getAdminClient } from "@/lib/supabase-admin";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

/**
 * PATCH /api/integrations/[id] - Atualiza status e/ou webhook_secret da integração.
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
    const { status, webhook_secret } = body;

    if (status === undefined && webhook_secret === undefined) {
      throw new ApiError("VALIDATION", "Informe status e/ou webhook_secret.", 400);
    }

    if (status && !["connected", "disconnected"].includes(status)) {
      throw new ApiError("VALIDATION", "status deve ser 'connected' ou 'disconnected'.", 400);
    }

    const { data: integration } = await adminClient
      .from("integrations")
      .select("organization_id, config")
      .eq("id", id)
      .single();

    const int = integration as { organization_id?: string; config?: Record<string, unknown> } | null;
    if (!int || int.organization_id !== orgId) {
      throw new ApiError("FORBIDDEN", "Integração não pertence à sua organização.", 403);
    }

    const update: Record<string, unknown> = {};
    if (status) {
      update.status = status;
      if (status === "disconnected") {
        update.last_sync = null;
      }
    }

    if (webhook_secret !== undefined) {
      const currentConfig = (int.config || {}) as Record<string, unknown>;
      update.config = {
        ...currentConfig,
        webhook_secret: typeof webhook_secret === "string" ? webhook_secret : null,
      };
    }

    const admin = getAdminClient();
    const { error } = await (admin.from("integrations") as any).update(update).eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

/**
 * DELETE /api/integrations/[id] - Exclui uma integração.
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

    const int = integration as { organization_id?: string } | null;
    if (!int || int.organization_id !== orgId) {
      throw new ApiError("FORBIDDEN", "Integração não pertence à sua organização.", 403);
    }

    const admin = getAdminClient();
    const { error } = await (admin.from("integrations") as any).delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
