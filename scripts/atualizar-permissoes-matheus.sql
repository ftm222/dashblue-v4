-- ============================================================================
-- Vincula usuário sem organização à primeira org existente e define admin
-- Execute no Supabase: SQL Editor (Dashboard > SQL Editor > New query)
-- Resolve o erro "Usuário sem organização" e permite acessar integrações
-- ============================================================================

-- DIAGNÓSTICO PRÉVIO (execute e verifique antes do script principal):
-- 1. Existem organizações?
--    SELECT id, name FROM public.organizations ORDER BY created_at LIMIT 5;
-- 2. Usuários sem organização? (copie o email do usuário que precisa de acesso)
--    SELECT id, name, email, organization_id, role FROM public.profiles WHERE organization_id IS NULL;

-- ============================================================================
-- CONFIGURE AQUI: use o email do usuário (mais confiável que o nome)
-- ============================================================================
DO $$
DECLARE
  -- ALTERE APENAS ESTA LINHA com o email real do usuário:
  target_email text := 'matheus@dashblue.com.br';
  first_org_id uuid;
  target_profile record;
BEGIN
  -- Obtém a primeira organização
  SELECT id INTO first_org_id FROM public.organizations ORDER BY created_at LIMIT 1;
  IF first_org_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma organização existe. Crie uma organização primeiro.';
  END IF;

  -- Busca o perfil pelo email
  SELECT id, organization_id, role INTO target_profile
  FROM public.profiles
  WHERE LOWER(email) = LOWER(target_email)
  LIMIT 1;

  IF target_profile.id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado com o email: %. Verifique o email e tente novamente.', target_email;
  END IF;

  -- 1. Atualiza profiles: vincula à organização e define role admin
  UPDATE public.profiles
  SET organization_id = first_org_id,
      role = 'admin'
  WHERE id = target_profile.id
    AND (organization_id IS NULL OR role != 'admin');

  -- 2. Garante entrada em org_members
  INSERT INTO public.org_members (organization_id, user_id, role)
  SELECT first_org_id, target_profile.id, 'admin'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.organization_id = first_org_id AND om.user_id = target_profile.id
  );

  -- 3. Atualiza role em org_members se já existir
  UPDATE public.org_members
  SET role = 'admin'
  WHERE user_id = target_profile.id
    AND organization_id = first_org_id;

  RAISE NOTICE 'Usuário % vinculado à organização com sucesso. Role definido como admin.', target_email;
END $$;

-- Verificação final: confirme que o usuário agora tem organização
-- SELECT id, name, email, organization_id, role FROM public.profiles WHERE email ILIKE 'matheus@dashblue.com.br';

-- ============================================================================
-- ALTERNATIVA: Se não tiver o email, use esta versão por NOME (descomente)
-- ============================================================================
/*
DO $$
DECLARE
  target_name text := 'Matheus Fernandes';  -- ALTERE com o nome do usuário
  first_org_id uuid;
  target_profile record;
BEGIN
  SELECT id INTO first_org_id FROM public.organizations ORDER BY created_at LIMIT 1;
  IF first_org_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma organização existe. Crie uma organização primeiro.';
  END IF;

  SELECT id, organization_id, role INTO target_profile
  FROM public.profiles
  WHERE name ILIKE '%' || target_name || '%'
  LIMIT 1;

  IF target_profile.id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado com o nome: %.', target_name;
  END IF;

  UPDATE public.profiles
  SET organization_id = first_org_id, role = 'admin'
  WHERE id = target_profile.id AND (organization_id IS NULL OR role != 'admin');

  INSERT INTO public.org_members (organization_id, user_id, role)
  SELECT first_org_id, target_profile.id, 'admin'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.organization_id = first_org_id AND om.user_id = target_profile.id
  );

  UPDATE public.org_members
  SET role = 'admin'
  WHERE user_id = target_profile.id AND organization_id = first_org_id;

  RAISE NOTICE 'Usuário % vinculado com sucesso.', target_name;
END $$;
*/
