-- ============================================================================
-- DASHBLUE v4 — Database Migration
-- ============================================================================
-- Execute este SQL no SQL Editor do Supabase (supabase.com → SQL Editor)
-- ============================================================================

-- ============================================================================
-- CAMADA 1: TABELAS DE CONFIGURAÇÃO
-- ============================================================================

-- Profiles (estende Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Squads
create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- People (SDRs e Closers)
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_url text,
  role text not null check (role in ('sdr', 'closer')),
  squad_id uuid references public.squads(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Integrações (CRM e Ads)
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('crm', 'ads')),
  status text not null default 'disconnected'
    check (status in ('connected', 'syncing', 'error', 'disconnected')),
  last_sync timestamptz,
  config jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mapeamento de Funil (CRM → funil interno)
create table if not exists public.funnel_mappings (
  id uuid primary key default gen_random_uuid(),
  step_key text not null unique,
  step_label text not null,
  crm_field text,
  crm_value text,
  sort_order int not null default 0
);

-- Tags e Aliases
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  original text not null unique,
  alias text not null,
  created_at timestamptz not null default now()
);

-- Metas (globais e individuais)
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references public.people(id) on delete cascade,
  type text not null check (type in ('revenue', 'booked', 'leads', 'received', 'won')),
  target numeric not null,
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(person_id, type, period_start, period_end)
);

-- Setup Checklist
create table if not exists public.setup_checklist (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  completed boolean not null default false,
  route text not null
);

-- ============================================================================
-- CAMADA 2: TABELAS TRANSACIONAIS
-- ============================================================================

-- Evidence (leads/contatos no funil — TABELA CENTRAL)
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  phone text,
  email text,
  crm_url text,
  crm_lead_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  funnel_step text not null,
  sdr_id uuid references public.people(id) on delete set null,
  closer_id uuid references public.people(id) on delete set null,
  value numeric default 0,
  tags text[] default '{}',
  badges text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contracts (financeiro)
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid references public.evidence(id) on delete set null,
  client_name text not null,
  sdr_id uuid references public.people(id) on delete set null,
  closer_id uuid references public.people(id) on delete set null,
  squad_id uuid references public.squads(id) on delete set null,
  value numeric not null default 0,
  status text not null default 'unsigned'
    check (status in ('signed_paid', 'signed_unpaid', 'unsigned')),
  signed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Campaigns (dados sincronizados de plataformas de ads)
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid references public.integrations(id) on delete set null,
  external_id text,
  name text not null,
  source text,
  medium text,
  investment numeric not null default 0,
  impressions int not null default 0,
  clicks int not null default 0,
  leads int not null default 0,
  booked int not null default 0,
  received int not null default 0,
  won int not null default 0,
  revenue numeric not null default 0,
  period_start date not null,
  period_end date not null,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Call Logs (registro individual de ligações)
create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references public.people(id) on delete set null,
  evidence_id uuid references public.evidence(id) on delete set null,
  call_type text check (call_type in ('r1', 'r2', 'follow_up')),
  answered boolean not null default false,
  duration_seconds int default 0,
  called_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- CAMADA SUPORTE: ALERTAS E LOGS
-- ============================================================================

-- Alertas
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('warning', 'critical', 'info')),
  message text not null,
  link text,
  dismissible boolean not null default true,
  dismissed_by uuid[] default '{}',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Logs de auditoria
create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Evidence
create index if not exists idx_evidence_funnel_step on public.evidence(funnel_step);
create index if not exists idx_evidence_created_at on public.evidence(created_at desc);
create index if not exists idx_evidence_sdr on public.evidence(sdr_id) where sdr_id is not null;
create index if not exists idx_evidence_closer on public.evidence(closer_id) where closer_id is not null;
create index if not exists idx_evidence_crm_lead on public.evidence(crm_lead_id) where crm_lead_id is not null;
create index if not exists idx_evidence_utm on public.evidence(utm_source, utm_campaign);

