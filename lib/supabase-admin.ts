import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured = Boolean(supabaseUrl && serviceRoleKey);

let _client: SupabaseClient<Database> | null = null;

/**
 * Retorna o cliente admin com service_role_key.
 * Ignora RLS — usar APENAS em server-side (API routes, webhooks, sync).
 * Lança erro se as variáveis não estiverem configuradas.
 */
export function getAdminClient(): SupabaseClient<Database> {
  if (_client) return _client;
  if (!isConfigured) {
    throw new Error(
      "Supabase Admin não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  _client = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

/**
 * Proxy com lazy init para manter compatibilidade com imports existentes.
 * Ex: `import { supabaseAdmin } from "@/lib/supabase-admin"`
 */
export const supabaseAdmin: SupabaseClient<Database> = new Proxy(
  {} as SupabaseClient<Database>,
  {
    get(_target, prop: string) {
      const client = getAdminClient();
      const value = (client as Record<string, unknown>)[prop];
      if (typeof value === "function") {
        return value.bind(client);
      }
      return value;
    },
  },
);

export const adminClient = supabaseAdmin;
