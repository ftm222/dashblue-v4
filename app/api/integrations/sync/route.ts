import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase-admin";
import { syncIntegration, fetchCRMStages } from "@/lib/crm/sync";
import { syncAdsIntegration } from "@/lib/ads/sync";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);

    const { integrationId, action } = await request.json();

    if (!integrationId) {
      throw new ApiError("MISSING_PARAM", "integrationId é obrigatório.", 400);
    }

    const { data: integration } = await adminClient
      .from("integrations")
      .select("organization_id, type")
      .eq("id", integrationId)
      .single();

    const int = integration as { organization_id?: string; type?: string } | null;
    if (!int || int.organization_id !== orgId) {
      throw new ApiError("FORBIDDEN", "Integração não pertence à sua organização.", 403);
    }

    if (action === "stages") {
      if (int.type !== "crm") {
        throw new ApiError("INVALID_TYPE", "Stages disponíveis apenas para CRMs.", 400);
      }
      const stages = await fetchCRMStages(integrationId);
      return NextResponse.json({ stages });
    }

    if (int.type === "ads") {
      const result = await syncAdsIntegration(integrationId);
      return NextResponse.json({ result });
    }

    const result = await syncIntegration(integrationId);
    return NextResponse.json({ result });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