-- Contracts
create index if not exists idx_contracts_status on public.contracts(status);
create index if not exists idx_contracts_squad on public.contracts(squad_id);
create index if not exists idx_contracts_created on public.contracts(created_at desc);
create index if not exists idx_contracts_sdr on public.contracts(sdr_id) where sdr_id is not null;
create index if not exists idx_contracts_closer on public.contracts(closer_id) where closer_id is not null;

-- Call logs
create index if not exists idx_call_logs_person on public.call_logs(person_id);
create index if not exists idx_call_logs_called_at on public.call_logs(called_at desc);

-- Campaigns
create index if not exists idx_campaigns_period on public.campaigns(period_start, period_end);
create index if not exists idx_campaigns_source on public.campaigns(source);

-- Goals
create index if not exists idx_goals_period on public.goals(period_start, period_end);
create index if not exists idx_goals_person on public.goals(person_id) where person_id is not null;

-- People
create index if not exists idx_people_role on public.people(role);
create index if not exists idx_people_squad on public.people(squad_id) where squad_id is not null;

-- Logs
create index if not exists idx_logs_created on public.logs(created_at desc);
create index if not exists idx_logs_entity on public.logs(entity_type, entity_id);

-- Alerts
create index if not exists idx_alerts_created on public.alerts(created_at desc);

-- ============================================================================
-- VIEWS COMPUTADAS (CAMADA 3)
-- ============================================================================

-- View: Funil por período
create or replace view public.v_funnel_summary as
with step_counts as (
  select
    e.funnel_step,
    fm.step_label,
    fm.sort_order,
    count(*) as total,
    date_trunc('month', e.created_at)::date as period_month
  from public.evidence e
  left join public.funnel_mappings fm on fm.step_key = e.funnel_step
  group by e.funnel_step, fm.step_label, fm.sort_order, date_trunc('month', e.created_at)
),
with_top as (
  select
    sc.*,
    first_value(sc.total) over (
      partition by sc.period_month
      order by sc.sort_order
    ) as top_count,
    lag(sc.total) over (
      partition by sc.period_month
      order by sc.sort_order
    ) as prev_count
  from step_counts sc
)
select
  funnel_step,
  coalesce(step_label, funnel_step) as step_label,
  sort_order,
  total as count,
  case when prev_count > 0
    then round((total::numeric / prev_count) * 100, 1)
    else null end as conversion_from_previous,
  case when top_count > 0
    then round((total::numeric / top_count) * 100, 1)
    else null end as conversion_from_top,
  period_month
from with_top
order by sort_order;

-- View: Métricas por pessoa (SDR/Closer)
create or replace view public.v_person_metrics as
select
  p.id as person_id,
  p.name,
  p.role,
  p.squad_id,
  s.name as squad_name,
  p.avatar_url,
  count(e.id) filter (where e.funnel_step = 'leads') as leads,
  count(e.id) filter (where e.funnel_step = 'booked') as booked,
  count(e.id) filter (where e.funnel_step = 'received') as received,
  count(e.id) filter (where e.funnel_step = 'negotiation') as negotiation,
  count(e.id) filter (where e.funnel_step = 'won') as won,
  coalesce(sum(e.value) filter (where e.funnel_step = 'won'), 0) as revenue,
  case when count(e.id) filter (where e.funnel_step = 'booked') > 0
    then round(
      count(e.id) filter (where e.funnel_step = 'received')::numeric
      / count(e.id) filter (where e.funnel_step = 'booked') * 100, 1)
    else 0 end as show_rate,
  case when count(e.id) filter (where e.funnel_step = 'leads') > 0
    then round(
      count(e.id) filter (where e.funnel_step = 'won')::numeric
      / count(e.id) filter (where e.funnel_step = 'leads') * 100, 1)
    else 0 end as conversion_rate,
  case when count(e.id) filter (where e.funnel_step = 'won') > 0
    then round(
      coalesce(sum(e.value) filter (where e.funnel_step = 'won'), 0)
      / count(e.id) filter (where e.funnel_step = 'won'), 2)
    else 0 end as ticket_medio,
  date_trunc('month', e.created_at)::date as period_month
