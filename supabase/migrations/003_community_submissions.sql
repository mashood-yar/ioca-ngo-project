-- ============================================================
-- Migration 003: Community Submission System
-- Creates staging tables for public story and testimonial submissions
-- ============================================================

-- Table 1: impact_story_submissions
CREATE TABLE IF NOT EXISTS public.impact_story_submissions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_name      TEXT NOT NULL,
  submitter_email     TEXT NOT NULL,
  submitter_phone     TEXT,
  submitter_location  TEXT,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title_en            TEXT NOT NULL,
  title_ur            TEXT,
  story_en            TEXT NOT NULL,
  story_ur            TEXT,
  excerpt_en          TEXT,
  excerpt_ur          TEXT,
  category            TEXT DEFAULT 'General',
  image_url           TEXT,
  image_public_id     TEXT,
  program_name        TEXT,
  year_of_impact      INTEGER,
  consent_to_publish  BOOLEAN NOT NULL DEFAULT false,
  consent_to_edit     BOOLEAN NOT NULL DEFAULT false,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes         TEXT,
  rejection_reason    TEXT,
  reviewed_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  published_story_id  UUID REFERENCES public.impact_stories(id) ON DELETE SET NULL,
  submitted_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.impact_story_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'impact_submission_public_insert' AND tablename = 'impact_story_submissions') THEN
    CREATE POLICY "impact_submission_public_insert"
      ON public.impact_story_submissions FOR INSERT
      WITH CHECK (consent_to_publish = true AND length(trim(submitter_name)) > 1 AND length(trim(story_en)) >= 100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_impact_submissions_status ON public.impact_story_submissions (status);
CREATE INDEX IF NOT EXISTS idx_impact_submissions_submitted_at ON public.impact_story_submissions (submitted_at DESC);

-- Table 2: testimonial_submissions
CREATE TABLE IF NOT EXISTS public.testimonial_submissions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_name            TEXT NOT NULL,
  submitter_email           TEXT NOT NULL,
  submitter_phone           TEXT,
  submitter_location        TEXT NOT NULL,
  user_id                   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  quote_en                  TEXT NOT NULL,
  quote_ur                  TEXT,
  photo_url                 TEXT,
  photo_public_id           TEXT,
  display_initial           VARCHAR(1),
  display_name              TEXT,
  bg_color                  TEXT DEFAULT 'white',
  consent_to_publish        BOOLEAN NOT NULL DEFAULT false,
  consent_to_use_photo      BOOLEAN DEFAULT false,
  status                    TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes               TEXT,
  rejection_reason          TEXT,
  reviewed_by               UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at               TIMESTAMPTZ,
  sort_order                INTEGER DEFAULT 0,
  published_testimonial_id  UUID REFERENCES public.testimonials(id) ON DELETE SET NULL,
  submitted_at              TIMESTAMPTZ DEFAULT NOW(),
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.testimonial_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'testimonial_submission_public_insert' AND tablename = 'testimonial_submissions') THEN
    CREATE POLICY "testimonial_submission_public_insert"
      ON public.testimonial_submissions FOR INSERT
      WITH CHECK (consent_to_publish = true AND length(trim(submitter_name)) > 1 AND length(trim(quote_en)) >= 30);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_testimonial_submissions_status ON public.testimonial_submissions (status);
CREATE INDEX IF NOT EXISTS idx_testimonial_submissions_submitted_at ON public.testimonial_submissions (submitted_at DESC);
