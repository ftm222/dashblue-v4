import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ApiError, apiErrorResponse } from "@/lib/api-error";
import { inviteSchema, validateBody } from "@/lib/validations";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    const rl = await rateLimit(ip, "auth");
    if (!rl.success) return rl.response!;

    const raw = await request.json();
    const { data: body, error: validationError } = validateBody(inviteSchema, raw);
    if (!body) {
      throw new ApiError("VALIDATION_ERROR", validationError!, 400);
    }

    const { name, email, role } = body;

    // Obter org_id do usuário que está convidando (via token)
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) throw new ApiError("UNAUTHORIZED", "Token não fornecido", 401);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: { user: inviter } } = await supabase.auth.getUser(token);
    if (!inviter) throw new ApiError("UNAUTHORIZED", "Não autorizado", 401);

    const { data: inviterProfile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id, role")
      .eq("id", inviter.id)
      .single();

    if (!inviterProfile?.organization_id) {
      throw new ApiError("NO_ORG", "Organização não encontrada", 404);
    }

    if (!["owner", "admin"].includes(inviterProfile.role)) {
      throw new ApiError("FORBIDDEN", "Apenas owner/admin podem convidar membros", 403);
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
      data: {
        name,
        role: role ?? "viewer",
        organization_id: inviterProfile.organization_id,
      },
      redirectTo: `${appUrl}/reset-password`,
    });

    if (error) {
      if (error.message.includes("already") || error.message.includes("exists")) {
        throw new ApiError("ALREADY_EXISTS", "Este email já está cadastrado.", 409);
      }
      throw new ApiError("AUTH_ERROR", error.message, 400);
    }

    const userId = data.user.id;

    // Profile é criado pelo trigger handle_new_user com org_id
    // Mas fazemos upsert para garantir dados corretos
    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      name,
      email,
      role: role ?? "viewer",
      organization_id: inviterProfile.organization_id,
      active: true,
    });

    // Criar membership
    await supabaseAdmin.from("org_members").insert({
      organization_id: inviterProfile.organization_id,
      user_id: userId,
      role: role ?? "viewer",
    });

    return NextResponse.json({
      user: { id: userId, email: data.user.email },
      message: "Convite enviado por email.",
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
