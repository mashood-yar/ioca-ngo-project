-- ============================================================
-- IOCA Database Setup: Grant Permissions + Seed Zones & Tiers
-- Run this script in your Supabase SQL Editor.
-- ============================================================

-- 0. ALTER TABLES TO ENSURE CORRECT COLUMNS
-- Adds the missing 'description' column to public.zones if it doesn't exist
ALTER TABLE public.zones ADD COLUMN IF NOT EXISTS description TEXT;


-- 1. GRANT TABLE PRIVILEGES
-- Ensures the service_role (backend API) and anon/authenticated roles can access all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure future tables also inherit these privileges automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;


-- 2. SEED DEFAULT PROJECTS & ZONES
-- Inserts default regional zones for IOCA
INSERT INTO public.zones (id, name, city, description) VALUES
  ('a5b32f10-1234-5678-90ab-cdef12345678', 'Quetta Zone', 'Quetta', 'Balochistan regional hub supporting community advancement'),
  ('b6c43f21-5678-1234-90ab-cdef56789012', 'Lahore Zone', 'Lahore', 'Punjab regional headquarters and digital skills academy'),
  ('c7d54e32-9012-3456-7890-abcdef012345', 'Karachi Zone', 'Karachi', 'Sindh regional office, health and water initiative operations'),
  ('d8e65a43-3456-7890-1234-abcdef678901', 'Islamabad Zone', 'Islamabad', 'Federal Capital region services and community projects'),
  ('e9f76b54-7890-1234-5678-abcdef234567', 'Peshawar Zone', 'Peshawar', 'KPK regional community welfare and education initiatives')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  city = EXCLUDED.city, 
  description = EXCLUDED.description;


-- 3. SEED DEFAULT MEMBERSHIP TIERS
-- Inserts default membership levels for applying members
INSERT INTO public.tiers (id, name, price, duration_days, is_active) VALUES
  ('f0a87a65-1234-5678-90ab-cdef78901234', 'Basic', 1000, 365, true),
  ('a1b98b76-5678-1234-90ab-cdef89012345', 'Standard', 3000, 365, true),
  ('b2c09c87-9012-3456-7890-abcdef901234', 'Premium', 5000, 365, true),
  ('c3d10d98-3456-7890-1234-abcdef012345', 'Life Member', 25000, 3650, true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  duration_days = EXCLUDED.duration_days,
  is_active = EXCLUDED.is_active;


-- 4. RELOAD SCHEMA CACHE
-- Notifies PostgREST to reload the schema definitions immediately
NOTIFY pgrst, 'reload schema';
