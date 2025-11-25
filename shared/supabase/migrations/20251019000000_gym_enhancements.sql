-- hospital Enhancements Migration
-- Consolidates: add_hospital_public_fields.sql, remove_unique_user_hospital.sql, add_slug_generation.sql
-- This migration adds public-facing fields, removes constraints, and implements slug generation
-- ---
-- STEP 1: Add public-facing fields to hospitals table
-- ---
-- Add public-facing fields to hospitals table for /hospitals page
ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS hospital_name_english TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS hospital_details JSONB,
ADD COLUMN IF NOT EXISTS "short_description" TEXT,
ADD COLUMN IF NOT EXISTS "location" TEXT,
ADD COLUMN IF NOT EXISTS "hospital_type" TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS map_url TEXT,
ADD COLUMN IF NOT EXISTS socials TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Remove rating column and its constraints
ALTER TABLE hospitals
DROP COLUMN IF EXISTS rating;
-- ---
-- STEP 2: Remove unique constraint for multiple hospitals per user
-- ---
-- Remove unique constraint that prevents one user from having multiple hospitals
-- This allows system user to create multiple approved hospitals for display
ALTER TABLE hospitals DROP CONSTRAINT IF EXISTS unique_user_gym;
ALTER TABLE hospitals DROP CONSTRAINT IF EXISTS unique_user_hospital;
-- ---
-- STEP 3: Implement slug generation system
-- ---
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
CREATE OR REPLACE FUNCTION ensure_unique_slug(base_slug TEXT, hospital_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  final_slug := base_slug;
  
  -- Check if slug exists (excluding current hospital if updating)
  WHILE EXISTS (
    SELECT 1 FROM hospitals 
    WHERE slug = final_slug 
    AND (hospital_id IS NULL OR id != hospital_id)
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate slug before insert/update
CREATE OR REPLACE FUNCTION auto_generate_hospital_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
BEGIN
  -- Only generate if slug is empty or null
  -- and hospital_name_english exists
  IF (NEW.slug IS NULL OR NEW.slug = '') AND NEW.hospital_name_english IS NOT NULL AND NEW.hospital_name_english != '' THEN
    base_slug := generate_slug(NEW.hospital_name_english);
    NEW.slug := ensure_unique_slug(base_slug, NEW.id);
  -- If hospital_name_english is empty but hospital_name exists, use hospital_name as fallback
  ELSIF (NEW.slug IS NULL OR NEW.slug = '') AND NEW.hospital_name IS NOT NULL THEN
    base_slug := generate_slug(NEW.hospital_name);
    NEW.slug := ensure_unique_slug(base_slug, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_generate_hospital_slug ON hospitals;

-- Create trigger
CREATE TRIGGER trigger_auto_generate_hospital_slug
  BEFORE INSERT OR UPDATE ON hospitals
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_hospital_slug();
-- ---
-- STEP 4: Create indexes and constraints
-- ---
-- Create index for approved hospitals
CREATE INDEX IF NOT EXISTS idx_hospitals_approved ON hospitals(status) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_gyms_approved ON hospitals(status) WHERE status = 'approved'; -- Backward compatibility

-- Create index for slug
CREATE INDEX IF NOT EXISTS idx_hospitals_slug ON hospitals(slug);
CREATE INDEX IF NOT EXISTS idx_gyms_slug ON hospitals(slug); -- Backward compatibility
-- ---
-- STEP 5: Populate existing records and finalize constraints
-- ---
-- Update existing hospitals to have slugs
UPDATE hospitals 
SET slug = ensure_unique_slug(
  generate_slug(
    COALESCE(hospital_name_english, hospital_name)
  ),
  id
)
WHERE slug IS NULL OR slug = '';

-- Make slug NOT NULL and UNIQUE after populating existing records
ALTER TABLE hospitals 
ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint for slug (matches original migration behavior)
ALTER TABLE hospitals 
ADD CONSTRAINT hospitals_slug_unique UNIQUE (slug);
-- Note: If gyms_slug_unique exists, it will be dropped by the above if it conflicts
-- ---
-- STEP 6: Add comments for documentation
-- ---
COMMENT ON TABLE hospitals IS 'hospitals table - users can own multiple hospitals (unique constraint removed)';

COMMENT ON COLUMN hospitals.hospital_name_english IS 'English name of the hospital for international visitors';
COMMENT ON COLUMN hospitals.address IS 'Full address for public display';
COMMENT ON COLUMN hospitals.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN hospitals.longitude IS 'GPS longitude coordinate';
COMMENT ON COLUMN hospitals.map_url IS 'Google Maps or similar map URL';
COMMENT ON COLUMN hospitals.socials IS 'Social media links (JSON or comma-separated)';
COMMENT ON COLUMN hospitals.hospital_details IS 'Detailed information about the hospital';
COMMENT ON COLUMN hospitals."short_description" IS 'Brief summary of the hospital';
COMMENT ON COLUMN hospitals."location" IS 'General area or city';
COMMENT ON COLUMN hospitals."hospital_type" IS 'Type of hospital (e.g., Traditional, Modern, Specialized)';
COMMENT ON COLUMN hospitals.slug IS 'URL-friendly identifier for hospital pages';

COMMENT ON FUNCTION generate_slug(TEXT) IS 'Generates URL-friendly slug from input text';
COMMENT ON FUNCTION ensure_unique_slug(TEXT, UUID) IS 'Ensures slug is unique by appending counter if needed';
COMMENT ON FUNCTION auto_generate_hospital_slug() IS 'Trigger function to auto-generate slug from hospital_name_english or hospital_name';
