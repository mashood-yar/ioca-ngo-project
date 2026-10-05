-- ============================================================
-- Migration: 002_seed_programs_and_fix_tables
-- Run this in Supabase SQL Editor AFTER 001_production_fixes.sql
-- This creates all missing tables AND seeds initial program data
-- ============================================================

-- --------------------------------------------------------
-- STEP 1: Ensure program_categories table exists (with all columns)
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- STEP 2: Ensure programs table exists (with ALL columns the backend uses)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ur TEXT,
  slug TEXT UNIQUE,
  desc_en TEXT,
  desc_ur TEXT,
  content_en TEXT,
  content_ur TEXT,
  image_url TEXT,
  image_public_id TEXT,
  icon_url TEXT,
  hero_image_url TEXT,
  category_id UUID REFERENCES public.program_categories(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  key_impact JSONB DEFAULT '[]',
  stats_beneficiaries INTEGER DEFAULT 0,
  stats_projects INTEGER DEFAULT 0,
  stats_volunteers INTEGER DEFAULT 0,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already existed without them
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS image_public_id TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS stats_beneficiaries INTEGER DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS stats_projects INTEGER DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS stats_volunteers INTEGER DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- --------------------------------------------------------
-- STEP 3: Ensure impact_stats table exists
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- STEP 4: Ensure gallery table exists
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- STEP 5: Ensure audience_contacts table exists
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- STEP 6: Ensure site_settings table exists
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- STEP 7: Enable RLS on all new tables
-- --------------------------------------------------------
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_contacts ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- STEP 8: RLS Policies
-- --------------------------------------------------------
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'audience_contacts_service_role' AND tablename = 'audience_contacts') THEN
    CREATE POLICY "audience_contacts_service_role" ON public.audience_contacts USING (true) WITH CHECK (true);
  END IF;
END $$;

-- --------------------------------------------------------
-- STEP 9: GRANT permissions to service_role (backend uses this)
-- --------------------------------------------------------
GRANT ALL ON public.gallery TO service_role, authenticated, anon;
GRANT ALL ON public.programs TO service_role, authenticated, anon;
GRANT ALL ON public.program_categories TO service_role, authenticated, anon;
GRANT ALL ON public.impact_stats TO service_role, authenticated, anon;
GRANT ALL ON public.site_settings TO service_role, authenticated, anon;
GRANT ALL ON public.audience_contacts TO service_role, authenticated, anon;

-- --------------------------------------------------------
-- STEP 10: Seed Program Categories
-- --------------------------------------------------------
INSERT INTO public.program_categories (name_en, name_ur, slug, description, color, sort_order)
VALUES
  ('Education', 'تعلیم', 'education', 'Educational programs and scholarships', '#3B82F6', 1),
  ('Health', 'صحت', 'health', 'Healthcare and medical assistance programs', '#10B981', 2),
  ('Youth Development', 'نوجوانوں کی ترقی', 'youth', 'Youth empowerment and skills development', '#F59E0B', 3),
  ('Community Bonding', 'کمیونٹی بانڈنگ', 'community', 'Community welfare and social cohesion programs', '#8B5CF6', 4)
ON CONFLICT (slug) DO NOTHING;

-- --------------------------------------------------------
-- STEP 11: Seed Programs (using the category IDs we just inserted)
-- --------------------------------------------------------
INSERT INTO public.programs (
  title_en, title_ur, slug, desc_en, desc_ur,
  category_id, status, is_featured, sort_order,
  stats_beneficiaries, stats_projects, stats_volunteers
)
SELECT
  'Bright Futures Scholarship',
  'روشن مستقبل اسکالرشپ',
  'bright-futures-scholarship',
  'Providing scholarships to underprivileged students across Pakistan to ensure no talented student is left behind due to financial constraints.',
  'پاکستان بھر میں محروم طلباء کو وظائف فراہم کرنا تاکہ کوئی بھی ذہین طالب علم مالی مجبوریوں کی وجہ سے پیچھے نہ رہے۔',
  pc.id, 'active', true, 1,
  1200, 5, 45
FROM public.program_categories pc WHERE pc.slug = 'education'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.programs (
  title_en, title_ur, slug, desc_en, desc_ur,
  category_id, status, is_featured, sort_order,
  stats_beneficiaries, stats_projects, stats_volunteers
)
SELECT
  'Digital Skills Academy',
  'ڈیجیٹل مہارت اکیڈمی',
  'digital-skills-academy',
  'Free computer literacy and digital skills training for youth and women in underserved communities.',
  'کم سہولت یافتہ کمیونٹیز میں نوجوانوں اور خواتین کے لیے مفت کمپیوٹر خواندگی اور ڈیجیٹل مہارت کی تربیت۔',
  pc.id, 'active', false, 2,
  800, 3, 30
