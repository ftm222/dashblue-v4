-- ============================================================================
-- DASHBLUE v4 — Migration 006: Goals global unique (role, squad)
-- ============================================================================
-- Permite múltiplas metas gerais do mesmo tipo para diferentes públicos/equipes
-- ============================================================================

DROP INDEX IF EXISTS public.idx_goals_global_unique;

-- COALESCE para tratar NULL como valor único (evita múltiplas metas "org-wide" duplicadas)
CREATE UNIQUE INDEX idx_goals_global_unique
  ON public.goals(
    organization_id,
    type,
    period_start,
    period_end,
    COALESCE(role, ''),
    COALESCE(squad_id::text, '')
  )
  WHERE person_id IS NULL;
