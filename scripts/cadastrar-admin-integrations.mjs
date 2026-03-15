#!/usr/bin/env node
/**
 * Cadastra o usuário Matheus Fernandes com permissão para realizar integrações (role: admin).
 *
 * Uso:
 *   node scripts/cadastrar-admin-integrations.mjs
 *   ADD_USER_EMAIL=outro@email.com node scripts/cadastrar-admin-integrations.mjs
 *
 * Variáveis de ambiente:
 *   ADD_USER_EMAIL  - Email do usuário (padrão: matheus.ft2@gmail.com)
 *   ADD_USER_PASSWORD - Senha inicial (gerada aleatoriamente se não informada)
 *   ADD_USER_ORG_ID - ID da organização (usa a primeira se não informado)
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });
config(); // fallback para .env
import { randomBytes } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const USER_NAME = "Matheus Fernandes";
const USER_EMAIL = process.env.ADD_USER_EMAIL || "matheus.ft2@gmail.com";
const USER_PASSWORD = process.env.ADD_USER_PASSWORD || randomBytes(12).toString("base64url") + "A1!";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Erro: Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("\n🔧 Cadastrando Matheus Fernandes como usuário com permissão de integrações...\n");

  // 1. Verificar se já existe por email ou nome
  let existingProfile = (await admin.from("profiles").select("id, name, email, role, organization_id").eq("email", USER_EMAIL).maybeSingle()).data;
  if (!existingProfile) {
    const { data: byName } = await admin.from("profiles").select("id, name, email, role, organization_id").ilike("name", "%Matheus Fernandes%").limit(1).maybeSingle();
    existingProfile = byName;
  }

  if (existingProfile) {
    console.log(`✓ Usuário encontrado: ${existingProfile.name} (${existingProfile.email})`);

    // Obter ou criar organização para vincular
    let { data: orgs } = await admin.from("organizations").select("id, name").limit(1);
    let orgId = orgs?.[0]?.id;
    if (!orgId) {
      console.log("⚠ Nenhuma organização existe. Criando organização padrão...");
      const slug = "dashblue-" + Date.now().toString(36);
      const { data: newOrg, error: orgErr } = await admin
        .from("organizations")
        .insert({ name: "Dashblue", slug })
        .select("id, name")
        .single();
      if (orgErr || !newOrg) {
        console.error("❌ Erro ao criar organização:", orgErr?.message || "Falha");
        process.exit(1);
      }
      orgId = newOrg.id;
      orgs = [newOrg];
      console.log(`✓ Organização criada: ${newOrg.name} (${orgId})`);
    }

    const updates = { role: "admin" };
    if (!existingProfile.organization_id && orgId) {
      updates.organization_id = orgId;
      console.log(`✓ Vinculando à organização: ${orgs[0].name}`);
    }

    if (existingProfile.role === "admin" || existingProfile.role === "owner") {
      if (!existingProfile.organization_id && orgId) {
        const { error } = await admin.from("profiles").update(updates).eq("id", existingProfile.id);
        if (error) {
          console.error("❌ Erro ao atualizar organização:", error.message);
          process.exit(1);
        }
        await admin.from("org_members").upsert(
          { organization_id: orgId, user_id: existingProfile.id, role: "admin" },
          { onConflict: "organization_id,user_id" }
        );
        console.log("✓ Organização vinculada. Usuário já era admin, permissões ok.");
      } else {
        console.log(`✓ Já possui permissão de integrações (role: ${existingProfile.role}).`);
      }
      process.exit(0);
    }

    const { error } = await admin.from("profiles").update(updates).eq("id", existingProfile.id);
    if (error) {
      console.error("❌ Erro ao atualizar role:", error.message);
      process.exit(1);
    }

    // Garantir org_members
    const targetOrgId = existingProfile.organization_id || orgId;
    if (targetOrgId) {
      await admin.from("org_members").upsert(
        { organization_id: targetOrgId, user_id: existingProfile.id, role: "admin" },
        { onConflict: "organization_id,user_id" }
      );
      await admin
        .from("org_members")
        .update({ role: "admin" })
        .eq("user_id", existingProfile.id)
        .eq("organization_id", targetOrgId);
    }

    console.log("✓ Role atualizado para 'admin'. Matheus Fernandes agora pode realizar integrações.");
    process.exit(0);
  }

  // 2. Obter uma organização existente para vincular
  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name")
    .limit(1);

  let orgId = process.env.ADD_USER_ORG_ID;
  if (!orgId && orgs?.length) {
    orgId = orgs[0].id;
    console.log(`✓ Usando organização: ${orgs[0].name} (${orgId})`);
  }
  if (!orgId) {
    console.error("❌ Nenhuma organização encontrada. Crie uma org primeiro ou defina ADD_USER_ORG_ID.");
    process.exit(1);
  }

  // 3. Criar usuário no Auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: USER_EMAIL,
    password: USER_PASSWORD,
    email_confirm: true,
    user_metadata: {
      name: USER_NAME,
      organization_id: orgId,
      role: "admin",
    },
  });

  if (authError) {
    if (authError.message.includes("already") || authError.message.includes("exists")) {
      console.log("⚠ Usuário já existe no Auth. Atualizando profile...");
      const { data: users } = await admin.auth.admin.listUsers();
      const user = users?.users?.find((u) => u.email === USER_EMAIL);
      if (user) {
        await admin.from("profiles").upsert({
          id: user.id,
          name: USER_NAME,
          email: USER_EMAIL,
          role: "admin",
          organization_id: orgId,
          active: true,
        });
        await admin.from("org_members").upsert(
          {
            organization_id: orgId,
            user_id: user.id,
            role: "admin",
          },
          { onConflict: "organization_id,user_id" }
        );
        console.log("✓ Profile atualizado com role admin.");
        process.exit(0);
      }
    }
    console.error("❌ Erro ao criar usuário:", authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;

  // 4. Garantir profile com role admin (trigger pode ter criado como viewer)
  await admin.from("profiles").upsert(
    {
      id: userId,
      name: USER_NAME,
      email: USER_EMAIL,
      role: "admin",
      organization_id: orgId,
      active: true,
    },
    { onConflict: "id" }
  );

  // 5. Adicionar a org_members
  await admin.from("org_members").upsert(
    {
      organization_id: orgId,
      user_id: userId,
      role: "admin",
    },
    { onConflict: "organization_id,user_id" }
  );

  console.log("✓ Usuário cadastrado com sucesso!");
  console.log(`  Nome: ${USER_NAME}`);
  console.log(`  Email: ${USER_EMAIL}`);
  console.log(`  Senha temporária: ${USER_PASSWORD}`);
  console.log(`  Role: admin (pode realizar integrações)`);
  console.log(`\n⚠ Guarde a senha. O usuário deve alterá-la no primeiro login.`);
  console.log(`  Acesse: ${appUrl}/login\n`);
}

main().catch((err) => {
  console.error("❌ Erro:", err.message);
  process.exit(1);
});
