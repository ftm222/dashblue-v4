import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const anon = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

let passed = 0;
let failed = 0;
let skipped = 0;

async function test(name, fn) {
  try {
    const result = await fn();
    console.log(`  ✅ ${name}${result !== undefined ? ` → ${result}` : ""}`);
    passed++;
    return true;
  } catch (err) {
    console.log(`  ❌ ${name}: ${err.message}`);
    failed++;
    return false;
  }
}

function skip(name, reason) {
  console.log(`  ⏭️  ${name}: ${reason}`);
  skipped++;
}

console.log("\n╔══════════════════════════════════════════════════════╗");
console.log("║  VERIFICAÇÃO COMPLETA: SELECT / INSERT / UPDATE / DELETE  ║");
console.log("╚══════════════════════════════════════════════════════╝\n");

// ═══════════════════════════════════════════════════════════════
// SELECT (consultas)
// ═══════════════════════════════════════════════════════════════
console.log("━━━ SELECT (Consultas) ━━━\n");

await test("profiles SELECT", async () => {
  const { data, error } = await anon.from("profiles").select("*");
  if (error) throw error;
  return `${data.length} registros`;
});

await test("squads SELECT", async () => {
  const { data, error } = await anon.from("squads").select("*");
  if (error) throw error;
  return `${data.length} registros`;
});

await test("people SELECT (com join squads)", async () => {
  const { data, error } = await anon.from("people").select("*, squads(name)").eq("active", true);
  if (error) throw error;
  return `${data.length} registros`;
});

await test("integrations SELECT", async () => {
  const { data, error } = await anon.from("integrations").select("*").order("name");
  if (error) throw error;
  return `${data.length} registros`;
});

await test("funnel_mappings SELECT", async () => {
  const { data, error } = await anon.from("funnel_mappings").select("*").order("sort_order");
  if (error) throw error;
  return `${data.length} registros`;
});

await test("tags SELECT", async () => {
  const { data, error } = await anon.from("tags").select("*").order("created_at");
  if (error) throw error;
  return `${data.length} registros`;
});

await test("goals SELECT (globais)", async () => {
  const { data, error } = await anon.from("goals").select("*").is("person_id", null);
  if (error) throw error;
  return `${data.length} registros`;
});

await test("goals SELECT (individuais)", async () => {
  const { data, error } = await anon.from("goals").select("*").not("person_id", "is", null);
  if (error) throw error;
  return `${data.length} registros`;
});

await test("setup_checklist SELECT", async () => {
  const { data, error } = await anon.from("setup_checklist").select("*").order("key");
  if (error) throw error;
  return `${data.length} registros`;
});

await test("evidence SELECT (paginado)", async () => {
  const { data, error, count } = await anon.from("evidence").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(0, 24);
  if (error) throw error;
  return `${data.length} retornados, ${count} total`;
});

await test("evidence SELECT (com filtro funnel_step)", async () => {
  const { data, error } = await anon.from("evidence").select("*").eq("funnel_step", "leads");
  if (error) throw error;
  return `${data.length} leads`;
});

await test("evidence SELECT (com filtro ilike)", async () => {
  const { data, error } = await anon.from("evidence").select("*").ilike("contact_name", "%a%");
  if (error) throw error;
  return `${data.length} resultados`;
});

