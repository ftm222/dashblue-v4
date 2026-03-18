/**
 * Helper centralizado para autenticação e obtenção de orgId em rotas API.
 * Garante fallback para profiles.organization_id quando user_metadata está vazio,
 * alinhando com as regras do banco e o modelo SaaS multi-tenant.
 * Sincroniza user_metadata quando orgId vem do profile (mantém banco e Auth alinhados).
 */
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase-admin";
import { ApiError } from "@/lib/api-error";

export interface AuthUserResult {
  user: User;
  orgId: string;
}

export async function getAuthUserWithOrg(request: Request): Promise<AuthUserResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new ApiError("CONFIG_ERROR", "Supabase não configurado.", 500);
  }

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new ApiError("UNAUTHORIZED", "Token de autenticação ausente.", 401);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
  const { data } = await supabase.auth.getUser(token);
  if (!data?.user) throw new ApiError("UNAUTHORIZED", "Token inválido.", 401);

  let orgId = data.user.user_metadata?.organization_id as string | undefined;
  let cameFromProfile = false;

  if (!orgId) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("organization_id")
      .eq("id", data.user.id)
      .single();
    const profileRow = profile as { organization_id?: string } | null;
    orgId = profileRow?.organization_id ?? undefined;
    cameFromProfile = Boolean(orgId);
  }

  if (!orgId) throw new ApiError("FORBIDDEN", "Usuário sem organização.", 403);

  // Sincroniza Auth.user_metadata quando orgId veio do profile (mantém banco e Auth alinhados)
  if (cameFromProfile) {
    adminClient.auth.admin
      .updateUserById(data.user.id, {
        user_metadata: { ...data.user.user_metadata, organization_id: orgId },
      })
      .then(() => {})
      .catch(() => {});
  }

  return { user: data.user, orgId };
}
