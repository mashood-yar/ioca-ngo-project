-- 1. Create program_categories table
CREATE TABLE IF NOT EXISTS public.program_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ur TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon_svg TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.program_categories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Categories are viewable by everyone" ON public.program_categories FOR SELECT USING (true);

-- Admin write access (Assuming admins bypass RLS or we use service role in API)
CREATE POLICY "Categories are insertable by admin" ON public.program_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Categories are updatable by admin" ON public.program_categories FOR UPDATE USING (true);
CREATE POLICY "Categories are deletable by admin" ON public.program_categories FOR DELETE USING (true);

-- 2. Insert default categories (with proper Urdu translations from frontend mockData/labels)
INSERT INTO public.program_categories (name_en, name_ur, slug, sort_order, icon_svg) VALUES
('Education', 'تعلیم', 'education', 1, '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>'),
('Health', 'صحت', 'health', 2, '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'),
('Youth Empowerment', 'نوجوانوں کی ترقی', 'youth', 3, '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>'),
('Community Bonding', 'عوامی تعلقات', 'community_bonding', 4, '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>')
ON CONFLICT (slug) DO NOTHING;

-- 3. Alter programs table
ALTER TABLE public.programs 
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.program_categories(id),
  ADD COLUMN IF NOT EXISTS stats_beneficiaries INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_projects INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_volunteers INTEGER DEFAULT 0;

-- 4. Map existing categories
UPDATE public.programs p
SET category_id = c.id
FROM public.program_categories c
WHERE p.category::text = c.slug;

-- 5. Drop old enum category column
ALTER TABLE public.programs DROP COLUMN IF EXISTS category;

-- 6. Update schema.sql definition for program_categories and programs so they persist on reset
