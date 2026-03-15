-- ============================================================================
-- DASHBLUE v4 — Migration 003: Fix Database Modeling
-- ============================================================================
-- Corrige: UNIQUE multi-tenant, NOT NULL org_id, FK plan, views, indexes
-- ============================================================================

-- ============================================================================
-- 1. FIX UNIQUE CONSTRAINTS FOR MULTI-TENANCY
-- ============================================================================

ALTER TABLE public.funnel_mappings DROP CONSTRAINT IF EXISTS funnel_mappings_step_key_key;
ALTER TABLE public.funnel_mappings ADD CONSTRAINT funnel_mappings_org_step_key
  UNIQUE (organization_id, step_key);

ALTER TABLE public.tags DROP CONSTRAINT IF EXISTS tags_original_key;
ALTER TABLE public.tags ADD CONSTRAINT tags_org_original
  UNIQUE (organization_id, original);

ALTER TABLE public.setup_checklist DROP CONSTRAINT IF EXISTS setup_checklist_key_key;
ALTER TABLE public.setup_checklist ADD CONSTRAINT setup_checklist_org_key
  UNIQUE (organization_id, key);

ALTER TABLE public.squads DROP CONSTRAINT IF EXISTS squads_name_key;
ALTER TABLE public.squads ADD CONSTRAINT squads_org_name
  UNIQUE (organization_id, name);

-- ============================================================================
-- 2. MAKE organization_id NOT NULL ON DATA TABLES
-- ============================================================================

DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'squads','people','integrations','funnel_mappings','tags','goals',
    'setup_checklist','evidence','contracts','campaigns','call_logs','alerts','logs'
  ]) LOOP
    EXECUTE format('DELETE FROM public.%I WHERE organization_id IS NULL', tbl);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN organization_id SET NOT NULL', tbl);
  END LOOP;
END $$;

-- ============================================================================
-- 3. FK organizations.plan -> plans.id
-- ============================================================================

ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_plan_fk
  FOREIGN KEY (plan) REFERENCES public.plans(id);

-- ============================================================================
-- 4. REWRITE VIEWS WITH organization_id
-- ============================================================================

DROP VIEW IF EXISTS public.v_squad_metrics CASCADE;
DROP VIEW IF EXISTS public.v_funnel_summary CASCADE;
DROP VIEW IF EXISTS public.v_person_metrics CASCADE;
DROP VIEW IF EXISTS public.v_call_metrics CASCADE;
DROP VIEW IF EXISTS public.v_financial_summary CASCADE;
DROP VIEW IF EXISTS public.v_campaign_kpis CASCADE;

CREATE VIEW public.v_funnel_summary AS
WITH step_counts AS (
  SELECT e.organization_id, e.funnel_step, fm.step_label, fm.sort_order,
         count(*) AS total, date_trunc('month', e.created_at)::date AS period_month
  FROM public.evidence e
  LEFT JOIN public.funnel_mappings fm
    ON fm.step_key = e.funnel_step AND fm.organization_id = e.organization_id
  GROUP BY e.organization_id, e.funnel_step, fm.step_label, fm.sort_order,
           date_trunc('month', e.created_at)
),
with_top AS (
  SELECT sc.*,
    first_value(sc.total) OVER (
      PARTITION BY sc.organization_id, sc.period_month ORDER BY sc.sort_order
    ) AS top_count,
    lag(sc.total) OVER (
      PARTITION BY sc.organization_id, sc.period_month ORDER BY sc.sort_order
    ) AS prev_count
  FROM step_counts sc
)
SELECT organization_id, funnel_step,
  coalesce(step_label, funnel_step) AS step_label, sort_order, total AS count,
  CASE WHEN prev_count > 0 THEN round((total::numeric / prev_count) * 100, 1) ELSE NULL END AS conversion_from_previous,
  CASE WHEN top_count > 0 THEN round((total::numeric / top_count) * 100, 1) ELSE NULL END AS conversion_from_top,
  period_month
FROM with_top
ORDER BY organization_id, sort_order;