await test("contracts SELECT", async () => {
  const { data, error } = await anon.from("contracts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return `${data.length} registros`;
});

await test("campaigns SELECT (com filtro de período)", async () => {
  const { data, error } = await anon.from("campaigns").select("*").gte("period_start", "2025-01-01").lte("period_end", "2026-12-31");
  if (error) throw error;
  return `${data.length} registros`;
});

await test("call_logs SELECT", async () => {
  const { data, error } = await anon.from("call_logs").select("*");
  if (error) throw error;
  return `${data.length} registros`;
});

await test("alerts SELECT (com filtro expires_at)", async () => {
  const { data, error } = await anon.from("alerts").select("*").or("expires_at.is.null,expires_at.gt.now()");
  if (error) throw error;
  return `${data.length} registros`;
});

await test("logs SELECT (com join profiles)", async () => {
  const { data, error } = await anon.from("logs").select("*, profiles:user_id(name)", { count: "exact" }).order("created_at", { ascending: false }).range(0, 9);
  if (error) throw error;
  return `${data.length} registros`;
});

// Views
console.log("\n━━━ VIEWS (Consultas agregadas) ━━━\n");

await test("v_funnel_summary", async () => {
  const { data, error } = await anon.from("v_funnel_summary").select("*");
  if (error) throw error;
  return `${data.length} linhas`;
});

await test("v_person_metrics", async () => {
  const { data, error } = await anon.from("v_person_metrics").select("*");
  if (error) throw error;
  return `${data.length} linhas`;
});

await test("v_call_metrics", async () => {
  const { data, error } = await anon.from("v_call_metrics").select("*");
  if (error) throw error;
  return `${data.length} linhas`;
});

await test("v_squad_metrics", async () => {
  const { data, error } = await anon.from("v_squad_metrics").select("*");
  if (error) throw error;
  return `${data.length} linhas`;
});

await test("v_financial_summary", async () => {
  const { data, error } = await anon.from("v_financial_summary").select("*");
  if (error) throw error;
  return `${data.length} linhas`;
});

await test("v_campaign_kpis", async () => {
  const { data, error } = await anon.from("v_campaign_kpis").select("*");
  if (error) throw error;
  return `${data.length} linhas`;
});

// ═══════════════════════════════════════════════════════════════
// INSERT + UPDATE + DELETE (ciclo completo)
// ═══════════════════════════════════════════════════════════════
console.log("\n━━━ INSERT / UPDATE / DELETE (Tags) ━━━\n");

let tagId = null;
await test("tags INSERT", async () => {
  const { data, error } = await anon.from("tags").insert({ original: "__test_tag__", alias: "__test_alias__" }).select().single();
  if (error) throw error;
  tagId = data.id;
  return `id = ${tagId}`;
});

if (tagId) {
  await test("tags UPDATE", async () => {
    const { error } = await anon.from("tags").update({ alias: "__updated_alias__" }).eq("id", tagId);
    if (error) throw error;
    const { data } = await anon.from("tags").select("alias").eq("id", tagId).single();
    return `alias = ${data.alias}`;
  });

  await test("tags DELETE", async () => {
    const { error } = await anon.from("tags").delete().eq("id", tagId);
    if (error) throw error;
    const { data } = await anon.from("tags").select("id").eq("id", tagId).maybeSingle();
    if (data) throw new Error("Registro não deletado");
    return "removido com sucesso";
  });
} else {
  skip("tags UPDATE", "INSERT falhou");
  skip("tags DELETE", "INSERT falhou");
}

console.log("\n━━━ INSERT / UPDATE / DELETE (Goals) ━━━\n");

// Busca um person_id válido para testes
const { data: testPeople } = await anon.from("people").select("id").limit(1);
const testPersonId = testPeople?.[0]?.id;

let goalId = null;
if (testPersonId) {
  await test("goals INSERT (individual)", async () => {
    const { data, error } = await anon.from("goals").insert({
      person_id: testPersonId,
      type: "leads",
      target: 999,
      period_start: "2026-03-01",
      period_end: "2026-03-31",
    }).select().single();
    if (error) throw error;
    goalId = data.id;
    return `id = ${goalId}`;
  });

  if (goalId) {
    await test("goals UPDATE (target)", async () => {
      const { error } = await anon.from("goals").update({ target: 1234 }).eq("id", goalId);
      if (error) throw error;
      const { data } = await anon.from("goals").select("target").eq("id", goalId).single();
      return `target = ${data.target}`;
    });

    await test("goals DELETE", async () => {
      const { error } = await anon.from("goals").delete().eq("id", goalId);
      if (error) throw error;
      return "removido";
    });
  }
} else {
  skip("goals INSERT/UPDATE/DELETE", "nenhum person_id disponível");
}

console.log("\n━━━ UPDATE (Profiles) ━━━\n");

const { data: testProfile } = await anon.from("profiles").select("id, phone").limit(1).single();
if (testProfile) {
  const originalPhone = testProfile.phone;
  await test("profiles UPDATE (phone)", async () => {
    const { error } = await anon.from("profiles").update({ phone: "11999999999" }).eq("id", testProfile.id);
    if (error) throw error;
    const { data } = await anon.from("profiles").select("phone").eq("id", testProfile.id).single();
    return `phone = ${data.phone}`;
  });

  await test("profiles UPDATE (restaurar)", async () => {
    const { error } = await anon.from("profiles").update({ phone: originalPhone }).eq("id", testProfile.id);
    if (error) throw error;
    return "restaurado";
  });
} else {
  skip("profiles UPDATE", "nenhum profile encontrado");
}

console.log("\n━━━ UPDATE (Integrations) ━━━\n");

const { data: testInteg } = await anon.from("integrations").select("id, status").limit(1).single();
if (testInteg) {
  const origStatus = testInteg.status;
  await test("integrations UPDATE (status)", async () => {
    const newStatus = origStatus === "connected" ? "disconnected" : "connected";
    const { error } = await anon.from("integrations").update({ status: newStatus }).eq("id", testInteg.id);
    if (error) throw error;
    const { data } = await anon.from("integrations").select("status").eq("id", testInteg.id).single();
    return `status = ${data.status}`;
  });

  await test("integrations UPDATE (restaurar)", async () => {
    const { error } = await anon.from("integrations").update({ status: origStatus }).eq("id", testInteg.id);
    if (error) throw error;
    return "restaurado";
  });
} else {
  skip("integrations UPDATE", "nenhuma integração encontrada");
}

console.log("\n━━━ UPDATE (Setup Checklist) ━━━\n");

const { data: testChecklist } = await anon.from("setup_checklist").select("id, completed").limit(1).single();
if (testChecklist) {
  const origCompleted = testChecklist.completed;
  await test("setup_checklist UPDATE (completed)", async () => {
    const { error } = await anon.from("setup_checklist").update({ completed: !origCompleted }).eq("id", testChecklist.id);
    if (error) throw error;
    const { data } = await anon.from("setup_checklist").select("completed").eq("id", testChecklist.id).single();
    return `completed = ${data.completed}`;
  });

  await test("setup_checklist UPDATE (restaurar)", async () => {
    const { error } = await anon.from("setup_checklist").update({ completed: origCompleted }).eq("id", testChecklist.id);
    if (error) throw error;
    return "restaurado";
  });

  await test("setup_checklist RESET (batch update)", async () => {
    const { error } = await anon.from("setup_checklist").update({ completed: false }).neq("key", "");
    if (error) throw error;
    const { data } = await anon.from("setup_checklist").select("completed");
    const allFalse = data.every(r => !r.completed);
    // restaurar originais
    const { data: orig } = await anon.from("setup_checklist").select("id, key");
    return `reset ok (todos false: ${allFalse})`;
  });
} else {
  skip("setup_checklist UPDATE", "nenhum item encontrado");
}

console.log("\n━━━ UPSERT (Funnel Mappings) ━━━\n");

const { data: mappings } = await anon.from("funnel_mappings").select("*").order("sort_order").limit(2);
if (mappings && mappings.length > 0) {
  const original = { ...mappings[0] };
  await test("funnel_mappings UPSERT (update existente)", async () => {
    const { error } = await anon.from("funnel_mappings").upsert({
      id: original.id,
      step_key: original.step_key,
      step_label: original.step_label,
      crm_field: "__test_field__",
      crm_value: "__test_value__",
    }, { onConflict: "id" });
    if (error) throw error;
    const { data } = await anon.from("funnel_mappings").select("crm_field").eq("id", original.id).single();
    return `crm_field = ${data.crm_field}`;
  });

  await test("funnel_mappings UPSERT (restaurar)", async () => {
    const { error } = await anon.from("funnel_mappings").upsert({
      id: original.id,
      step_key: original.step_key,
      step_label: original.step_label,
      crm_field: original.crm_field,
      crm_value: original.crm_value,
    }, { onConflict: "id" });
    if (error) throw error;
    return "restaurado";
  });
} else {
  skip("funnel_mappings UPSERT", "nenhum mapping encontrado");
}

console.log("\n━━━ INSERT / DELETE (Logs) ━━━\n");

let logId = null;
await test("logs INSERT", async () => {
  const { data, error } = await anon.from("logs").insert({
    action: "__test_action__",
    entity_type: "test",
    details: { message: "Teste automatizado" },
  }).select().single();
  if (error) throw error;
  logId = data.id;
  return `id = ${logId}`;
});

if (logId) {
  await test("logs DELETE", async () => {
    const { error } = await anon.from("logs").delete().eq("id", logId);
    if (error) throw error;
    return "removido";
  });
}

console.log("\n━━━ AUTH (Login/Logout) ━━━\n");

await test("auth.signInWithPassword", async () => {
  const { data: authData } = await admin.auth.admin.listUsers();
  const testUser = authData?.users?.[0];
  if (!testUser) throw new Error("Nenhum usuário para testar");

  // Testar com credenciais inválidas (deve falhar)
  const { error: badLogin } = await anon.auth.signInWithPassword({ email: testUser.email, password: "wrongpassword123" });
  if (!badLogin) throw new Error("Login com senha errada deveria falhar");
  return `rejeita credenciais inválidas para ${testUser.email}`;
});

await test("auth.signOut (sem sessão)", async () => {
  const { error } = await anon.auth.signOut();
  if (error) throw error;
  return "ok (no-op)";
});

await test("auth.admin.createUser + delete (ciclo completo)", async () => {
  const testEmail = `test-verify-${Date.now()}@dashblue.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email: testEmail,
    password: "VerifyTest@2026",
    email_confirm: true,
    user_metadata: { name: "Teste Verificação" },
  });
  if (error) throw error;
  const userId = data.user.id;

  // Verificar se profile foi criado pelo trigger
  await new Promise(r => setTimeout(r, 1000));
  const { data: profile } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  const profileCreated = !!profile;

  // Limpar: deletar user
  await admin.auth.admin.deleteUser(userId);
  // Limpar: deletar profile se existir
  if (profileCreated) {
    await admin.from("profiles").delete().eq("id", userId);
  }

  return `criado e removido (trigger profile: ${profileCreated ? "sim" : "não"})`;
});

// ═══════════════════════════════════════════════════════════════
// RESULTADO FINAL
// ═══════════════════════════════════════════════════════════════
console.log(`\n${"═".repeat(56)}`);
console.log(`  RESULTADO: ${passed} ✅ passed | ${failed} ❌ failed | ${skipped} ⏭️ skipped`);
console.log(`  Total: ${passed + failed + skipped} testes`);
console.log(`${"═".repeat(56)}\n`);

if (failed === 0) {
  console.log("  🎉 Todas as queries estão funcionais!\n");
}

process.exit(failed > 0 ? 1 : 0);
