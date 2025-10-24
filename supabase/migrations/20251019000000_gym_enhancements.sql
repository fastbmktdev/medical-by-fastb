-- Gym Enhancements Migration
-- Consolidates: add_gym_public_fields.sql, remove_unique_user_gym.sql, add_slug_generation.sql
-- This migration adds public-facing fields, removes constraints, and implements slug generation

-- ============================================================================
-- STEP 1: Add public-facing fields to gyms table
-- ============================================================================

-- Add public-facing fields to gyms table for /gyms page
ALTER TABLE gyms
ADD COLUMN IF NOT EXISTS gym_name_english TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS gym_details JSONB,
ADD COLUMN IF NOT EXISTS "short_description" TEXT,
ADD COLUMN IF NOT EXISTS "location" TEXT,
ADD COLUMN IF NOT EXISTS "gym_type" TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS map_url TEXT,
ADD COLUMN IF NOT EXISTS socials TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Remove rating column and its constraints
ALTER TABLE gyms
DROP COLUMN IF EXISTS rating;

-- ============================================================================
-- STEP 2: Remove unique constraint for multiple gyms per user
-- ============================================================================

-- Remove unique constraint that prevents one user from having multiple gyms
-- This allows system user to create multiple approved gyms for display
ALTER TABLE gyms DROP CONSTRAINT IF EXISTS unique_user_gym;

-- ============================================================================
-- STEP 3: Implement slug generation system
-- ============================================================================

-- Function to generate slug from English name
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special characters
  slug := lower(text_input);
  slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');
  slug := regexp_replace(slug, '\s+', '-', 'g');
  slug := regexp_replace(slug, '-+', '-', 'g');
  slug := trim(both '-' from slug);
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to ensure unique slug
CREATE OR REPLACE FUNCTION ensure_unique_slug(base_slug TEXT, gym_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  final_slug := base_slug;
  
  -- Check if slug exists (excluding current gym if updating)
  WHILE EXISTS (
    SELECT 1 FROM gyms 
    WHERE slug = final_slug 
    AND (gym_id IS NULL OR id != gym_id)
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate slug before insert/update
CREATE OR REPLACE FUNCTION auto_generate_gym_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
BEGIN
  -- Only generate if slug is empty or null
  -- and gym_name_english exists
  IF (NEW.slug IS NULL OR NEW.slug = '') AND NEW.gym_name_english IS NOT NULL AND NEW.gym_name_english != '' THEN
    base_slug := generate_slug(NEW.gym_name_english);
    NEW.slug := ensure_unique_slug(base_slug, NEW.id);
  -- If gym_name_english is empty but gym_name exists, use gym_name as fallback
  ELSIF (NEW.slug IS NULL OR NEW.slug = '') AND NEW.gym_name IS NOT NULL THEN
    base_slug := generate_slug(NEW.gym_name);
    NEW.slug := ensure_unique_slug(base_slug, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_generate_gym_slug ON gyms;

-- Create trigger
CREATE TRIGGER trigger_auto_generate_gym_slug
  BEFORE INSERT OR UPDATE ON gyms
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_gym_slug();

-- ============================================================================
-- STEP 4: Create indexes and constraints
-- ============================================================================

-- Create index for approved gyms
CREATE INDEX IF NOT EXISTS idx_gyms_approved ON gyms(status) WHERE status = 'approved';

-- Create index for slug
CREATE INDEX IF NOT EXISTS idx_gyms_slug ON gyms(slug);

-- ============================================================================
-- STEP 5: Populate existing records and finalize constraints
-- ============================================================================

-- Update existing gyms to have slugs
UPDATE gyms 
SET slug = ensure_unique_slug(
  generate_slug(
    COALESCE(gym_name_english, gym_name)
  ),
  id
)
WHERE slug IS NULL OR slug = '';

-- Make slug NOT NULL and UNIQUE after populating existing records
ALTER TABLE gyms 
ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint for slug (matches original migration behavior)
ALTER TABLE gyms 
ADD CONSTRAINT gyms_slug_unique UNIQUE (slug);

-- ============================================================================
-- STEP 6: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE gyms IS 'Gyms table - users can own multiple gyms (unique constraint removed)';

COMMENT ON COLUMN gyms.gym_name_english IS 'English name of the gym for international visitors';
COMMENT ON COLUMN gyms.address IS 'Full address for public display';
COMMENT ON COLUMN gyms.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN gyms.longitude IS 'GPS longitude coordinate';
COMMENT ON COLUMN gyms.map_url IS 'Google Maps or similar map URL';
COMMENT ON COLUMN gyms.socials IS 'Social media links (JSON or comma-separated)';
COMMENT ON COLUMN gyms.gym_details IS 'Detailed information about the gym';
COMMENT ON COLUMN gyms."short_description" IS 'Brief summary of the gym';
COMMENT ON COLUMN gyms."location" IS 'General area or city';
COMMENT ON COLUMN gyms."gym_type" IS 'Type of gym (e.g., Traditional, Modern, Fitness)';
COMMENT ON COLUMN gyms.slug IS 'URL-friendly identifier for gym pages';

COMMENT ON FUNCTION generate_slug(TEXT) IS 'Generates URL-friendly slug from input text';
COMMENT ON FUNCTION ensure_unique_slug(TEXT, UUID) IS 'Ensures slug is unique by appending counter if needed';
COMMENT ON FUNCTION auto_generate_gym_slug() IS 'Trigger function to auto-generate slug from gym_name_english or gym_name';