CREATE VIEW public.v_person_metrics AS
SELECT p.organization_id, p.id AS person_id, p.name, p.role, p.squad_id,
  s.name AS squad_name, p.avatar_url,
  count(e.id) FILTER (WHERE e.funnel_step = 'leads') AS leads,
  count(e.id) FILTER (WHERE e.funnel_step = 'booked') AS booked,
  count(e.id) FILTER (WHERE e.funnel_step = 'received') AS received,
  count(e.id) FILTER (WHERE e.funnel_step = 'negotiation') AS negotiation,
  count(e.id) FILTER (WHERE e.funnel_step = 'won') AS won,
  coalesce(sum(e.value) FILTER (WHERE e.funnel_step = 'won'), 0) AS revenue,
  CASE WHEN count(e.id) FILTER (WHERE e.funnel_step = 'booked') > 0
    THEN round(count(e.id) FILTER (WHERE e.funnel_step = 'received')::numeric
      / count(e.id) FILTER (WHERE e.funnel_step = 'booked') * 100, 1) ELSE 0 END AS show_rate,
  CASE WHEN count(e.id) FILTER (WHERE e.funnel_step = 'leads') > 0
    THEN round(count(e.id) FILTER (WHERE e.funnel_step = 'won')::numeric
      / count(e.id) FILTER (WHERE e.funnel_step = 'leads') * 100, 1) ELSE 0 END AS conversion_rate,
  CASE WHEN count(e.id) FILTER (WHERE e.funnel_step = 'won') > 0
    THEN round(coalesce(sum(e.value) FILTER (WHERE e.funnel_step = 'won'), 0)
      / count(e.id) FILTER (WHERE e.funnel_step = 'won'), 2) ELSE 0 END AS ticket_medio,
  date_trunc('month', e.created_at)::date AS period_month
FROM public.people p
LEFT JOIN public.squads s ON s.id = p.squad_id
LEFT JOIN public.evidence e ON (
  (p.role = 'sdr' AND e.sdr_id = p.id) OR (p.role = 'closer' AND e.closer_id = p.id)
)
WHERE p.active = true
GROUP BY p.organization_id, p.id, p.name, p.role, p.squad_id, s.name, p.avatar_url,
         date_trunc('month', e.created_at);

CREATE VIEW public.v_call_metrics AS
SELECT cl.organization_id, cl.person_id, p.name AS person_name, p.role AS person_role,
  count(*) AS total_calls,
  count(*) FILTER (WHERE cl.answered) AS answered_calls,
  count(*) FILTER (WHERE NOT cl.answered) AS missed_calls,
  round(avg(cl.duration_seconds) FILTER (WHERE cl.answered) / 60.0, 1) AS avg_duration_minutes,
  count(*) FILTER (WHERE cl.call_type = 'r1') AS r1_calls,
  count(*) FILTER (WHERE cl.call_type = 'r2') AS r2_calls,
  count(*) FILTER (WHERE cl.call_type = 'follow_up') AS follow_ups,
  date_trunc('month', cl.called_at)::date AS period_month
FROM public.call_logs cl
JOIN public.people p ON p.id = cl.person_id
GROUP BY cl.organization_id, cl.person_id, p.name, p.role, date_trunc('month', cl.called_at);

CREATE VIEW public.v_squad_metrics AS
SELECT s.organization_id, s.id AS squad_id, s.name AS squad_name,
  coalesce(sum(pm.revenue), 0) AS revenue,
  coalesce(sum(pm.won), 0) AS contracts,
  count(DISTINCT pm.person_id) AS member_count,
  coalesce(sum(pm.leads), 0) AS leads,
  coalesce(sum(pm.booked), 0) AS booked,
  coalesce(sum(pm.received), 0) AS received,
  CASE WHEN sum(pm.booked) > 0
    THEN round(sum(pm.received)::numeric / sum(pm.booked) * 100, 1) ELSE 0 END AS show_rate,
  CASE WHEN sum(pm.received) > 0
    THEN round(sum(pm.won)::numeric / sum(pm.received) * 100, 1) ELSE 0 END AS conversion_rate,
  CASE WHEN sum(pm.won) > 0
    THEN round(sum(pm.revenue) / sum(pm.won), 2) ELSE 0 END AS ticket_medio,
  pm.period_month
