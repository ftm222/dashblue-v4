import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 8 caracteres." },
        { status: 400 },
      );
    }

    // Se a service role key estiver configurada, usa admin API (sem rate limit de email)
    if (serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

      if (error) {
        if (error.message.includes("already") || error.message.includes("exists")) {
          return NextResponse.json(
            { error: "Este email já está cadastrado. Tente fazer login." },
            { status: 409 },
          );
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
    }

    // Fallback: usa anon key com signUp padrão
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
          { status: 429 },
        );
      }
      if (error.message.includes("already registered")) {
        return NextResponse.json(
          { error: "Este email já está cadastrado. Tente fazer login." },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Erro ao criar a conta. Tente novamente." },
        { status: 500 },
      );
    }

    const needsConfirmation = data.user?.identities?.length === 0 ||
      data.session === null;

    return NextResponse.json({
      user: { id: userId, email: data.user?.email },
      needsConfirmation,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno do servidor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
