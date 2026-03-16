import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase-admin";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error";

/**
 * POST /api/integrations/disconnect-crm
 * Desconecta todos os CRMs da organização e reseta o checklist de setup.
 * Usado ao "Trocar CRM" na página de Configuração.
 */
export async function POST(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);

    const { error: integrationsError } = await adminClient
      .from("integrations")
      .update({ status: "disconnected", last_sync: null })
      .eq("organization_id", orgId)
      .eq("type", "crm");

    if (integrationsError) throw integrationsError;

    const { error: checklistError } = await adminClient
      .from("setup_checklist")
      .update({ completed: false })
      .eq("organization_id", orgId);

    if (checklistError) throw checklistError;

    return NextResponse.json({ success: true, message: "CRM desconectado com sucesso." });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
