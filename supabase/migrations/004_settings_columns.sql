-- ============================================================================
-- DASHBLUE v4 — Migration 004: Settings Columns
-- ============================================================================
-- Adds JSONB settings columns for user preferences and org configuration
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
