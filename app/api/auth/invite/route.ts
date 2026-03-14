import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    const { name, email, role } = await request.json();

    if (!name || !email) {
      throw new ApiError("MISSING_PARAM", "Nome e email são obrigatórios.", 400);
    }

    if (role && !["admin", "viewer"].includes(role)) {
      throw new ApiError("INVALID_ROLE", "Role deve ser 'admin' ou 'viewer'.", 400);
    }

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      throw new ApiError("ALREADY_EXISTS", "Este email já está cadastrado.", 409);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { name, role: role || "viewer" },
      redirectTo: `${appUrl}/reset-password`,
    });

    if (error) {
      if (error.message.includes("already") || error.message.includes("exists")) {
        throw new ApiError("ALREADY_EXISTS", "Este email já está cadastrado.", 409);
      }
      throw new ApiError("AUTH_ERROR", error.message, 400);
    }

    const userId = data.user.id;

    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      name,
      email,
      role: role || "viewer",
      active: true,
    });

    return NextResponse.json({
      user: { id: userId, email: data.user.email },
      message: "Convite enviado por email. O colaborador receberá um link para definir a senha.",
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
