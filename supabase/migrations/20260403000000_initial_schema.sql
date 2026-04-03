-- Phase 1: Database Layer
-- Creates all 5 tables, RLS policies, and card-images storage bucket

-- respondents (identity-only, no demographic data)
CREATE TABLE respondents (
  respondent_id INTEGER PRIMARY KEY
);

-- genres (10 rows, pipe-delimited categories)
CREATE TABLE genres (
  genre_slug TEXT PRIMARY KEY,
  genre_name TEXT NOT NULL,
  genre_categories TEXT NOT NULL
);

-- respondent_genre_interest (120 rows, 12 respondents x 10 genres)
-- interest_level: 1 = highest interest, 5 = none (inverted scale)
CREATE TABLE respondent_genre_interest (
  respondent_id INTEGER REFERENCES respondents(respondent_id),
  genre_slug TEXT REFERENCES genres(genre_slug),
  interest_level INTEGER NOT NULL CHECK (interest_level BETWEEN 1 AND 5),
  PRIMARY KEY (respondent_id, genre_slug)
);

-- audiences (named segments defined by filter rules)
CREATE TABLE audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  filter_definition JSONB NOT NULL,
  respondent_ids INTEGER[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- saved_outputs (campaign concepts and personas)
CREATE TABLE saved_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  output_type TEXT NOT NULL CHECK (output_type IN ('campaign_concept', 'persona')),
  audience_id UUID REFERENCES audiences(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  rya_score INTEGER CHECK (rya_score BETWEEN 1 AND 10),
  rya_rationale TEXT,
  channel TEXT,
  genre_signals_used JSONB NOT NULL,
  card_image_url TEXT,
  card_image_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: permissive policies (no auth in scope)
ALTER TABLE respondents ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE respondent_genre_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON respondents FOR ALL USING (true);
CREATE POLICY "allow_all" ON genres FOR ALL USING (true);
CREATE POLICY "allow_all" ON respondent_genre_interest FOR ALL USING (true);
CREATE POLICY "allow_all" ON audiences FOR ALL USING (true);
CREATE POLICY "allow_all" ON saved_outputs FOR ALL USING (true);

-- Storage: card-images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-images', 'card-images', true);

CREATE POLICY "allow_all" ON storage.objects
  FOR ALL USING (bucket_id = 'card-images');
