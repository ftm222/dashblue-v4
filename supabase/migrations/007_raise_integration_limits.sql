-- Permite várias conexões (várias contas Meta Ads, CRMs, etc.) sem ficar preso a max_integrations = 1.

UPDATE public.organizations
SET max_integrations = GREATEST(max_integrations, 25);

UPDATE public.plans SET max_integrations = 25 WHERE id = 'free';
UPDATE public.plans SET max_integrations = 25 WHERE id = 'starter';
UPDATE public.plans SET max_integrations = 100 WHERE id = 'pro';

ALTER TABLE public.organizations ALTER COLUMN max_integrations SET DEFAULT 25;
