import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl?.trim() && supabaseAnonKey?.trim());

let _client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (_client) return _client;
  if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local",
    );
  }
  _client = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return _client;
}

/**
 * Cliente Supabase para uso no browser/client components.
 * Usa lazy init — só instancia na primeira chamada real.
 * Compatível com todo o código existente que importa `supabase`.
 */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop: string) {
    if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
      return getStubProperty(prop);
    }
    const client = getSupabaseClient();
    const value = (client as unknown as Record<string, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

/** Alias para contornar inferência de tipos do Proxy (evita 'never' em .from) */
export const db = supabase as any;

// Stub que retorna dados vazios quando Supabase não está configurado,
// para que a landing page e o AuthProvider não crashem.
function getStubProperty(prop: string): unknown {
  if (prop === "auth") {
    return stubAuth;
  }
  if (prop === "from") {
    return () => stubQueryBuilder;
  }
  return undefined;
}

const noopAsync = async () => ({ data: null, error: null });

const stubAuth = {
  getSession: async () => ({ data: { session: null }, error: null }),
  getUser: async () => ({ data: { user: null }, error: null }),
  signInWithPassword: async () => ({ data: null, error: { message: "Supabase não configurado" } }),
  signUp: async () => ({ data: null, error: { message: "Supabase não configurado" } }),
  signOut: async () => ({ error: null }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  resetPasswordForEmail: noopAsync,
  updateUser: noopAsync,
};

const emptyResult = { data: [], error: null, count: 0 };
const nullResult = { data: null, error: null };

function chainable(): Record<string, unknown> {
  const self: Record<string, unknown> = {};
  const methods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "gt", "gte", "lt", "lte",
    "in", "or", "is", "ilike", "like", "not",
    "order", "range", "limit", "offset",
    "filter", "match", "textSearch",
    "single", "maybeSingle",
  ];
  for (const m of methods) {
    if (m === "single" || m === "maybeSingle") {
      self[m] = () => Promise.resolve(nullResult);
    } else {
      self[m] = () => Object.assign(Promise.resolve(emptyResult), self);
    }
  }
  return self;
}

const stubQueryBuilder = chainable();

// Type helpers
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
