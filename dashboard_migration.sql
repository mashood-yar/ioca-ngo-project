-- ==============================================================================
-- MIGRATION SCRIPT: Dashboard Roles & Onboarding
-- Run this script in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Profiles Table Updates
-- Change the default role for new signups to 'supporter'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'supporter';

-- Add new columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_volunteer BOOLEAN DEFAULT FALSE;

-- Update existing profiles that might have defaulted to 'member' incorrectly
-- (Only updates profiles that do NOT have a corresponding members record)
UPDATE public.profiles 
SET role = 'supporter' 
WHERE role = 'member' 
AND id NOT IN (SELECT user_id FROM public.members WHERE user_id IS NOT NULL);

-- 2. Volunteers Table Updates
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS profile_image_public_id TEXT;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS father_name TEXT;

-- 3. Applications Table Updates (for Members)
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS profile_image_public_id TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS father_name TEXT;

-- 4. Members Table Updates (for approved Members)
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
