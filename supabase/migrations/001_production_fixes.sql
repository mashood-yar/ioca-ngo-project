-- ============================================================
-- Migration: 001_production_fixes
-- Description: Adds missing columns, creates new tables, and updates policies
-- ============================================================

-- A. Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnic TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_volunteer BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- B. Add missing columns to donations table
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS dedication TEXT;

-- C. Add missing columns to applications table
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS profile_image_public_id TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS payment_method_id UUID;

-- D. Add missing columns to volunteers table
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS profile_image_public_id TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS cnic TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS heard_from TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS personnel_uid TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS availability TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS motivation TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add status if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'volunteers' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.volunteers ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected'));
  END IF;
END $$;

-- E. Add missing columns to news table
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- F. Fix personnel category constraint to include 'member'
ALTER TABLE public.personnel DROP CONSTRAINT IF EXISTS personnel_category_check;
ALTER TABLE public.personnel ADD CONSTRAINT personnel_category_check 
  CHECK (category IN ('board', 'partner', 'employee', 'volunteer', 'member'));

-- G. Add 7 missing tables

-- 1. gallery
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  image_public_id TEXT,
  category TEXT DEFAULT 'General',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. programs
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ur TEXT,
  slug TEXT UNIQUE,
  desc_en TEXT,
  desc_ur TEXT,
  content_en TEXT,
  content_ur TEXT,
  icon_url TEXT,
  hero_image_url TEXT,
  category_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  key_impact JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. program_categories
CREATE TABLE IF NOT EXISTS public.program_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ur TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_svg TEXT,
  color TEXT DEFAULT '#569AD0',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from programs to program_categories
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'programs_category_fk'
  ) THEN
    ALTER TABLE public.programs ADD CONSTRAINT programs_category_fk 
      FOREIGN KEY (category_id) REFERENCES public.program_categories(id) ON DELETE SET NULL NOT VALID;
  END IF;
END $$;

-- 4. impact_stats
CREATE TABLE IF NOT EXISTS public.impact_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_en TEXT NOT NULL,
  label_ur TEXT,
  value NUMERIC DEFAULT 0,
  suffix TEXT DEFAULT '+',
  icon TEXT DEFAULT 'HeartPulse',
  color TEXT DEFAULT 'teal',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.site_settings (key, value) VALUES
  ('donations_enabled', 'true'),
  ('maintenance_mode', 'false'),
  ('site_name', 'IOCA'),
  ('contact_email', 'info@iocaworld.org'),
  ('whatsapp_number', ''),
  ('hero_slides', '[]')
ON CONFLICT (key) DO NOTHING;

-- 6. project_assignments
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'volunteer' CHECK (role IN ('volunteer', 'coordinator', 'lead', 'member', 'supervisor')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(project_id, user_id)
);

-- 7. audience_contacts
CREATE TABLE IF NOT EXISTS public.audience_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  tags TEXT[] DEFAULT '{}',
  is_subscribed BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'newsletter',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- H. RLS and Grants

-- Enable RLS on new tables
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies (using DO blocks for Postgres 15 compatibility)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'gallery_public_read' AND tablename = 'gallery') THEN
    CREATE POLICY "gallery_public_read" ON public.gallery FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'programs_public_read' AND tablename = 'programs') THEN
    CREATE POLICY "programs_public_read" ON public.programs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'program_categories_public_read' AND tablename = 'program_categories') THEN
    CREATE POLICY "program_categories_public_read" ON public.program_categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'impact_stats_public_read' AND tablename = 'impact_stats') THEN
    CREATE POLICY "impact_stats_public_read" ON public.impact_stats FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'site_settings_public_read' AND tablename = 'site_settings') THEN
    CREATE POLICY "site_settings_public_read" ON public.site_settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'project_assignments_read' AND tablename = 'project_assignments') THEN
    CREATE POLICY "project_assignments_read" ON public.project_assignments FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Grant service_role access to all tables
GRANT ALL ON public.gallery TO service_role, authenticated, anon;
GRANT ALL ON public.programs TO service_role, authenticated, anon;
GRANT ALL ON public.program_categories TO service_role, authenticated, anon;
GRANT ALL ON public.impact_stats TO service_role, authenticated, anon;
GRANT ALL ON public.site_settings TO service_role, authenticated, anon;
GRANT ALL ON public.project_assignments TO service_role, authenticated, anon;
GRANT ALL ON public.audience_contacts TO service_role, authenticated, anon;
GRANT ALL ON public.profiles TO service_role, authenticated, anon;
GRANT ALL ON public.donations TO service_role, authenticated, anon;
GRANT ALL ON public.applications TO service_role, authenticated, anon;
GRANT ALL ON public.volunteers TO service_role, authenticated, anon;
GRANT ALL ON public.news TO service_role, authenticated, anon;
GRANT ALL ON public.personnel TO service_role, authenticated, anon;
GRANT ALL ON public.members TO service_role, authenticated, anon;
GRANT ALL ON public.events TO service_role, authenticated, anon;
GRANT ALL ON public.event_registrations TO service_role, authenticated, anon;
GRANT ALL ON public.memberships TO service_role, authenticated, anon;
GRANT ALL ON public.tiers TO service_role, authenticated, anon;
GRANT ALL ON public.zones TO service_role, authenticated, anon;
GRANT ALL ON public.projects TO service_role, authenticated, anon;
GRANT ALL ON public.payment_methods TO service_role, authenticated, anon;
GRANT ALL ON public.testimonials TO service_role, authenticated, anon;
GRANT ALL ON public.impact_stories TO service_role, authenticated, anon;
GRANT ALL ON public.contacts TO service_role, authenticated, anon;
