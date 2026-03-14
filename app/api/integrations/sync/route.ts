import { NextResponse } from "next/server";
import { syncIntegration, fetchCRMStages } from "@/lib/crm/sync";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    const { integrationId, action } = await request.json();

    if (!integrationId) {
      throw new ApiError("MISSING_PARAM", "integrationId é obrigatório.", 400);
    }

    if (action === "stages") {
      const stages = await fetchCRMStages(integrationId);
      return NextResponse.json({ stages });
    }

    const result = await syncIntegration(integrationId);
    return NextResponse.json({ result });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
