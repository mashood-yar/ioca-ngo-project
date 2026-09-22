-- ==============================================================================
-- MIGRATION SCRIPT: Tiers Update & Donations Refactor
-- Run this script in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Updates to tiers table
ALTER TABLE public.tiers ADD COLUMN IF NOT EXISTS name_ur TEXT;
ALTER TABLE public.tiers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tiers ADD COLUMN IF NOT EXISTS description_ur TEXT;
ALTER TABLE public.tiers ADD COLUMN IF NOT EXISTS benefits TEXT[];
ALTER TABLE public.tiers ADD COLUMN IF NOT EXISTS benefits_ur TEXT[];

-- 2. Updates to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnic_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation TEXT;

-- 3. Updates to donations table
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS receipt_number TEXT;

-- 4. Create site_settings table (if not exists)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed site_settings
INSERT INTO public.site_settings (key, value) 
VALUES ('donations_enabled', 'false') 
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 5. Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  account_title TEXT NOT NULL,
  account_number TEXT NOT NULL,
  iban TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed a dummy payment method so it's not empty
INSERT INTO public.payment_methods (type, provider_name, account_title, account_number, iban)
VALUES ('Bank Transfer', 'Meezan Bank', 'IOCA NGO', '1234 5678 9012 3456', 'PK00MEZN0000000000000000')
ON CONFLICT DO NOTHING;

-- 6. Add RLS Policies for new tables
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read payment_methods" ON public.payment_methods FOR SELECT USING (is_active = true);
