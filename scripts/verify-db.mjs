import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const results = [];

async function test(name, fn) {
  try {
    const result = await fn();
    results.push({ name, status: "OK", detail: result });
    console.log(`  ✅ ${name} — ${typeof result === "number" ? result + " registros" : result}`);
  } catch (err) {
    results.push({ name, status: "ERRO", detail: err.message });
    console.log(`  ❌ ${name} — ${err.message}`);
  }
}

console.log("\n🔍 Verificando todas as chamadas ao banco de dados...\n");

// ===== READ operations =====
console.log("═══ LEITURA (SELECT) ═══\n");

await test("profiles (SELECT)", async () => {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) throw error;
  return data.length;
});

await test("people (SELECT)", async () => {
  const { data, error } = await supabase.from("people").select("*, squads(name)");
  if (error) throw error;
  return data.length;
});

await test("squads (SELECT)", async () => {
  const { data, error } = await supabase.from("squads").select("*");
  if (error) throw error;
  return data.length;
});

await test("evidence (SELECT)", async () => {
  const { data, error, count } = await supabase.from("evidence").select("*", { count: "exact" }).limit(5);
  if (error) throw error;
  return count ?? data.length;
});

await test("campaigns (SELECT)", async () => {
  const { data, error } = await supabase.from("campaigns").select("*");
  if (error) throw error;
  return data.length;
});

await test("contracts (SELECT)", async () => {
  const { data, error } = await supabase.from("contracts").select("*");
  if (error) throw error;
  return data.length;
});

await test("call_logs (SELECT)", async () => {
  const { data, error } = await supabase.from("call_logs").select("*").limit(5);
  if (error) throw error;
  return data.length;
});

await test("funnel_mappings (SELECT)", async () => {
  const { data, error } = await supabase.from("funnel_mappings").select("*").order("sort_order");
  if (error) throw error;
  return data.length;
});

await test("tags (SELECT)", async () => {
  const { data, error } = await supabase.from("tags").select("*");
  if (error) throw error;
  return data.length;
});

await test("goals (SELECT)", async () => {
  const { data, error } = await supabase.from("goals").select("*");
  if (error) throw error;
  return data.length;
});

await test("setup_checklist (SELECT)", async () => {
  const { data, error } = await supabase.from("setup_checklist").select("*");
  if (error) throw error;
  return data.length;
});

await test("integrations (SELECT)", async () => {
  const { data, error } = await supabase.from("integrations").select("*");
  if (error) throw error;
  return data.length;
});

await test("alerts (SELECT)", async () => {
  const { data, error } = await supabase.from("alerts").select("*");
  if (error) throw error;
  return data.length;
});

await test("logs (SELECT)", async () => {
  const { data, error, count } = await supabase.from("logs").select("*", { count: "exact" }).limit(5);
  if (error) throw error;
  return count ?? data.length;
});

// ===== VIEW operations =====
console.log("\n═══ VIEWS ═══\n");

await test("v_funnel_summary (VIEW)", async () => {
  const { data, error } = await supabase.from("v_funnel_summary").select("*").limit(10);
  if (error) throw error;
  return data.length;
});

await test("v_campaign_kpis (VIEW)", async () => {
  const { data, error } = await supabase.from("v_campaign_kpis").select("*").limit(5);
  if (error) throw error;
  return data.length;
});

// ===== WRITE operations (INSERT + UPDATE + DELETE cycle) =====
console.log("\n═══ ESCRITA (INSERT/UPDATE/DELETE) ═══\n");

await test("tags INSERT", async () => {
  const { data, error } = await supabase
    .from("tags")
    .insert({ original: "__test_tag__", alias: "__test_alias__" })
    .select()
    .single();
  if (error) throw error;
  return `id=${data.id}`;
});