from public.people p
left join public.squads s on s.id = p.squad_id
left join public.evidence e on (
  (p.role = 'sdr' and e.sdr_id = p.id)
  or (p.role = 'closer' and e.closer_id = p.id)
)
where p.active = true
group by p.id, p.name, p.role, p.squad_id, s.name, p.avatar_url,
         date_trunc('month', e.created_at);

-- View: Métricas de chamadas por pessoa
create or replace view public.v_call_metrics as
select
  cl.person_id,
  p.name as person_name,
  p.role as person_role,
  count(*) as total_calls,
  count(*) filter (where cl.answered) as answered_calls,
  count(*) filter (where not cl.answered) as missed_calls,
  round(avg(cl.duration_seconds) filter (where cl.answered) / 60.0, 1) as avg_duration_minutes,
  count(*) filter (where cl.call_type = 'r1') as r1_calls,
  count(*) filter (where cl.call_type = 'r2') as r2_calls,
  count(*) filter (where cl.call_type = 'follow_up') as follow_ups,
  date_trunc('month', cl.called_at)::date as period_month
from public.call_logs cl
join public.people p on p.id = cl.person_id
group by cl.person_id, p.name, p.role, date_trunc('month', cl.called_at);

-- View: Métricas por squad
create or replace view public.v_squad_metrics as
select
  s.id as squad_id,
  s.name as squad_name,
  coalesce(sum(pm.revenue), 0) as revenue,
  coalesce(sum(pm.won), 0) as contracts,
  count(distinct pm.person_id) as member_count,
  coalesce(sum(pm.leads), 0) as leads,
  coalesce(sum(pm.booked), 0) as booked,
  coalesce(sum(pm.received), 0) as received,
  case when sum(pm.booked) > 0
    then round(sum(pm.received)::numeric / sum(pm.booked) * 100, 1)
    else 0 end as show_rate,
  case when sum(pm.received) > 0
    then round(sum(pm.won)::numeric / sum(pm.received) * 100, 1)
    else 0 end as conversion_rate,
  case when sum(pm.won) > 0
    then round(sum(pm.revenue) / sum(pm.won), 2)
    else 0 end as ticket_medio,
  pm.period_month
from public.squads s
left join public.v_person_metrics pm on pm.squad_id = s.id
group by s.id, s.name, pm.period_month;

-- View: Resumo financeiro
create or replace view public.v_financial_summary as
select
  count(*) as total_contracts,
  coalesce(sum(value), 0) as total_revenue,
  count(*) filter (where status in ('signed_paid', 'signed_unpaid')) as signed_contracts,
  coalesce(sum(value) filter (where status in ('signed_paid', 'signed_unpaid')), 0) as signed_revenue,
  count(*) filter (where status = 'signed_paid') as paid_contracts,
  coalesce(sum(value) filter (where status = 'signed_paid'), 0) as paid_revenue,
  count(*) filter (where status = 'unsigned') as unsigned_contracts,
  coalesce(sum(value) filter (where status = 'unsigned'), 0) as signature_gap,
  count(*) filter (where status = 'signed_unpaid') as unpaid_contracts,
  coalesce(sum(value) filter (where status = 'signed_unpaid'), 0) as payment_gap,
  coalesce(sum(value) filter (where status = 'unsigned'), 0)
    + coalesce(sum(value) filter (where status = 'signed_unpaid'), 0) as total_gap,
  date_trunc('month', created_at)::date as period_month
from public.contracts
group by date_trunc('month', created_at);

-- View: KPIs de campanhas (marketing)
create or replace view public.v_campaign_kpis as
select
  coalesce(sum(investment), 0) as total_investment,
  coalesce(sum(leads), 0) as total_leads,
  coalesce(sum(booked), 0) as total_booked,
  coalesce(sum(received), 0) as total_received,
  coalesce(sum(won), 0) as total_won,
  coalesce(sum(revenue), 0) as total_revenue,
  case when sum(leads) > 0
    then round(sum(investment) / sum(leads), 2)
    else 0 end as cpl,
  case when sum(investment) > 0
    then round(sum(revenue) / sum(investment), 2)
    else 0 end as roas,
  case when sum(won) > 0
    then round(sum(investment) / sum(won), 2)
    else 0 end as cac,
  period_start,
  period_end
