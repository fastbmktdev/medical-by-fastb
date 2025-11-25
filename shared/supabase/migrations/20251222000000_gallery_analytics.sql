-- =============================================
-- Gallery Analytics System
-- =============================================
-- Track image views and provide analytics for hospital partners

-- Create gallery_analytics table
CREATE TABLE IF NOT EXISTS gallery_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES hospital_gallery(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  unique_view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Ensure one analytics record per image
  CONSTRAINT unique_analytics_per_image UNIQUE (image_id)
);

-- Create gallery_views table for detailed tracking
CREATE TABLE IF NOT EXISTS gallery_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES hospital_gallery(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  viewer_ip TEXT,
  viewer_user_agent TEXT,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referrer TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  session_id TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_analytics_image_id ON gallery_analytics(image_id);
CREATE INDEX IF NOT EXISTS idx_gallery_analytics_hospital_id ON gallery_analytics(hospital_id);
CREATE INDEX IF NOT EXISTS idx_gallery_analytics_view_count ON gallery_analytics(view_count DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_views_image_id ON gallery_views(image_id);
CREATE INDEX IF NOT EXISTS idx_gallery_views_hospital_id ON gallery_views(hospital_id);
CREATE INDEX IF NOT EXISTS idx_gallery_views_viewed_at ON gallery_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_views_session ON gallery_views(session_id, image_id);

-- Enable RLS
ALTER TABLE gallery_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gallery_analytics

-- hospital owners can view their analytics
CREATE POLICY "hospital owners can view analytics"
  ON gallery_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = gallery_analytics.hospital_id
      AND hospitals.user_id = auth.uid()
    )
  );

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
  ON gallery_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for gallery_views

-- hospital owners can view their views
CREATE POLICY "hospital owners can view gallery views"
  ON gallery_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = gallery_views.hospital_id
      AND hospitals.user_id = auth.uid()
    )
  );

-- Admins can view all views
CREATE POLICY "Admins can view all gallery views"
  ON gallery_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Anyone can insert views (for tracking)
CREATE POLICY "Anyone can insert gallery views"
  ON gallery_views FOR INSERT
  TO public
  WITH CHECK (true);

-- Function to record image view
CREATE OR REPLACE FUNCTION record_image_view(
  p_image_id UUID,
  p_hospital_id UUID,
  p_viewer_ip TEXT DEFAULT NULL,
  p_viewer_user_agent TEXT DEFAULT NULL,
  p_viewer_id UUID DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_is_unique BOOLEAN;
BEGIN
  -- Check if this is a unique view (same session hasn't viewed this image before)
  SELECT NOT EXISTS (
    SELECT 1 FROM gallery_views
    WHERE image_id = p_image_id
    AND session_id = p_session_id
    AND viewed_at > NOW() - INTERVAL '24 hours'
  ) INTO v_is_unique;

  -- Insert view record
  INSERT INTO gallery_views (
    image_id,
    hospital_id,
    viewer_ip,
    viewer_user_agent,
    viewer_id,
    referrer,
    session_id
  ) VALUES (
    p_image_id,
    p_hospital_id,
    p_viewer_ip,
    p_viewer_user_agent,
    p_viewer_id,
    p_referrer,
    p_session_id
  );

  -- Update or create analytics record
  INSERT INTO gallery_analytics (
    image_id,
    hospital_id,
    view_count,
    unique_view_count,
    last_viewed_at
  ) VALUES (
    p_image_id,
    p_hospital_id,
    1,
    CASE WHEN v_is_unique THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (image_id) DO UPDATE SET
    view_count = gallery_analytics.view_count + 1,
    unique_view_count = gallery_analytics.unique_view_count + CASE WHEN v_is_unique THEN 1 ELSE 0 END,
    last_viewed_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top viewed images for a hospital
CREATE OR REPLACE FUNCTION get_top_viewed_images(
  p_hospital_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  image_id UUID,
  image_url TEXT,
  title TEXT,
  view_count INTEGER,
  unique_view_count INTEGER,
  last_viewed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ga.image_id,
    gg.image_url,
    gg.title,
    ga.view_count,
    ga.unique_view_count,
    ga.last_viewed_at
  FROM gallery_analytics ga
  JOIN hospital_gallery gg ON gg.id = ga.image_id
  WHERE ga.hospital_id = p_hospital_id
  ORDER BY ga.view_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update analytics updated_at
CREATE OR REPLACE FUNCTION update_gallery_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gallery_analytics_updated_at
  BEFORE UPDATE ON gallery_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_analytics_updated_at();

-- Create view for analytics with image info
CREATE OR REPLACE VIEW gallery_analytics_with_images AS
SELECT
  ga.*,
  gg.image_url,
  gg.title,
  gg.description,
  gg.is_featured,
  gg.display_order,
  g.hospital_name
FROM gallery_analytics ga
JOIN hospital_gallery gg ON gg.id = ga.image_id
JOIN hospitals g ON g.id = ga.hospital_id;

-- Grant access
GRANT SELECT ON gallery_analytics_with_images TO authenticated, anon;

-- Comments
COMMENT ON TABLE gallery_analytics IS 'Aggregated analytics data for gallery images';
COMMENT ON TABLE gallery_views IS 'Individual view records for detailed analytics';
COMMENT ON FUNCTION record_image_view IS 'Records a single image view and updates analytics';
COMMENT ON FUNCTION get_top_viewed_images IS 'Returns most viewed images for a hospital';