FROM public.program_categories pc WHERE pc.slug = 'education'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.programs (
  title_en, title_ur, slug, desc_en, desc_ur,
  category_id, status, is_featured, sort_order,
  stats_beneficiaries, stats_projects, stats_volunteers
)
SELECT
  'Mobile Medical Camps',
  'موبائل طبی کیمپ',
  'mobile-medical-camps',
  'Monthly free medical camps providing checkups, medicines, and specialist consultations to remote villages across Pakistan.',
  'پاکستان کے دور دراز علاقوں میں مفت معائنے، ادویات اور ماہر مشاورت فراہم کرنے والے ماہانہ طبی کیمپ۔',
  pc.id, 'active', true, 1,
  5000, 12, 80
FROM public.program_categories pc WHERE pc.slug = 'health'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.programs (
  title_en, title_ur, slug, desc_en, desc_ur,
  category_id, status, is_featured, sort_order,
  stats_beneficiaries, stats_projects, stats_volunteers
)
SELECT
  'Clean Water Initiative',
  'صاف پانی منصوبہ',
  'clean-water-initiative',
  'Installing water filtration plants and hand pumps in rural communities lacking access to clean drinking water.',
  'دیہی کمیونٹیز میں جہاں صاف پینے کے پانی تک رسائی نہیں وہاں واٹر فلٹریشن پلانٹ اور ہینڈ پمپ نصب کرنا۔',
  pc.id, 'active', false, 2,
  2500, 8, 25
FROM public.program_categories pc WHERE pc.slug = 'health'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.programs (
  title_en, title_ur, slug, desc_en, desc_ur,
  category_id, status, is_featured, sort_order,
  stats_beneficiaries, stats_projects, stats_volunteers
)
SELECT
  'Youth Leadership Program',
  'نوجوان قیادت پروگرام',
  'youth-leadership-program',
  'Building the next generation of community leaders through workshops, mentorship, and hands-on social projects.',
  'ورکشاپس، مینٹورشپ اور عملی سماجی منصوبوں کے ذریعے کمیونٹی قائدین کی اگلی نسل تیار کرنا۔',
  pc.id, 'active', true, 1,
  350, 4, 20
FROM public.program_categories pc WHERE pc.slug = 'youth'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.programs (
  title_en, title_ur, slug, desc_en, desc_ur,
  category_id, status, is_featured, sort_order,
  stats_beneficiaries, stats_projects, stats_volunteers
)
SELECT
  'Community Kitchen',
  'کمیونٹی کچن',
  'community-kitchen',
  'Daily hot meals for the food insecure — a community-run kitchen serving hundreds of families every day.',
  'کھانے سے محروم لوگوں کے لیے روزانہ گرم کھانا — ایک کمیونٹی کچن جو روزانہ سینکڑوں خاندانوں کو کھانا فراہم کرتا ہے۔',
  pc.id, 'active', true, 1,
  1800, 2, 60
FROM public.program_categories pc WHERE pc.slug = 'community'
ON CONFLICT (slug) DO NOTHING;

-- --------------------------------------------------------
-- STEP 12: Seed Impact Stats (if table is empty)
-- --------------------------------------------------------
INSERT INTO public.impact_stats (label_en, label_ur, value, suffix, icon, color, sort_order)
SELECT * FROM (VALUES
  ('Beneficiaries Served', 'مستفید افراد', 12000, '+', 'Users', 'teal', 1),
  ('Programs Active', 'فعال پروگرامز', 6, '', 'BookOpen', 'navy', 2),
  ('Volunteers', 'رضاکار', 250, '+', 'Heart', 'gold', 3),
  ('Communities Reached', 'کمیونٹیز', 35, '+', 'MapPin', 'teal', 4)
) AS v(label_en, label_ur, value, suffix, icon, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.impact_stats LIMIT 1);

-- --------------------------------------------------------
-- DONE
-- --------------------------------------------------------
-- After running this script:
-- 1. Go to iocaworld.org/admin/programs — you should see 6 programs
-- 2. Go to iocaworld.org/programs — you should see the public programs grid
-- 3. Go to iocaworld.org/admin/programs?tab=categories — you should see 4 categories
-- ============================================================
