/**
 * Executa a migração SQL no Supabase via conexão direta PostgreSQL.
 *
 * Uso:
 *   SUPABASE_DB_PASSWORD=sua_senha node supabase/run-migration.mjs
 *
 * A senha do banco está em:
 *   supabase.com → Project Settings → Database → Database password
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, "migration.sql"), "utf-8");

const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error(
    "\n  Forneça a senha do banco de dados.\n" +
    "  Encontre em: supabase.com → Project Settings → Database → Database password\n\n" +
    "  Execute assim:\n" +
    "  SUPABASE_DB_PASSWORD=sua_senha node supabase/run-migration.mjs\n"
  );
  process.exit(1);
}

const connectionString =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `postgresql://postgres:${encodeURIComponent(password)}@db.${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]}.supabase.co:5432/postgres`
    : (() => { console.error("NEXT_PUBLIC_SUPABASE_URL não definida"); process.exit(1); })();

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  console.log("Conectando ao Supabase PostgreSQL...");
  await client.connect();
  console.log("Conectado!\n");

  console.log("Executando migração...\n");
  await client.query(sql);

  console.log("Migração executada com sucesso!");

  const { rows: tables } = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
    order by table_name
  `);

  const { rows: views } = await client.query(`
    select table_name
    from information_schema.views
    where table_schema = 'public'
    order by table_name
  `);

  console.log(`\nTabelas criadas (${tables.length}):`);
  tables.forEach((t) => console.log(`  ✓ ${t.table_name}`));

  console.log(`\nViews criadas (${views.length}):`);
  views.forEach((v) => console.log(`  ✓ ${v.table_name}`));

} catch (err) {
  console.error("\nErro na migração:", err.message);
  if (err.message.includes("password")) {
    console.error("  → Verifique se a senha do banco está correta.");
  }
  process.exit(1);
} finally {
  await client.end();
}
