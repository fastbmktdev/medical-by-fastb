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
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Remove rating column and its constraints
ALTER TABLE gyms
DROP COLUMN IF EXISTS rating;

-- Create index for approved gyms
CREATE INDEX IF NOT EXISTS idx_gyms_approved ON gyms(status) WHERE status = 'approved';

-- Create index for slug
CREATE INDEX IF NOT EXISTS idx_gyms_slug ON gyms(slug);

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
