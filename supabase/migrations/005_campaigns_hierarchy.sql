-- ============================================================================
-- DASHBLUE v4 — Migration 005: Hierarquia de Campanhas (Campanha → Conjunto → Anúncio)
-- ============================================================================
-- Adiciona level e parent_external_id para suportar visualização hierárquica
-- no Meta Ads: Campanha → Conjunto de anúncios → Anúncio
-- ============================================================================

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'campaign'
    CHECK (level IN ('campaign', 'ad_set', 'ad')),
  ADD COLUMN IF NOT EXISTS parent_external_id text;

COMMENT ON COLUMN public.campaigns.level IS 'Nível na hierarquia: campaign (raiz), ad_set (conjunto), ad (anúncio)';
COMMENT ON COLUMN public.campaigns.parent_external_id IS 'external_id do pai na hierarquia. NULL para campanhas.';

CREATE INDEX IF NOT EXISTS idx_campaigns_parent ON public.campaigns(parent_external_id) WHERE parent_external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_level ON public.campaigns(level);
