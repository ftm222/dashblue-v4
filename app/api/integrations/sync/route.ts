import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase-admin";
import { syncIntegration, fetchCRMStages } from "@/lib/crm/sync";
import { syncMetaAds } from "@/lib/meta/sync";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

// Sync pode demorar (Meta API: campanhas + ad sets + ads × períodos)
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);

    const { integrationId, action } = await request.json();

    if (!integrationId) {
      throw new ApiError("MISSING_PARAM", "integrationId é obrigatório.", 400);
    }

    const { data: integration } = await adminClient
      .from("integrations")
      .select("id, organization_id, type, config")
      .eq("id", integrationId)
      .single();

    if (!integration || integration.organization_id !== orgId) {
      throw new ApiError("FORBIDDEN", "Integração não pertence à sua organização.", 403);
    }

    const isMetaAds =
      integration.type === "ads" &&
      integration.config != null &&
      typeof integration.config === "object" &&
      (integration.config as { provider?: string }).provider === "meta";

    if (isMetaAds) {
      const result = await syncMetaAds(integrationId);
      return NextResponse.json({ result });
    }

    const result = await syncIntegration(integrationId);
    return NextResponse.json({ result });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
