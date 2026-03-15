#!/usr/bin/env node
/**
 * Vincula usuário sem organização à primeira org e define role admin.
 * Executa diretamente no Supabase via conexão PostgreSQL.
 *
 * Uso:
 *   node scripts/executar-fix-permissoes.mjs
 *   FIX_USER_EMAIL=outro@email.com node scripts/executar-fix-permissoes.mjs
 *
 * Requer no .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_DB_PASSWORD
 *
 * Variável opcional:
 *   FIX_USER_EMAIL - Email do usuário (padrão: matheus@dashblue.com.br)
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });
config();

const email = process.env.FIX_USER_EMAIL || "matheus@dashblue.com.br";
const password = process.env.SUPABASE_DB_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!password) {
  console.error(
    "\n  Forneça SUPABASE_DB_PASSWORD (senha do banco).\n" +
    "  Encontre em: supabase.com → Project Settings → Database → Database password\n\n" +
    "  Execute: SUPABASE_DB_PASSWORD=sua_senha node scripts/executar-fix-permissoes.mjs\n"
  );
  process.exit(1);
}

if (!supabaseUrl) {
  console.error("\n  NEXT_PUBLIC_SUPABASE_URL não definida no .env.local\n");
  process.exit(1);
}

const host = new URL(supabaseUrl).hostname.split(".")[0];
const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${host}.supabase.co:5432/postgres`;

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  try {
    console.log("\n  Conectando ao Supabase...");
    await client.connect();

    const { rows: orgs } = await client.query(
      "SELECT id FROM public.organizations ORDER BY created_at LIMIT 1"
    );
    if (!orgs.length) {
      console.error("\n  Nenhuma organização existe. Crie uma organização primeiro.\n");
      process.exit(1);
    }
    const orgId = orgs[0].id;

    const { rows: profiles } = await client.query(
      "SELECT id, organization_id, role FROM public.profiles WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email]
    );
    if (!profiles.length) {
      console.error(`\n  Usuário não encontrado com o email: ${email}\n`);
      process.exit(1);
    }
    const profileId = profiles[0].id;

    await client.query(
      `UPDATE public.profiles SET organization_id = $1, role = 'admin'
       WHERE id = $2 AND (organization_id IS NULL OR role != 'admin')`,
      [orgId, profileId]
    );

    await client.query(
      `INSERT INTO public.org_members (organization_id, user_id, role)
       SELECT $1, $2, 'admin'
       WHERE NOT EXISTS (
         SELECT 1 FROM public.org_members
         WHERE organization_id = $1 AND user_id = $2
       )`,
      [orgId, profileId]
    );

    await client.query(
      `UPDATE public.org_members SET role = 'admin'
       WHERE user_id = $1 AND organization_id = $2`,
      [profileId, orgId]
    );

    console.log(`\n  Usuário ${email} vinculado à organização com sucesso. Role definido como admin.\n`);
  } catch (err) {
    console.error("\n  Erro:", err.message);
    if (err.message.includes("password") || err.message.includes("authentication")) {
      console.error("  Verifique se SUPABASE_DB_PASSWORD está correto.\n");
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
