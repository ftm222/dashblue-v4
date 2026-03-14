-- ============================================================================
-- FIX RLS + SEED DATA para desenvolvimento
-- ============================================================================

-- Adicionar policies para anon (desenvolvimento sem login)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'profiles','squads','people','integrations','funnel_mappings',
    'tags','goals','setup_checklist','evidence','contracts',
    'campaigns','call_logs','alerts','logs'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Anon read" ON public.%I', tbl);
    EXECUTE format('CREATE POLICY "Anon read" ON public.%I FOR SELECT TO anon USING (true)', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Anon write" ON public.%I', tbl);
    EXECUTE format('CREATE POLICY "Anon write" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;

-- Limpar tabelas (respeitar FK)
TRUNCATE public.logs CASCADE;
TRUNCATE public.alerts CASCADE;
TRUNCATE public.call_logs CASCADE;
TRUNCATE public.contracts CASCADE;
TRUNCATE public.evidence CASCADE;
TRUNCATE public.goals CASCADE;
TRUNCATE public.setup_checklist CASCADE;
TRUNCATE public.tags CASCADE;
TRUNCATE public.funnel_mappings CASCADE;
TRUNCATE public.campaigns CASCADE;
TRUNCATE public.people CASCADE;
TRUNCATE public.integrations CASCADE;
TRUNCATE public.squads CASCADE;

-- Squads
INSERT INTO public.squads (id, name) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Alpha'),
  ('a1000000-0000-0000-0000-000000000002', 'Bravo'),
  ('a1000000-0000-0000-0000-000000000003', 'Charlie');

-- People (SDRs)
INSERT INTO public.people (id, name, role, squad_id, active) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Lucas Mendes', 'sdr', 'a1000000-0000-0000-0000-000000000001', true),
  ('b1000000-0000-0000-0000-000000000002', 'Mariana Costa', 'sdr', 'a1000000-0000-0000-0000-000000000001', true),
  ('b1000000-0000-0000-0000-000000000003', 'Pedro Alves', 'sdr', 'a1000000-0000-0000-0000-000000000002', true);

-- People (Closers)
INSERT INTO public.people (id, name, role, squad_id, active) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Ana Oliveira', 'closer', 'a1000000-0000-0000-0000-000000000001', true),
  ('c1000000-0000-0000-0000-000000000002', 'Carlos Silva', 'closer', 'a1000000-0000-0000-0000-000000000002', true),
  ('c1000000-0000-0000-0000-000000000003', 'Beatriz Santos', 'closer', 'a1000000-0000-0000-0000-000000000003', true);

-- Integrations
INSERT INTO public.integrations (id, name, type, status, last_sync) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Kommo CRM', 'crm', 'connected', now() - interval '2 hours'),
  ('d1000000-0000-0000-0000-000000000002', 'Meta Ads', 'ads', 'connected', now() - interval '4 hours'),
  ('d1000000-0000-0000-0000-000000000003', 'Google Ads', 'ads', 'disconnected', null);

-- Funnel Mappings
INSERT INTO public.funnel_mappings (id, step_key, step_label, crm_field, crm_value, sort_order) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'leads', 'Leads', 'pipeline_status', 'Novo Lead', 0),
  ('e1000000-0000-0000-0000-000000000002', 'booked', 'Agendados', 'pipeline_status', 'Agendado', 1),
  ('e1000000-0000-0000-0000-000000000003', 'received', 'Recebidos', 'pipeline_status', 'Recebido', 2),
  ('e1000000-0000-0000-0000-000000000004', 'negotiation', 'Negociação', 'pipeline_status', 'Em Negociação', 3),
  ('e1000000-0000-0000-0000-000000000005', 'won', 'Fechados', 'pipeline_status', 'Ganho', 4);

-- Tags
INSERT INTO public.tags (id, original, alias) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'quente', 'Hot Lead'),
  ('f1000000-0000-0000-0000-000000000002', 'frio', 'Cold Lead'),
  ('f1000000-0000-0000-0000-000000000003', 'indicação', 'Referral'),
  ('f1000000-0000-0000-0000-000000000004', 'orgânico', 'Organic'),
  ('f1000000-0000-0000-0000-000000000005', 'retorno', 'Returning');

-- Goals (globais)
INSERT INTO public.goals (id, person_id, type, target, period_start, period_end) VALUES
  ('aa100000-0000-0000-0000-000000000001', null, 'revenue', 500000, '2026-03-01', '2026-03-31'),
  ('aa100000-0000-0000-0000-000000000002', null, 'booked', 150, '2026-03-01', '2026-03-31');

-- Setup Checklist
INSERT INTO public.setup_checklist (id, key, label, completed, route) VALUES
  ('bb100000-0000-0000-0000-000000000001', 'crm', 'Conectar CRM', true, '/admin/integrations'),
  ('bb100000-0000-0000-0000-000000000002', 'ads', 'Conectar Ads', true, '/admin/integrations'),
  ('bb100000-0000-0000-0000-000000000003', 'funnel', 'Mapear funil', true, '/admin/funnel-mapping'),
  ('bb100000-0000-0000-0000-000000000004', 'tags', 'Configurar tags', false, '/admin/tags-aliases'),
  ('bb100000-0000-0000-0000-000000000005', 'team', 'Adicionar equipe', false, '/admin/collaborators'),
  ('bb100000-0000-0000-0000-000000000006', 'goals', 'Definir metas', false, '/admin/goals');

