-- Search Enhancements Migration
-- Migration: 20251203000000_search_enhancements.sql
-- Adds full-text search capabilities and search history tracking
-- ---
-- PART 1: FULL-TEXT SEARCH INDEXES
-- ---
-- Add full-text search columns to hospitals table
ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update hospital search vector
CREATE OR REPLACE FUNCTION update_hospital_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.hospital_name_english, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.hospital_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.address, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.hospital_details::text, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.services, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search vector
DROP TRIGGER IF EXISTS hospital_search_vector_update ON hospitals;
CREATE TRIGGER hospital_search_vector_update
  BEFORE INSERT OR UPDATE ON hospitals
  FOR EACH ROW
  EXECUTE FUNCTION update_hospital_search_vector();

-- Update existing hospitals
UPDATE hospitals SET search_vector = NULL WHERE search_vector IS NULL;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_hospitals_search_vector ON hospitals USING GIN(search_vector);

-- Add full-text search columns to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update article search vector
CREATE OR REPLACE FUNCTION update_article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search vector
DROP TRIGGER IF EXISTS article_search_vector_update ON articles;
CREATE TRIGGER article_search_vector_update
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_article_search_vector();

-- Update existing articles
UPDATE articles SET search_vector = NULL WHERE search_vector IS NULL;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_articles_search_vector ON articles USING GIN(search_vector);
-- ---
-- PART 2: SEARCH HISTORY TABLE
-- ---
-- Create search_history table
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Search query and filters
  query TEXT NOT NULL,
  search_type TEXT, -- 'hospitals', 'articles', 'all'
  
  -- Filters applied
  filters JSONB DEFAULT '{}'::jsonb, -- { price_min, price_max, location, sort_by, etc. }
  
  -- Results metadata
  total_results INTEGER DEFAULT 0,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for search history
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history USING gin(to_tsvector('english', query));

-- Enable RLS on search_history
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own search history
CREATE POLICY "Users can view own search history"
  ON search_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own search history
CREATE POLICY "Users can insert own search history"
  ON search_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own search history
CREATE POLICY "Users can delete own search history"
  ON search_history
  FOR DELETE
  USING (auth.uid() = user_id);
-- ---
-- PART 3: HELPER FUNCTIONS FOR SEARCH
-- ---
-- Function to calculate distance between two coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371; -- Earth's radius in kilometers
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get hospital popularity (based on appointment count)
CREATE OR REPLACE FUNCTION get_hospital_popularity(hospital_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  booking_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO booking_count
  FROM appointments
  WHERE hospital_id = hospital_id_param
    AND status = 'confirmed';
  
  RETURN COALESCE(booking_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get hospital min/max price
CREATE OR REPLACE FUNCTION get_hospital_price_range(hospital_id_param UUID)
RETURNS TABLE (
  min_price DECIMAL,
  max_price DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    MIN(gp.price) as min_price,
    MAX(gp.price) as max_price
  FROM hospital_packages gp
  WHERE gp.hospital_id = hospital_id_param
    AND gp.is_active = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_hospital_popularity(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_hospital_price_range(UUID) TO authenticated, anon;

COMMENT ON FUNCTION calculate_distance IS 'Calculate distance in kilometers between two coordinates using Haversine formula';
COMMENT ON FUNCTION get_hospital_popularity IS 'Get hospital popularity based on confirmed appointment count';
COMMENT ON FUNCTION get_hospital_price_range IS 'Get min and max price for a hospital from active packages';