await test("tags UPDATE", async () => {
  const { data: tag } = await supabase.from("tags").select("id").eq("original", "__test_tag__").single();
  if (!tag) throw new Error("Tag de teste não encontrada");
  const { error } = await supabase.from("tags").update({ alias: "__test_updated__" }).eq("id", tag.id);
  if (error) throw error;
  return "alias atualizado";
});

await test("tags DELETE", async () => {
  const { error } = await supabase.from("tags").delete().eq("original", "__test_tag__");
  if (error) throw error;
  return "tag de teste removida";
});

await test("funnel_mappings UPSERT", async () => {
  const { data: existing } = await supabase.from("funnel_mappings").select("*").limit(1);
  if (!existing || existing.length === 0) throw new Error("Sem mapeamentos para testar");
  const row = existing[0];
  const { error } = await supabase
    .from("funnel_mappings")
    .upsert({ id: row.id, step_key: row.step_key, step_label: row.step_label, crm_field: row.crm_field, crm_value: row.crm_value }, { onConflict: "id" });
  if (error) throw error;
  return "upsert ok";
});

await test("goals UPDATE (target)", async () => {
  const { data: goals } = await supabase.from("goals").select("id, target").limit(1);
  if (!goals || goals.length === 0) return "sem metas para testar (OK se vazio)";
  const goal = goals[0];
  const { error } = await supabase.from("goals").update({ target: goal.target }).eq("id", goal.id);
  if (error) throw error;
  return "target atualizado (sem mudança real)";
});

await test("integrations UPDATE (status)", async () => {
  const { data: ints } = await supabase.from("integrations").select("id, status").limit(1);
  if (!ints || ints.length === 0) return "sem integrações para testar (OK se vazio)";
  const int = ints[0];
  const { error } = await supabase.from("integrations").update({ status: int.status }).eq("id", int.id);
  if (error) throw error;
  return "status mantido (sem mudança real)";
});

await test("setup_checklist UPDATE", async () => {
  const { data: items } = await supabase.from("setup_checklist").select("id, completed").limit(1);
  if (!items || items.length === 0) return "sem checklist para testar (OK se vazio)";
  const item = items[0];
  const { error } = await supabase.from("setup_checklist").update({ completed: item.completed }).eq("id", item.id);
  if (error) throw error;
  return "checklist atualizado (sem mudança real)";
});

await test("profiles INSERT (collaborator)", async () => {
  const testId = "00000000-0000-0000-0000-000000000099";
  const { error: delErr } = await supabase.from("profiles").delete().eq("id", testId);
  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: testId, name: "__test_collab__", email: "__test@test.com__", role: "viewer" })
    .select()
    .single();
  if (error) throw error;
  return `id=${data.id}`;
});

await test("profiles UPDATE (active toggle)", async () => {
  const testId = "00000000-0000-0000-0000-000000000099";
  const { error } = await supabase.from("profiles").update({ active: false }).eq("id", testId);
  if (error) throw error;
  return "active=false";
});

await test("profiles DELETE (cleanup)", async () => {
  const testId = "00000000-0000-0000-0000-000000000099";
  const { error } = await supabase.from("profiles").delete().eq("id", testId);
  if (error) throw error;
  return "perfil de teste removido";
});

await test("logs SELECT com join (profiles)", async () => {
  const { data, error } = await supabase
    .from("logs")
    .select("*, profiles:user_id(name)")
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return data.length;
});

// ===== Summary =====
console.log("\n═══ RESUMO ═══\n");
const ok = results.filter((r) => r.status === "OK").length;
const fail = results.filter((r) => r.status === "ERRO").length;
console.log(`  Total: ${results.length} testes`);
console.log(`  ✅ Sucesso: ${ok}`);
console.log(`  ❌ Falha: ${fail}`);

if (fail > 0) {
  console.log("\n  Falhas detalhadas:");
  for (const r of results.filter((r) => r.status === "ERRO")) {
    console.log(`    ❌ ${r.name}: ${r.detail}`);
  }
}

console.log("");
process.exit(fail > 0 ? 1 : 0);