-- Alerts
INSERT INTO public.alerts (id, type, message, link, dismissible, dismissed_by, expires_at) VALUES
  ('cc100000-0000-0000-0000-000000000001', 'warning', 'Sincronização do Google Ads está desconectada', '/admin/integrations', true, '{}', null),
  ('cc100000-0000-0000-0000-000000000002', 'info', 'Nova funcionalidade: Metas Individuais disponíveis', '/admin/individual-goals', true, '{}', now() + interval '7 days');

-- Evidence
INSERT INTO public.evidence (id, contact_name, phone, email, utm_source, utm_medium, utm_campaign, funnel_step, sdr_id, closer_id, value, tags, badges, created_at) VALUES
  (gen_random_uuid(), 'João Pereira', '+5511999990001', 'joao@empresa.com', 'facebook', 'cpc', 'camp_marc_01', 'leads', 'b1000000-0000-0000-0000-000000000001', null, 0, '{"quente"}', '{}', now() - interval '2 days'),
  (gen_random_uuid(), 'Maria Silva', '+5511999990002', 'maria@empresa.com', 'google', 'cpc', 'camp_google_01', 'leads', 'b1000000-0000-0000-0000-000000000002', null, 0, '{"orgânico"}', '{}', now() - interval '3 days'),
  (gen_random_uuid(), 'André Santos', '+5511999990003', 'andre@empresa.com', 'facebook', 'cpc', 'camp_marc_02', 'booked', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 0, '{"quente"}', '{}', now() - interval '2 days'),
  (gen_random_uuid(), 'Fernanda Lima', '+5511999990004', 'fernanda@empresa.com', 'instagram', 'cpc', 'camp_insta_01', 'booked', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 0, '{"indicação"}', '{}', now() - interval '1 day'),
  (gen_random_uuid(), 'Ricardo Gomes', '+5511999990005', 'ricardo@empresa.com', 'google', 'cpc', 'camp_google_02', 'received', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 0, '{"quente"}', '{}', now() - interval '4 days'),
  (gen_random_uuid(), 'Paula Nunes', '+5511999990006', 'paula@empresa.com', 'facebook', 'cpc', 'camp_marc_01', 'received', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 0, '{"frio"}', '{}', now() - interval '5 days'),
  (gen_random_uuid(), 'Thiago Costa', '+5511999990007', 'thiago@empresa.com', 'linkedin', 'cpc', 'camp_linkedin_01', 'negotiation', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 0, '{}', '{}', now() - interval '3 days'),
  (gen_random_uuid(), 'Camila Rocha', '+5511999990008', 'camila@empresa.com', 'facebook', 'cpc', 'camp_marc_02', 'won', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 15000, '{"quente"}', '{"assinado","pago"}', now() - interval '1 day'),
  (gen_random_uuid(), 'Rafael Almeida', '+5511999990009', 'rafael@empresa.com', 'google', 'cpc', 'camp_google_01', 'won', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 22000, '{"indicação"}', '{"assinado","pago"}', now() - interval '6 days'),
  (gen_random_uuid(), 'Luana Martins', '+5511999990010', 'luana@empresa.com', 'instagram', 'cpc', 'camp_insta_01', 'won', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 18000, '{"retorno"}', '{"assinado"}', now() - interval '2 days'),
  (gen_random_uuid(), 'Bruno Ferreira', '+5511999990011', 'bruno@empresa.com', 'facebook', 'cpc', 'camp_marc_01', 'leads', 'b1000000-0000-0000-0000-000000000001', null, 0, '{}', '{}', now() - interval '1 day'),
  (gen_random_uuid(), 'Isabela Souza', '+5511999990012', 'isabela@empresa.com', 'google', 'cpc', 'camp_google_02', 'booked', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 0, '{"quente"}', '{}', now() - interval '3 days'),
  (gen_random_uuid(), 'Marcos Oliveira', '+5511999990013', 'marcos@empresa.com', 'linkedin', 'cpc', 'camp_linkedin_01', 'leads', 'b1000000-0000-0000-0000-000000000003', null, 0, '{}', '{}', now() - interval '4 days'),
  (gen_random_uuid(), 'Juliana Ribeiro', '+5511999990014', 'juliana@empresa.com', 'facebook', 'cpc', 'camp_marc_02', 'received', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 0, '{"quente"}', '{}', now() - interval '5 days'),
  (gen_random_uuid(), 'Diego Carvalho', '+5511999990015', 'diego@empresa.com', 'instagram', 'cpc', 'camp_insta_01', 'negotiation', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 0, '{}', '{}', now() - interval '2 days');