from public.campaigns
group by period_start, period_end;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.squads enable row level security;
alter table public.people enable row level security;
alter table public.integrations enable row level security;
alter table public.funnel_mappings enable row level security;
alter table public.tags enable row level security;
alter table public.goals enable row level security;
alter table public.setup_checklist enable row level security;
alter table public.evidence enable row level security;
alter table public.contracts enable row level security;
alter table public.campaigns enable row level security;
alter table public.call_logs enable row level security;
alter table public.alerts enable row level security;
alter table public.logs enable row level security;

-- Policies de leitura: qualquer usuário autenticado pode ler
create policy "Authenticated read" on public.profiles for select to authenticated using (true);
create policy "Authenticated read" on public.squads for select to authenticated using (true);
create policy "Authenticated read" on public.people for select to authenticated using (true);
create policy "Authenticated read" on public.integrations for select to authenticated using (true);
create policy "Authenticated read" on public.funnel_mappings for select to authenticated using (true);
create policy "Authenticated read" on public.tags for select to authenticated using (true);
create policy "Authenticated read" on public.goals for select to authenticated using (true);
create policy "Authenticated read" on public.setup_checklist for select to authenticated using (true);
create policy "Authenticated read" on public.evidence for select to authenticated using (true);
create policy "Authenticated read" on public.contracts for select to authenticated using (true);
create policy "Authenticated read" on public.campaigns for select to authenticated using (true);
create policy "Authenticated read" on public.call_logs for select to authenticated using (true);
create policy "Authenticated read" on public.alerts for select to authenticated using (true);
create policy "Authenticated read" on public.logs for select to authenticated using (true);

-- Policies de escrita: apenas admins
create policy "Admin write" on public.profiles for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin write" on public.squads for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin write" on public.people for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin write" on public.integrations for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin write" on public.funnel_mappings for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin write" on public.tags for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin write" on public.goals for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin write" on public.setup_checklist for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin write" on public.evidence for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin write" on public.contracts for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin write" on public.campaigns for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin write" on public.call_logs for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin write" on public.alerts for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admin write" on public.logs for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Profiles: usuário pode editar o próprio perfil
create policy "Own profile update" on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================================
-- TRIGGER: auto-atualizar updated_at
-- ============================================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.people
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.integrations
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.goals
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.evidence
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.contracts
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- TRIGGER: criar profile ao registrar novo usuário
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'viewer'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- DADOS INICIAIS
-- ============================================================================

-- Squads padrão
insert into public.squads (name) values ('Alpha'), ('Beta'), ('Gamma')
on conflict (name) do nothing;

-- Etapas do funil padrão
insert into public.funnel_mappings (step_key, step_label, sort_order) values
  ('leads', 'Leads', 0),
  ('booked', 'Agendados', 1),
  ('received', 'Recebidos', 2),
  ('negotiation', 'Negociação', 3),
  ('won', 'Fechados', 4)
on conflict (step_key) do nothing;

-- Setup checklist padrão
insert into public.setup_checklist (key, label, completed, route) values
  ('connect-crm', 'Conectar Kommo CRM', false, '/admin/integrations'),
  ('connect-ads', 'Conectar Meta Ads', false, '/admin/integrations'),
  ('map-funnel', 'Mapear etapas do funil', false, '/admin/funnel-mapping'),
  ('add-team', 'Cadastrar equipe (SDRs e Closers)', false, '/admin/collaborators'),
  ('set-goals', 'Definir metas do período', false, '/admin/goals'),
  ('first-sync', 'Realizar primeira sincronização', false, '/admin/integrations')
on conflict (key) do nothing;

-- Integrações padrão (desconectadas)
insert into public.integrations (name, type, status) values
  ('Kommo CRM', 'crm', 'disconnected'),
  ('Meta Ads', 'ads', 'disconnected'),
  ('Google Ads', 'ads', 'disconnected')
on conflict do nothing;
