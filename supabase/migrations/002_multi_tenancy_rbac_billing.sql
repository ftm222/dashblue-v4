-- ============================================================================
-- DASHBLUE v4 — Migration 002: Multi-tenancy, RBAC & Billing
-- ============================================================================
-- Executar APÓS a 001_initial_schema.sql
-- ============================================================================

-- ============================================================================
-- 1. NOVAS TABELAS: Organizations, Plans, Invoices, Org Members
-- ============================================================================

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  plan text not null default 'free'
    check (plan in ('free', 'starter', 'pro', 'enterprise')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  max_members int not null default 5,
  max_integrations int not null default 1,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id text primary key,
  name text not null,
  description text,
  price_monthly numeric not null default 0,
  price_yearly numeric not null default 0,
  stripe_price_monthly_id text,
  stripe_price_yearly_id text,
  max_members int not null default 5,
  max_integrations int not null default 1,
  features jsonb not null default '[]',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stripe_invoice_id text unique,
  amount numeric not null,
  currency text not null default 'brl',
  status text not null default 'draft'
    check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  invoice_url text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer'
    check (role in ('owner', 'admin', 'manager', 'viewer')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(organization_id, user_id)
);

-- Indexes
create index if not exists idx_organizations_slug on public.organizations(slug);
create index if not exists idx_organizations_stripe on public.organizations(stripe_customer_id)
  where stripe_customer_id is not null;
create index if not exists idx_invoices_org on public.invoices(organization_id);
create index if not exists idx_org_members_org on public.org_members(organization_id);
create index if not exists idx_org_members_user on public.org_members(user_id);

-- ============================================================================
-- 2. EXPAND ROLES + ADD org_id em TODAS as tabelas existentes
-- ============================================================================

alter table public.profiles add column if not exists organization_id uuid
  references public.organizations(id) on delete set null;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('owner', 'admin', 'manager', 'viewer'));

alter table public.squads           add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.people           add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.integrations     add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.funnel_mappings  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.tags             add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.goals            add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.setup_checklist  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.evidence         add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.contracts        add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.campaigns        add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.call_logs        add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.alerts           add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.logs             add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

-- Indexes para filtragem por org
create index if not exists idx_profiles_org    on public.profiles(organization_id)    where organization_id is not null;
create index if not exists idx_squads_org      on public.squads(organization_id)      where organization_id is not null;
create index if not exists idx_people_org      on public.people(organization_id)      where organization_id is not null;
create index if not exists idx_integrations_org on public.integrations(organization_id) where organization_id is not null;
create index if not exists idx_evidence_org    on public.evidence(organization_id)    where organization_id is not null;
create index if not exists idx_contracts_org   on public.contracts(organization_id)   where organization_id is not null;
create index if not exists idx_campaigns_org   on public.campaigns(organization_id)   where organization_id is not null;
create index if not exists idx_goals_org       on public.goals(organization_id)       where organization_id is not null;
create index if not exists idx_call_logs_org   on public.call_logs(organization_id)   where organization_id is not null;

-- ============================================================================
-- 3. HELPER FUNCTIONS para RLS
-- ============================================================================

create or replace function public.get_user_org_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.get_user_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.can_write()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('owner', 'admin', 'manager')
  )
$$;

create or replace function public.is_org_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('owner', 'admin')
  )
$$;

-- ============================================================================
-- 4. DROP OLD RLS POLICIES + CRIAR NOVAS com tenant isolation
-- ============================================================================

-- Remove as policies antigas (da migration 001)
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'profiles','squads','people','integrations','funnel_mappings',
      'tags','goals','setup_checklist','evidence','contracts',
      'campaigns','call_logs','alerts','logs'
    ])
  loop
    execute format('drop policy if exists "Authenticated read" on public.%I', tbl);
    execute format('drop policy if exists "Admin write" on public.%I', tbl);
  end loop;
end $$;

drop policy if exists "Own profile update" on public.profiles;

-- ── PROFILES ────────────────────────────────────────────────────────────────
create policy "Tenant read profiles" on public.profiles
  for select to authenticated
  using (organization_id = public.get_user_org_id() or id = auth.uid());