-- Campaigns
INSERT INTO public.campaigns (id, integration_id, name, source, medium, investment, impressions, clicks, leads, booked, received, won, revenue, period_start, period_end) VALUES
  (gen_random_uuid(), 'd1000000-0000-0000-0000-000000000002', 'Campanha Facebook - Março 01', 'facebook', 'cpc', 8500, 120000, 3200, 85, 22, 15, 5, 75000, '2026-03-01', '2026-03-15'),
  (gen_random_uuid(), 'd1000000-0000-0000-0000-000000000002', 'Campanha Facebook - Março 02', 'facebook', 'cpc', 6200, 95000, 2800, 62, 18, 12, 3, 45000, '2026-03-01', '2026-03-15'),
  (gen_random_uuid(), 'd1000000-0000-0000-0000-000000000003', 'Google Ads - Search Março', 'google', 'cpc', 12000, 85000, 4100, 110, 35, 22, 8, 120000, '2026-03-01', '2026-03-15'),
  (gen_random_uuid(), 'd1000000-0000-0000-0000-000000000003', 'Google Ads - Display Março', 'google', 'display', 4500, 200000, 1800, 40, 10, 6, 2, 30000, '2026-03-01', '2026-03-15'),
  (gen_random_uuid(), 'd1000000-0000-0000-0000-000000000002', 'Instagram - Stories Março', 'instagram', 'cpc', 3800, 70000, 2100, 48, 12, 8, 3, 42000, '2026-03-01', '2026-03-15'),
  (gen_random_uuid(), null, 'LinkedIn Ads - B2B', 'linkedin', 'cpc', 5000, 35000, 950, 28, 8, 5, 2, 35000, '2026-03-01', '2026-03-15');

-- Contracts
INSERT INTO public.contracts (id, client_name, sdr_id, closer_id, squad_id, value, status, signed_at, paid_at, created_at) VALUES
  (gen_random_uuid(), 'Camila Rocha', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 15000, 'signed_paid', now() - interval '1 day', now() - interval '12 hours', now() - interval '1 day'),
  (gen_random_uuid(), 'Rafael Almeida', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 22000, 'signed_paid', now() - interval '5 days', now() - interval '4 days', now() - interval '6 days'),
  (gen_random_uuid(), 'Luana Martins', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 18000, 'signed_unpaid', now() - interval '2 days', null, now() - interval '2 days'),
  (gen_random_uuid(), 'Thiago Costa', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 12000, 'unsigned', null, null, now() - interval '3 days'),
  (gen_random_uuid(), 'Diego Carvalho', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 9500, 'signed_paid', now() - interval '7 days', now() - interval '6 days', now() - interval '7 days');

-- Call Logs
INSERT INTO public.call_logs (id, person_id, call_type, answered, duration_seconds, called_at) VALUES
  (gen_random_uuid(), 'b1000000-0000-0000-0000-000000000001', 'r1', true, 180, now() - interval '2 days'),
  (gen_random_uuid(), 'b1000000-0000-0000-0000-000000000001', 'r1', true, 240, now() - interval '1 day'),
  (gen_random_uuid(), 'b1000000-0000-0000-0000-000000000001', 'r2', false, 0, now() - interval '3 days'),
  (gen_random_uuid(), 'b1000000-0000-0000-0000-000000000002', 'r1', true, 300, now() - interval '2 days'),
  (gen_random_uuid(), 'b1000000-0000-0000-0000-000000000002', 'follow_up', true, 120, now() - interval '1 day'),
  (gen_random_uuid(), 'b1000000-0000-0000-0000-000000000003', 'r1', true, 200, now() - interval '4 days'),
  (gen_random_uuid(), 'b1000000-0000-0000-0000-000000000003', 'r2', true, 350, now() - interval '3 days'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'r1', true, 420, now() - interval '2 days'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'r2', true, 600, now() - interval '1 day'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'r1', true, 380, now() - interval '3 days'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'follow_up', false, 0, now() - interval '2 days'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'r1', true, 280, now() - interval '5 days');

-- Logs
INSERT INTO public.logs (id, user_id, action, entity_type, entity_id, details, created_at) VALUES
  (gen_random_uuid(), null, 'sync', 'integration', 'd1000000-0000-0000-0000-000000000001', '{"message": "Sincronização automática Kommo CRM concluída"}', now() - interval '2 hours'),
  (gen_random_uuid(), null, 'sync', 'integration', 'd1000000-0000-0000-0000-000000000002', '{"message": "Sincronização automática Meta Ads concluída"}', now() - interval '4 hours'),
  (gen_random_uuid(), null, 'error', 'integration', 'd1000000-0000-0000-0000-000000000003', '{"message": "Falha na sincronização Google Ads: timeout"}', now() - interval '6 hours'),
  (gen_random_uuid(), null, 'config', 'funnel_mappings', null, '{"message": "Alterou mapeamento de funil: etapa Negociação"}', now() - interval '1 day'),
  (gen_random_uuid(), null, 'config', 'goals', null, '{"message": "Atualizou meta de receita para R$ 500.000"}', now() - interval '2 days'),
  (gen_random_uuid(), null, 'config', 'integrations', 'd1000000-0000-0000-0000-000000000002', '{"message": "Conectou integração Meta Ads"}', now() - interval '3 days');
