-- ─────────────────────────────────────────────────────────
-- Migration: Forms Module v2
-- Changes:
--   - form_status enum: added 'published', 'scheduled'; migrates 'active' → 'published'
--   - form_type enum: new (registration | survey | feedback | custom)
--   - forms.type column: new, defaults to 'custom'
--   - forms.share_token column: new, unique text, for public share links
--   - form_responses.metadata: new jsonb column for extra submission data
-- ─────────────────────────────────────────────────────────

-- ── 1. Migrate form_status enum ───────────────────────────
-- Create the replacement enum with the full set of values
CREATE TYPE form_status_v2 AS ENUM ('draft', 'published', 'closed', 'scheduled');

-- Drop default so we can cast the column type
ALTER TABLE forms ALTER COLUMN status DROP DEFAULT;

-- Cast existing values, mapping legacy 'active' → 'published'
ALTER TABLE forms
  ALTER COLUMN status TYPE form_status_v2
  USING (
    CASE status::text
      WHEN 'active' THEN 'published'::form_status_v2
      ELSE status::text::form_status_v2
    END
  );

-- Restore default using the new type
ALTER TABLE forms ALTER COLUMN status SET DEFAULT 'draft'::form_status_v2;

-- Swap enum names
DROP TYPE form_status;
ALTER TYPE form_status_v2 RENAME TO form_status;

-- ── 2. Create form_type enum ──────────────────────────────
DO $$ BEGIN
  CREATE TYPE form_type AS ENUM ('registration', 'survey', 'feedback', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. Add new columns to forms ───────────────────────────
ALTER TABLE forms
  ADD COLUMN IF NOT EXISTS type        form_type NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- ── 4. Add metadata column to form_responses ─────────────
ALTER TABLE form_responses
  ADD COLUMN IF NOT EXISTS metadata JSONB;