create policy "Admin write profiles" on public.profiles
  for update to authenticated
  using (
    (id = auth.uid()) -- pode editar o próprio
    or (organization_id = public.get_user_org_id() and public.is_org_admin())
  )
  with check (
    (id = auth.uid())
    or (organization_id = public.get_user_org_id() and public.is_org_admin())
  );

create policy "Admin insert profiles" on public.profiles
  for insert to authenticated
  with check (organization_id = public.get_user_org_id() and public.is_org_admin());

-- ── TABELAS DE DADOS (mesmo padrão para todas) ─────────────────────────────

-- Macro: para cada tabela de dados, leitura por tenant + escrita por writer
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'squads','people','integrations','funnel_mappings','tags',
      'goals','setup_checklist','evidence','contracts','campaigns',
      'call_logs','alerts','logs'
    ])
  loop
    execute format(
      'create policy "Tenant read %1$s" on public.%1$I for select to authenticated using (organization_id = public.get_user_org_id())',
      tbl
    );
    execute format(
      'create policy "Tenant write %1$s" on public.%1$I for insert to authenticated with check (organization_id = public.get_user_org_id() and public.can_write())',
      tbl
    );
    execute format(
      'create policy "Tenant update %1$s" on public.%1$I for update to authenticated using (organization_id = public.get_user_org_id() and public.can_write()) with check (organization_id = public.get_user_org_id() and public.can_write())',
      tbl
    );
    execute format(
      'create policy "Tenant delete %1$s" on public.%1$I for delete to authenticated using (organization_id = public.get_user_org_id() and public.is_org_admin())',
      tbl
    );
  end loop;
end $$;

-- ── NOVAS TABELAS ───────────────────────────────────────────────────────────

alter table public.organizations enable row level security;
alter table public.org_members   enable row level security;
alter table public.plans         enable row level security;
alter table public.invoices      enable row level security;

create policy "Read own org" on public.organizations
  for select to authenticated
  using (id = public.get_user_org_id());

create policy "Owner update org" on public.organizations
  for update to authenticated
  using (id = public.get_user_org_id() and public.get_user_role() = 'owner')
  with check (id = public.get_user_org_id());

-- Service role pode inserir orgs (no registro)
create policy "Service insert org" on public.organizations
  for insert to service_role
  with check (true);

create policy "Read org members" on public.org_members
  for select to authenticated
  using (organization_id = public.get_user_org_id());

create policy "Admin manage members" on public.org_members
  for all to authenticated
  using (organization_id = public.get_user_org_id() and public.is_org_admin())
  with check (organization_id = public.get_user_org_id() and public.is_org_admin());

create policy "Public read plans" on public.plans
  for select using (true);

create policy "Read own invoices" on public.invoices
  for select to authenticated
  using (organization_id = public.get_user_org_id());

-- ============================================================================
-- 5. TRIGGER updated_at para organizations
-- ============================================================================

create trigger set_updated_at before update on public.organizations
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- 6. ATUALIZAR trigger de novo usuário para aceitar role e org
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, organization_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'viewer'),
    (new.raw_user_meta_data->>'organization_id')::uuid
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recriar o trigger (idempotente com OR REPLACE na function)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 7. SEED: Planos padrão
-- ============================================================================

insert into public.plans (id, name, description, price_monthly, price_yearly, max_members, max_integrations, features, sort_order) values
  ('free',       'Free',       'Para experimentar',         0,    0,    3,   1,   '["Dashboard básico", "1 integração CRM", "3 membros"]'::jsonb,                                           0),
  ('starter',    'Starter',    'Para times pequenos',       197,  1970, 10,  3,   '["Tudo do Free", "10 membros", "3 integrações", "Modo TV", "Exportação CSV"]'::jsonb,                    1),
  ('pro',        'Pro',        'Para operações completas',  497,  4970, 50,  10,  '["Tudo do Starter", "50 membros", "10 integrações", "Diagnóstico AI", "API completa"]'::jsonb,           2),
  ('enterprise', 'Enterprise', 'Para grandes operações',    0,    0,    999, 999, '["Tudo do Pro", "Membros ilimitados", "Integrações ilimitadas", "SLA dedicado", "Onboarding"]'::jsonb,   3)
on conflict (id) do nothing;
