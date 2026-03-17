import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { getAuthUserWithOrg } from "@/lib/api-auth";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    const { orgId } = await getAuthUserWithOrg(request);
    const body = await request.json();

    const { name, type } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new ApiError("VALIDATION", "Nome da integração é obrigatório.", 400);
    }

    const validTypes = ["crm", "ads"];
    if (!type || !validTypes.includes(type)) {
      throw new ApiError("VALIDATION", "Tipo deve ser 'crm' ou 'ads'.", 400);
    }

    const admin = getAdminClient();
    const { data: integration, error } = await (admin.from("integrations") as any)
      .insert({
        name: name.trim(),
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
