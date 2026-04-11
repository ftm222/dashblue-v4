import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Login automático só em desenvolvimento — usa credenciais em DEV_AUTO_LOGIN_*.
 * Nunca habilitar em produção (NODE_ENV === "production" bloqueia).
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Indisponível" }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.DEV_AUTO_LOGIN_EMAIL?.trim();
  const password = process.env.DEV_AUTO_LOGIN_PASSWORD;

  if (!url?.trim() || !anon?.trim()) {
    return NextResponse.json({ error: "Supabase não configurado no servidor." }, { status: 500 });
  }
  if (!email || password === undefined || password === "") {
    return NextResponse.json(
      {
        error:
          "Defina DEV_AUTO_LOGIN_EMAIL e DEV_AUTO_LOGIN_PASSWORD no .env.local (apenas desenvolvimento).",
      },
      { status: 400 },
    );
  }

  const supabase = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? "Falha ao autenticar. Verifique email e senha." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
}
