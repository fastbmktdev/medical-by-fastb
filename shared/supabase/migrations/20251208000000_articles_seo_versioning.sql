-- Articles SEO, Scheduling, and Versioning Migration
-- Migration: 20251208000000_articles_seo_versioning.sql
-- Adds SEO fields, scheduling, and content versioning to articles
-- ---
-- PART 1: ADD SEO FIELDS TO ARTICLES TABLE
-- ---
-- Add SEO fields to articles table
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS meta_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS og_image TEXT,
  ADD COLUMN IF NOT EXISTS og_title TEXT,
  ADD COLUMN IF NOT EXISTS og_description TEXT,
  ADD COLUMN IF NOT EXISTS twitter_card TEXT DEFAULT 'summary_large_image',
  ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- Add content scheduling field
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMP WITH TIME ZONE;

-- Add index for scheduled articles
CREATE INDEX IF NOT EXISTS idx_articles_scheduled ON articles(scheduled_publish_at)
  WHERE scheduled_publish_at IS NOT NULL AND is_published = FALSE;
-- ---
-- PART 2: ARTICLE VERSIONS TABLE
-- ---
-- Create article_versions table for content versioning
CREATE TABLE IF NOT EXISTS article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  change_summary TEXT,
  
  CONSTRAINT unique_article_version UNIQUE(article_id, version_number)
);

-- Indexes for article_versions
CREATE INDEX IF NOT EXISTS idx_article_versions_article ON article_versions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_versions_number ON article_versions(article_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_article_versions_created ON article_versions(created_at DESC);

-- Function to auto-increment version number
CREATE OR REPLACE FUNCTION get_next_article_version(article_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version_number) FROM article_versions WHERE article_id = article_uuid),
    0
  ) + 1;
END;
$$ LANGUAGE plpgsql;
-- ---
-- PART 3: ROW LEVEL SECURITY POLICIES
-- ---
-- Article versions policies
CREATE POLICY "Anyone can view article versions"
  ON article_versions FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authors can create versions of own articles"
  ON article_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM articles
      WHERE id = article_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all article versions"
  ON article_versions FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
-- ---
-- PART 4: TRIGGER TO CREATE VERSION ON UPDATE
-- ---
-- Function to create version before update (optional - can be called manually)
CREATE OR REPLACE FUNCTION create_article_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Only create version if content changed
  IF OLD.title IS DISTINCT FROM NEW.title OR
     OLD.excerpt IS DISTINCT FROM NEW.excerpt OR
     OLD.content IS DISTINCT FROM NEW.content OR
     OLD.category IS DISTINCT FROM NEW.category OR
     OLD.image IS DISTINCT FROM NEW.image OR
     OLD.tags IS DISTINCT FROM NEW.tags OR
     OLD.meta_title IS DISTINCT FROM NEW.meta_title OR
     OLD.meta_description IS DISTINCT FROM NEW.meta_description THEN
    
    next_version := get_next_article_version(NEW.id);
    
    INSERT INTO article_versions (
      article_id,
      version_number,
      title,
      excerpt,
      content,
      category,
      image,
      tags,
      meta_title,
      meta_description,
      meta_keywords,
      created_by
    ) VALUES (
      NEW.id,
      next_version,
      OLD.title,
      OLD.excerpt,
      OLD.content,
      OLD.category,
      OLD.image,
      OLD.tags,
      OLD.meta_title,
      OLD.meta_description,
      OLD.meta_keywords,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Trigger is commented out by default to allow manual version creation
-- Uncomment if you want automatic versioning on every update
-- CREATE TRIGGER article_version_trigger
--   BEFORE UPDATE ON articles
--   FOR EACH ROW
--   EXECUTE FUNCTION create_article_version();
