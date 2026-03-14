import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function query(sql) {
  const { data, error } = await supabase.rpc("", {}).maybeSingle();
  return null;
}

async function run() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║     AUDITORIA DO BANCO DE DADOS — DASHBLUE      ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // 1. Listar todas as tabelas
  console.log("━━━ 1. TABELAS PÚBLICAS ━━━");
  const { data: tables, error: tErr } = await supabase
    .from("information_schema.tables" || "")
    .select("*");

  // Fallback: testar cada tabela esperada
  const expectedTables = [
    "profiles", "squads", "people", "integrations", "funnel_mappings",
    "tags", "goals", "setup_checklist", "evidence", "contracts",
    "campaigns", "call_logs", "alerts", "logs",
  ];

  const tableStatus = {};
  for (const table of expectedTables) {
    const { data, error, count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    tableStatus[table] = {
      exists: !error || !error.message.includes("does not exist"),
      count: count ?? 0,
      error: error?.message || null,
    };
  }

  const maxLen = Math.max(...expectedTables.map(t => t.length));
  for (const [table, info] of Object.entries(tableStatus)) {
    const pad = table.padEnd(maxLen);
    if (!info.exists) {
      console.log(`  ❌ ${pad}  AUSENTE`);
    } else if (info.error) {
      console.log(`  ⚠️  ${pad}  erro: ${info.error}`);
    } else {
      console.log(`  ✅ ${pad}  ${String(info.count).padStart(4)} registros`);
    }
  }

  // 2. Views
  console.log("\n━━━ 2. VIEWS ━━━");
  const expectedViews = [
    "v_funnel_summary", "v_person_metrics", "v_call_metrics",
    "v_squad_metrics", "v_financial_summary", "v_campaign_kpis",
  ];

  for (const view of expectedViews) {
    const { data, error } = await supabase.from(view).select("*").limit(1);
    const pad = view.padEnd(22);
    if (error) {
      console.log(`  ❌ ${pad}  ${error.message}`);
    } else {
      console.log(`  ✅ ${pad}  ok (${data.length > 0 ? "tem dados" : "vazia"})`);
    }
  }

  // 3. Auth users
  console.log("\n━━━ 3. AUTH USERS ━━━");
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const users = usersData?.users || [];
  console.log(`  Total: ${users.length} usuários`);
  for (const u of users) {
    const hasProfile = tableStatus.profiles.exists;
    let profileMatch = "?";
    if (hasProfile) {
      const { data: p } = await supabase.from("profiles").select("id, name, role").eq("id", u.id).maybeSingle();
      profileMatch = p ? `✅ profile: ${p.name} (${p.role})` : "❌ SEM profile";
    }
    console.log(`  ${u.id.slice(0, 8)}... ${(u.email || "").padEnd(30)} ${profileMatch}`);
  }

  // 4. Foreign Keys check
  console.log("\n━━━ 4. INTEGRIDADE REFERENCIAL (FK) ━━━");

  // people -> squads
  const { data: people } = await supabase.from("people").select("id, name, squad_id");
  if (people && people.length > 0) {
    const { data: squads } = await supabase.from("squads").select("id");
    const squadIds = new Set(squads?.map(s => s.id) || []);
    const orphanPeople = people.filter(p => p.squad_id && !squadIds.has(p.squad_id));
    if (orphanPeople.length > 0) {
      console.log(`  ⚠️  people -> squads: ${orphanPeople.length} referência(s) órfã(s)`);
      orphanPeople.forEach(p => console.log(`     ${p.name}: squad_id=${p.squad_id}`));
    } else {
      console.log("  ✅ people -> squads: OK");
    }
  } else {
    console.log("  ⏭️  people -> squads: tabela vazia");
  }

  // evidence -> people (sdr_id, closer_id)
  const { data: ev } = await supabase.from("evidence").select("id, sdr_id, closer_id").limit(100);
  if (ev && ev.length > 0) {
    const { data: allPeople } = await supabase.from("people").select("id");
    const peopleIds = new Set(allPeople?.map(p => p.id) || []);
    const orphanSdr = ev.filter(e => e.sdr_id && !peopleIds.has(e.sdr_id));
    const orphanCloser = ev.filter(e => e.closer_id && !peopleIds.has(e.closer_id));
    console.log(`  ${orphanSdr.length === 0 ? "✅" : "⚠️ "} evidence -> people (sdr_id): ${orphanSdr.length} órfão(s)`);
    console.log(`  ${orphanCloser.length === 0 ? "✅" : "⚠️ "} evidence -> people (closer_id): ${orphanCloser.length} órfão(s)`);
  } else {
    console.log("  ⏭️  evidence -> people: tabela vazia");
  }

  // contracts -> squads, people, evidence
  const { data: contracts } = await supabase.from("contracts").select("id, sdr_id, closer_id, squad_id, evidence_id").limit(100);
  if (contracts && contracts.length > 0) {
    const { data: allPeople } = await supabase.from("people").select("id");
    const { data: allSquads } = await supabase.from("squads").select("id");
    const { data: allEvidence } = await supabase.from("evidence").select("id");
    const pIds = new Set(allPeople?.map(p => p.id) || []);
    const sIds = new Set(allSquads?.map(s => s.id) || []);
    const eIds = new Set(allEvidence?.map(e => e.id) || []);

    const issues = [];
    contracts.forEach(c => {
      if (c.sdr_id && !pIds.has(c.sdr_id)) issues.push(`sdr_id=${c.sdr_id}`);
      if (c.closer_id && !pIds.has(c.closer_id)) issues.push(`closer_id=${c.closer_id}`);
      if (c.squad_id && !sIds.has(c.squad_id)) issues.push(`squad_id=${c.squad_id}`);
      if (c.evidence_id && !eIds.has(c.evidence_id)) issues.push(`evidence_id=${c.evidence_id}`);
    });
    console.log(`  ${issues.length === 0 ? "✅" : "⚠️ "} contracts -> refs: ${issues.length} problema(s)`);
  } else {
    console.log("  ⏭️  contracts: tabela vazia");
  }

  // goals -> people
  const { data: goals } = await supabase.from("goals").select("id, person_id, type");
  if (goals && goals.length > 0) {
    const { data: allPeople } = await supabase.from("people").select("id");
    const pIds = new Set(allPeople?.map(p => p.id) || []);
    const orphanGoals = goals.filter(g => g.person_id && !pIds.has(g.person_id));
    console.log(`  ${orphanGoals.length === 0 ? "✅" : "⚠️ "} goals -> people: ${orphanGoals.length} órfão(s)`);
  } else {
    console.log("  ⏭️  goals -> people: tabela vazia");
  }

  // call_logs -> people, evidence
  const { data: calls } = await supabase.from("call_logs").select("id, person_id, evidence_id").limit(100);
  if (calls && calls.length > 0) {
    const { data: allPeople } = await supabase.from("people").select("id");
    const pIds = new Set(allPeople?.map(p => p.id) || []);
    const orphan = calls.filter(c => c.person_id && !pIds.has(c.person_id));
    console.log(`  ${orphan.length === 0 ? "✅" : "⚠️ "} call_logs -> people: ${orphan.length} órfão(s)`);
  } else {
    console.log("  ⏭️  call_logs: tabela vazia");
  }

  // logs -> profiles (user_id)
  const { data: logs } = await supabase.from("logs").select("id, user_id").limit(50);
  if (logs && logs.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id");
    const pIds = new Set(profs?.map(p => p.id) || []);
    const orphanLogs = logs.filter(l => l.user_id && !pIds.has(l.user_id));
    console.log(`  ${orphanLogs.length === 0 ? "✅" : "⚠️ "} logs -> profiles: ${orphanLogs.length} órfão(s)`);
  } else {
    console.log("  ⏭️  logs: tabela vazia");
  }

  // 5. RLS policies
  console.log("\n━━━ 5. RLS (Row Level Security) ━━━");
  for (const table of expectedTables) {
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
    const { data, error } = await anonClient.from(table).select("*", { count: "exact", head: true });
    const pad = table.padEnd(maxLen);
    if (error) {
      console.log(`  🔒 ${pad}  bloqueado para anon: ${error.message}`);
    } else {
      console.log(`  🔓 ${pad}  acessível para anon`);
    }
  }

  // 6. Tipagem database.ts vs realidade
  console.log("\n━━━ 6. SCHEMA: database.ts vs BANCO REAL ━━━");
  const dbTsTables = [
    "profiles", "squads", "people", "integrations", "funnel_mappings",
    "tags", "goals", "setup_checklist", "evidence", "contracts",
    "campaigns", "call_logs", "alerts", "logs",
  ];
  const dbTsViews = [
    "v_funnel_summary", "v_person_metrics", "v_call_metrics",
    "v_squad_metrics", "v_financial_summary", "v_campaign_kpis",
  ];

  let missingTables = [];
  let missingViews = [];
  for (const t of dbTsTables) {
    if (!tableStatus[t]?.exists) missingTables.push(t);
  }
  for (const v of dbTsViews) {
    const { error } = await supabase.from(v).select("*").limit(0);
    if (error) missingViews.push(v);
  }

  if (missingTables.length === 0 && missingViews.length === 0) {
    console.log("  ✅ Todas as tabelas e views do database.ts existem no banco");
  } else {
    if (missingTables.length > 0) console.log(`  ❌ Tabelas ausentes: ${missingTables.join(", ")}`);
    if (missingViews.length > 0) console.log(`  ❌ Views ausentes: ${missingViews.join(", ")}`);
  }

  // 7. Goal.type mismatch
  console.log("\n━━━ 7. CHECAGEM DE TIPOS (types/index.ts vs database.ts) ━━━");
  console.log("  Goal.type:");
  console.log("    database.ts → 'revenue' | 'booked' | 'leads' | 'received' | 'won'");
  console.log("    index.ts    → 'revenue' | 'booked'  ⚠️  INCOMPLETO");
  console.log("  Integration.status:");
  console.log("    database.ts → 'connected' | 'syncing' | 'error' | 'disconnected'");
  console.log("    index.ts    → 'connected' | 'disconnected' | 'error'  ⚠️  FALTA 'syncing'");

  // 8. Resumo
  console.log("\n━━━ 8. RESUMO ━━━");
  const emptyTables = Object.entries(tableStatus).filter(([, v]) => v.exists && v.count === 0);
  const populatedTables = Object.entries(tableStatus).filter(([, v]) => v.exists && v.count > 0);

  console.log(`  Tabelas com dados:  ${populatedTables.length}/${expectedTables.length}`);
  console.log(`  Tabelas vazias:     ${emptyTables.length} → ${emptyTables.map(([t]) => t).join(", ") || "nenhuma"}`);
  console.log(`  Auth users:         ${users.length}`);

  const profiledUsers = [];
  for (const u of users) {
    const { data: p } = await supabase.from("profiles").select("id").eq("id", u.id).maybeSingle();
    if (p) profiledUsers.push(u.id);
  }
  console.log(`  Users com profile:  ${profiledUsers.length}/${users.length}`);
  console.log("");
}

run().catch(console.error);
