import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { registerSchema, validateBody } from "@/lib/validations";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    const rl = await rateLimit(ip, "auth");
    if (!rl.success) return rl.response!;

    const raw = await request.json();
    const { data: body, error: validationError } = validateBody(registerSchema, raw);
    if (!body) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { name, email, password } = body;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY não configurada." },
        { status: 500 },
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Criar a organização (tenant)
    const orgSlug = slugify(name) + "-" + Date.now().toString(36);

    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({ name: `Org de ${name}`, slug: orgSlug })
      .select("id")
      .single();

    if (orgError) {
      console.error("[Register] Org creation failed:", orgError.message);
      return NextResponse.json({ error: "Erro ao criar organização." }, { status: 500 });
    }

    // 2. Criar o usuário com metadata contendo org_id e role owner
    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: "owner",
        organization_id: org.id,
      },
    });

    if (userError) {
      // Rollback: remover a org criada
      await admin.from("organizations").delete().eq("id", org.id);

      if (userError.message.includes("already") || userError.message.includes("exists")) {
        return NextResponse.json(
          { error: "Este email já está cadastrado. Tente fazer login." },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    const userId = userData.user.id;

    // 3. Criar membership (owner)
    await admin.from("org_members").insert({
      organization_id: org.id,
      user_id: userId,
      role: "owner",
      accepted_at: new Date().toISOString(),
    });

    // 4. Inserir setup_checklist padrão para a nova org
    await admin.from("setup_checklist").insert([
      { key: "connect-crm",  label: "Conectar CRM",                     completed: false, route: "/admin/integrations",  organization_id: org.id },
      { key: "connect-ads",  label: "Conectar plataforma de Ads",       completed: false, route: "/admin/integrations",  organization_id: org.id },
      { key: "map-funnel",   label: "Mapear etapas do funil",           completed: false, route: "/admin/funnel-mapping", organization_id: org.id },
      { key: "add-team",     label: "Cadastrar equipe (SDRs e Closers)", completed: false, route: "/admin/people",        organization_id: org.id },
      { key: "set-goals",    label: "Definir metas do período",         completed: false, route: "/admin/goals",          organization_id: org.id },
      { key: "first-sync",   label: "Realizar primeira sincronização",  completed: false, route: "/admin/integrations",  organization_id: org.id },
    ]);

    // 5. Inserir integrações padrão (desconectadas) para a nova org
    await admin.from("integrations").insert([
      { name: "Kommo CRM",   type: "crm", status: "disconnected", organization_id: org.id },
      { name: "Meta Ads",    type: "ads", status: "disconnected", organization_id: org.id },
      { name: "Google Ads",  type: "ads", status: "disconnected", organization_id: org.id },
    ]);

    // 6. Inserir funil padrão para a nova org
    await admin.from("funnel_mappings").insert([
      { step_key: "leads",       step_label: "Leads",       sort_order: 0, organization_id: org.id },
      { step_key: "booked",      step_label: "Agendados",   sort_order: 1, organization_id: org.id },
      { step_key: "received",    step_label: "Recebidos",   sort_order: 2, organization_id: org.id },
      { step_key: "negotiation", step_label: "Negociação",  sort_order: 3, organization_id: org.id },
      { step_key: "won",         step_label: "Fechados",    sort_order: 4, organization_id: org.id },
    ]);

    // 7. Criar 3 squads padrão
    await admin.from("squads").insert([
      { name: "Alpha", organization_id: org.id },
      { name: "Beta",  organization_id: org.id },
      { name: "Gamma", organization_id: org.id },
    ]);

    return NextResponse.json({
      user: { id: userId, email: userData.user.email },
      organization: { id: org.id, slug: orgSlug },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno do servidor.";
    console.error("[Register]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
