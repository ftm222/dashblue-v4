const { Client } = require("pg");

const connectionString =
  "postgresql://postgres:V9%23qL2%40zT7%21mR4%24xN8@db.dxmxzuxpdxowuuollhtc.supabase.co:5432/postgres";

async function run() {
  const c = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await c.connect();
  console.log("Connected to database\n");

  async function exec(label, sql) {
    try {
      await c.query(sql);
      console.log("[OK]", label);
      return true;
    } catch (e) {
      console.log("[SKIP]", label, "-", e.message.substring(0, 100));
      return false;
    }
  }

  // =========================================================================
  // STEP 1: CREATE NEW TABLES
  // =========================================================================
  console.log("--- STEP 1: Create new tables ---");

  await exec("organizations", `
    CREATE TABLE IF NOT EXISTS public.organizations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      slug text NOT NULL UNIQUE,
      logo_url text,
      plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','starter','pro','enterprise')),
      stripe_customer_id text UNIQUE,
      stripe_subscription_id text UNIQUE,
      subscription_status text NOT NULL DEFAULT 'trialing'
        CHECK (subscription_status IN ('trialing','active','past_due','canceled','unpaid')),
      trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
      max_members int NOT NULL DEFAULT 5,
      max_integrations int NOT NULL DEFAULT 1,
      settings jsonb NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await exec("plans", `
    CREATE TABLE IF NOT EXISTS public.plans (
      id text PRIMARY KEY,
      name text NOT NULL,
      description text,
      price_monthly numeric NOT NULL DEFAULT 0,
      price_yearly numeric NOT NULL DEFAULT 0,
      stripe_price_monthly_id text,
      stripe_price_yearly_id text,
      max_members int NOT NULL DEFAULT 5,
      max_integrations int NOT NULL DEFAULT 1,
      features jsonb NOT NULL DEFAULT '[]',
      active boolean NOT NULL DEFAULT true,
      sort_order int NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await exec("invoices", `
    CREATE TABLE IF NOT EXISTS public.invoices (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      stripe_invoice_id text UNIQUE,
      amount numeric NOT NULL,
      currency text NOT NULL DEFAULT 'brl',
      status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','open','paid','void','uncollectible')),
      invoice_url text,
      period_start timestamptz,
      period_end timestamptz,
      paid_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await exec("org_members", `
    CREATE TABLE IF NOT EXISTS public.org_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role text NOT NULL DEFAULT 'viewer'
        CHECK (role IN ('owner','admin','manager','viewer')),
      invited_at timestamptz NOT NULL DEFAULT now(),
      accepted_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(organization_id, user_id)
    )
  `);

  await exec("idx_organizations_slug", "CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug)");
  await exec("idx_organizations_stripe", "CREATE INDEX IF NOT EXISTS idx_organizations_stripe ON public.organizations(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL");
  await exec("idx_invoices_org", "CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices(organization_id)");
  await exec("idx_org_members_org", "CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.org_members(organization_id)");
  await exec("idx_org_members_user", "CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.org_members(user_id)");

  // =========================================================================
  // STEP 2: ADD organization_id TO EXISTING TABLES
  // =========================================================================
  console.log("\n--- STEP 2: Add organization_id columns ---");

  await exec("profiles.organization_id",
    "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL");

  const cascadeTables = [
    "squads", "people", "integrations", "funnel_mappings", "tags",
    "goals", "setup_checklist", "evidence", "contracts", "campaigns",
    "call_logs", "alerts", "logs",
  ];
  for (const t of cascadeTables) {
    await exec(`${t}.organization_id`,
      `ALTER TABLE public.${t} ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE`);
  }

  // =========================================================================
  // STEP 3: UPDATE ROLE CONSTRAINT
  // =========================================================================
  console.log("\n--- STEP 3: Update role constraint ---");

  await exec("drop old role check", "ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check");
  await exec("add new role check",
    `ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('owner','admin','manager','viewer'))`);

  // =========================================================================
  // STEP 4: CREATE INDEXES
  // =========================================================================
  console.log("\n--- STEP 4: Create indexes ---");

  for (const t of ["profiles", "squads", "people", "integrations", "evidence", "contracts", "campaigns", "goals", "call_logs"]) {
    await exec(`idx_${t}_org`,
      `CREATE INDEX IF NOT EXISTS idx_${t}_org ON public.${t}(organization_id) WHERE organization_id IS NOT NULL`);
  }

  // =========================================================================
  // STEP 5: HELPER FUNCTIONS
  // =========================================================================
  console.log("\n--- STEP 5: Helper functions ---");

  await exec("get_user_org_id", `
    CREATE OR REPLACE FUNCTION public.get_user_org_id()
    RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $fn$ SELECT organization_id FROM public.profiles WHERE id = auth.uid() $fn$
  `);
  await exec("get_user_role", `
    CREATE OR REPLACE FUNCTION public.get_user_role()
    RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $fn$ SELECT role FROM public.profiles WHERE id = auth.uid() $fn$
  `);
  await exec("can_write", `
    CREATE OR REPLACE FUNCTION public.can_write()
    RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $fn$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner','admin','manager')) $fn$
  `);
  await exec("is_org_admin", `
    CREATE OR REPLACE FUNCTION public.is_org_admin()
    RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $fn$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner','admin')) $fn$
  `);

  // =========================================================================
  // STEP 6: RLS POLICIES
  // =========================================================================
  console.log("\n--- STEP 6: RLS policies ---");

  // Drop old policies first
  const allDataTables = [...cascadeTables, "profiles"];
  for (const t of allDataTables) {
    await exec(`drop Authenticated read ${t}`, `DROP POLICY IF EXISTS "Authenticated read" ON public.${t}`);
    await exec(`drop Admin write ${t}`, `DROP POLICY IF EXISTS "Admin write" ON public.${t}`);
  }
  await exec("drop Own profile update", `DROP POLICY IF EXISTS "Own profile update" ON public.profiles`);

  // Profiles - special policies
  await exec("profiles: tenant read", `
    CREATE POLICY "Tenant read profiles" ON public.profiles FOR SELECT TO authenticated
    USING (organization_id = public.get_user_org_id() OR id = auth.uid())
  `);
  await exec("profiles: admin update", `
    CREATE POLICY "Admin write profiles" ON public.profiles FOR UPDATE TO authenticated
    USING ((id = auth.uid()) OR (organization_id = public.get_user_org_id() AND public.is_org_admin()))
    WITH CHECK ((id = auth.uid()) OR (organization_id = public.get_user_org_id() AND public.is_org_admin()))
  `);
  await exec("profiles: admin insert", `
    CREATE POLICY "Admin insert profiles" ON public.profiles FOR INSERT TO authenticated
    WITH CHECK (organization_id = public.get_user_org_id() AND public.is_org_admin())
  `);

  // Data tables - standard tenant isolation
  for (const t of cascadeTables) {
    await exec(`${t}: read`, `CREATE POLICY "Tenant read ${t}" ON public.${t} FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id())`);
    await exec(`${t}: insert`, `CREATE POLICY "Tenant write ${t}" ON public.${t} FOR INSERT TO authenticated WITH CHECK (organization_id = public.get_user_org_id() AND public.can_write())`);
    await exec(`${t}: update`, `CREATE POLICY "Tenant update ${t}" ON public.${t} FOR UPDATE TO authenticated USING (organization_id = public.get_user_org_id() AND public.can_write()) WITH CHECK (organization_id = public.get_user_org_id() AND public.can_write())`);
    await exec(`${t}: delete`, `CREATE POLICY "Tenant delete ${t}" ON public.${t} FOR DELETE TO authenticated USING (organization_id = public.get_user_org_id() AND public.is_org_admin())`);
  }

  // New tables RLS
  await exec("orgs: enable RLS", "ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY");
  await exec("org_members: enable RLS", "ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY");
  await exec("plans: enable RLS", "ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY");
  await exec("invoices: enable RLS", "ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY");

  await exec("orgs: read", `CREATE POLICY "Read own org" ON public.organizations FOR SELECT TO authenticated USING (id = public.get_user_org_id())`);
  await exec("orgs: update", `CREATE POLICY "Owner update org" ON public.organizations FOR UPDATE TO authenticated USING (id = public.get_user_org_id() AND public.get_user_role() = 'owner') WITH CHECK (id = public.get_user_org_id())`);
  await exec("orgs: service insert", `CREATE POLICY "Service insert org" ON public.organizations FOR INSERT TO service_role WITH CHECK (true)`);
  await exec("members: read", `CREATE POLICY "Read org members" ON public.org_members FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id())`);
  await exec("members: manage", `CREATE POLICY "Admin manage members" ON public.org_members FOR ALL TO authenticated USING (organization_id = public.get_user_org_id() AND public.is_org_admin()) WITH CHECK (organization_id = public.get_user_org_id() AND public.is_org_admin())`);
  await exec("plans: public read", `CREATE POLICY "Public read plans" ON public.plans FOR SELECT USING (true)`);
  await exec("invoices: read", `CREATE POLICY "Read own invoices" ON public.invoices FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id())`);

  // =========================================================================
  // STEP 7: TRIGGER handle_new_user
  // =========================================================================
  console.log("\n--- STEP 7: Update trigger ---");

  await exec("handle_new_user", `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $fn$
    BEGIN
      INSERT INTO public.profiles (id, name, email, role, organization_id)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
        (NEW.raw_user_meta_data->>'organization_id')::uuid
      );
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql SECURITY DEFINER
  `);
  await exec("drop old trigger", "DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users");
  await exec("create trigger", "CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()");

  // =========================================================================
  // STEP 8: SEED PLANS
  // =========================================================================
  console.log("\n--- STEP 8: Seed plans ---");

  await exec("seed plans", `
    INSERT INTO public.plans (id, name, description, price_monthly, price_yearly, max_members, max_integrations, features, sort_order) VALUES
      ('free',       'Free',       'Para experimentar',         0,    0,    3,   25,  '["Dashboard básico", "Várias conexões (CRM/Ads)", "3 membros"]'::jsonb, 0),
      ('starter',    'Starter',    'Para times pequenos',       197,  1970, 10,  25,  '["Tudo do Free", "10 membros", "25 integrações", "Modo TV"]'::jsonb, 1),
      ('pro',        'Pro',        'Para operações completas',  497,  4970, 50,  100, '["Tudo do Starter", "50 membros", "100 integrações", "AI"]'::jsonb, 2),
      ('enterprise', 'Enterprise', 'Para grandes operações',    0,    0,    999, 999, '["Tudo do Pro", "Ilimitado", "SLA dedicado"]'::jsonb, 3)
    ON CONFLICT (id) DO NOTHING
  `);

  // =========================================================================
  // STEP 9: UPDATED_AT TRIGGER FOR ORGS
  // =========================================================================
  console.log("\n--- STEP 9: Triggers ---");

  await exec("orgs updated_at", `
    CREATE OR REPLACE TRIGGER set_updated_at BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()
  `);

  await c.end();
  console.log("\n=== MIGRATION COMPLETE ===");
}

run().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
