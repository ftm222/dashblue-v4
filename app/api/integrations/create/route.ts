import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { integrationCreateSchema, validateBody } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);
    const raw = await request.json();
    const { data: body, error: validationError } = validateBody(integrationCreateSchema, raw);
    if (!body) {
      throw new ApiError("VALIDATION", validationError!, 400);
    }

    const { name, type } = body;

    const admin = getAdminClient();
    const { data: integration, error } = await (admin.from("integrations") as any)
      .insert({
        name,
        type,
        status: "disconnected",
        organization_id: orgId,
      })
      .select("id, name, type, status")
      .single();

    if (error) {
      console.error("[integrations/create]", error);
      throw new ApiError("CREATE_FAILED", error.message || "Falha ao criar integração.", 500);
    }

    const int = integration as { id: string; name: string; type: string; status: string };
    return NextResponse.json({
      id: int.id,
      name: int.name,
      type: int.type,
      status: int.status,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