FROM public.squads s
LEFT JOIN public.v_person_metrics pm ON pm.squad_id = s.id
GROUP BY s.organization_id, s.id, s.name, pm.period_month;

CREATE VIEW public.v_financial_summary AS
SELECT organization_id,
  count(*) AS total_contracts,
  coalesce(sum(value), 0) AS total_revenue,
  count(*) FILTER (WHERE status IN ('signed_paid','signed_unpaid')) AS signed_contracts,
  coalesce(sum(value) FILTER (WHERE status IN ('signed_paid','signed_unpaid')), 0) AS signed_revenue,
  count(*) FILTER (WHERE status = 'signed_paid') AS paid_contracts,
  coalesce(sum(value) FILTER (WHERE status = 'signed_paid'), 0) AS paid_revenue,
  count(*) FILTER (WHERE status = 'unsigned') AS unsigned_contracts,
  coalesce(sum(value) FILTER (WHERE status = 'unsigned'), 0) AS signature_gap,
  count(*) FILTER (WHERE status = 'signed_unpaid') AS unpaid_contracts,
  coalesce(sum(value) FILTER (WHERE status = 'signed_unpaid'), 0) AS payment_gap,
  coalesce(sum(value) FILTER (WHERE status = 'unsigned'), 0)
    + coalesce(sum(value) FILTER (WHERE status = 'signed_unpaid'), 0) AS total_gap,
  date_trunc('month', created_at)::date AS period_month
FROM public.contracts
GROUP BY organization_id, date_trunc('month', created_at);

CREATE VIEW public.v_campaign_kpis AS
SELECT organization_id,
  coalesce(sum(investment), 0) AS total_investment,
  coalesce(sum(leads), 0) AS total_leads,
  coalesce(sum(booked), 0) AS total_booked,
  coalesce(sum(received), 0) AS total_received,
  coalesce(sum(won), 0) AS total_won,
  coalesce(sum(revenue), 0) AS total_revenue,
  CASE WHEN sum(leads) > 0 THEN round(sum(investment) / sum(leads), 2) ELSE 0 END AS cpl,
  CASE WHEN sum(investment) > 0 THEN round(sum(revenue) / sum(investment), 2) ELSE 0 END AS roas,
  CASE WHEN sum(won) > 0 THEN round(sum(investment) / sum(won), 2) ELSE 0 END AS cac,
  period_start, period_end
FROM public.campaigns
GROUP BY organization_id, period_start, period_end;

-- ============================================================================
-- 5. COMPOSITE INDEXES FOR MULTI-TENANT QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_evidence_org_created ON public.evidence(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_org_funnel ON public.evidence(organization_id, funnel_step);
CREATE INDEX IF NOT EXISTS idx_evidence_org_sdr ON public.evidence(organization_id, sdr_id) WHERE sdr_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evidence_org_closer ON public.evidence(organization_id, closer_id) WHERE closer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_org_status ON public.contracts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_org_created ON public.contracts(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_evidence ON public.contracts(evidence_id) WHERE evidence_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_call_logs_org_person ON public.call_logs(organization_id, person_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_evidence ON public.call_logs(evidence_id) WHERE evidence_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_org_period ON public.campaigns(organization_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_goals_org_period ON public.goals(organization_id, period_start, period_end);

-- ============================================================================
-- 6. UNIQUE FOR CAMPAIGN SYNC DEDUP
-- ============================================================================

ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_integration_external_unique
  UNIQUE (integration_id, external_id);

-- ============================================================================
-- 7. GOALS PARTIAL UNIQUE FOR GLOBAL GOALS (person_id IS NULL)
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_global_unique
  ON public.goals(organization_id, type, period_start, period_end)
  WHERE person_id IS NULL;
