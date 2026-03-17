-- ============================================================================
-- DASHBLUE v4 — Migration 005: Goals - description, role, squad_id
-- ============================================================================
-- Adiciona campos para identificar público-alvo e descrição da meta
-- ============================================================================

ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('sdr', 'closer'));
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS squad_id UUID REFERENCES public.squads(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.goals.description IS 'Descrição ou contexto da meta';
COMMENT ON COLUMN public.goals.role IS 'Público: SDR ou Closer (null = organização)';
COMMENT ON COLUMN public.goals.squad_id IS 'Equipe específica (null = todas)';
