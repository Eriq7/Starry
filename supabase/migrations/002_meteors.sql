-- 002_meteors.sql
--
-- Creates the `meteors` table for the Meteor Shower Messages feature (Sprint 15).
--
-- This table stores user-submitted anonymous wishes/reflections that appear as
-- shooting stars on the /meteors page. Inserts go through the service-role key
-- (bypasses RLS); public reads are allowed for visible (is_hidden = false) rows.

CREATE TABLE IF NOT EXISTS meteors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  display_name  text NOT NULL,
  message       text NOT NULL,
  category      text NOT NULL CHECK (category IN ('wish', 'reflection', 'warmth')),
  event_date    text,
  is_hidden     boolean DEFAULT false NOT NULL,
  created_at    timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS meteors_created_at_idx ON meteors(created_at DESC);
CREATE INDEX IF NOT EXISTS meteors_is_hidden_idx ON meteors(is_hidden);

-- RLS: public read for visible meteors; inserts use service-role key (no insert policy needed)
ALTER TABLE meteors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meteors_select_visible" ON meteors FOR SELECT USING (is_hidden = false);
