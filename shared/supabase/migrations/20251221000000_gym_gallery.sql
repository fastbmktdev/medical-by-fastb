-- =============================================
-- hospital Gallery Management System
-- =============================================
-- This migration creates a dedicated gallery system for hospital images
-- with support for featured images, ordering, and metadata

-- Create hospital_gallery table
CREATE TABLE IF NOT EXISTS hospital_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Path in Supabase storage for deletion
  title TEXT,
  description TEXT,
  alt_text TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  file_size INTEGER, -- In bytes
  width INTEGER,
  height INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Constraints
  CONSTRAINT valid_mime_type CHECK (mime_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hospital_gallery_hospital_id ON hospital_gallery(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_gallery_featured ON hospital_gallery(hospital_id, is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_hospital_gallery_order ON hospital_gallery(hospital_id, display_order);
CREATE INDEX IF NOT EXISTS idx_hospital_gallery_created_at ON hospital_gallery(created_at DESC);

-- Enable RLS
ALTER TABLE hospital_gallery ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow public to view images
CREATE POLICY "Public can view hospital gallery images"
  ON hospital_gallery FOR SELECT
  TO public
  USING (true);

-- Allow hospital owners to insert images
CREATE POLICY "hospital owners can insert gallery images"
  ON hospital_gallery FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = hospital_gallery.hospital_id
      AND hospitals.user_id = auth.uid()
    )
  );

-- Allow hospital owners to update their images
CREATE POLICY "hospital owners can update gallery images"
  ON hospital_gallery FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = hospital_gallery.hospital_id
      AND hospitals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = hospital_gallery.hospital_id
      AND hospitals.user_id = auth.uid()
    )
  );

-- Allow hospital owners to delete their images
CREATE POLICY "hospital owners can delete gallery images"
  ON hospital_gallery FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = hospital_gallery.hospital_id
      AND hospitals.user_id = auth.uid()
    )
  );

-- Allow admins full access
CREATE POLICY "Admins have full access to gallery"
  ON hospital_gallery FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create function to ensure only one featured image per hospital
CREATE OR REPLACE FUNCTION ensure_single_featured_image()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting an image as featured
  IF NEW.is_featured = true THEN
    -- Unset other featured images for this hospital
    UPDATE hospital_gallery
    SET is_featured = false
    WHERE hospital_id = NEW.hospital_id
      AND id != NEW.id
      AND is_featured = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for featured image management
CREATE TRIGGER trigger_ensure_single_featured_image
  BEFORE INSERT OR UPDATE ON hospital_gallery
  FOR EACH ROW
  WHEN (NEW.is_featured = true)
  EXECUTE FUNCTION ensure_single_featured_image();

-- Create function to automatically set display_order
CREATE OR REPLACE FUNCTION set_gallery_display_order()
RETURNS TRIGGER AS $$
BEGIN
  -- If display_order is not set, set it to max + 1
  IF NEW.display_order = 0 OR NEW.display_order IS NULL THEN
    NEW.display_order := COALESCE(
      (SELECT MAX(display_order) + 1 FROM hospital_gallery WHERE hospital_id = NEW.hospital_id),
      1
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic display_order
CREATE TRIGGER trigger_set_gallery_display_order
  BEFORE INSERT ON hospital_gallery
  FOR EACH ROW
  EXECUTE FUNCTION set_gallery_display_order();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hospital_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_hospital_gallery_updated_at
  BEFORE UPDATE ON hospital_gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_hospital_gallery_updated_at();

-- Create view for gallery with hospital info
CREATE OR REPLACE VIEW hospital_gallery_with_hospital AS
SELECT 
  gg.*,
  g.hospital_name,
  g.slug,
  g.status as hospital_status
FROM hospital_gallery gg
JOIN hospitals g ON g.id = gg.hospital_id
ORDER BY gg.hospital_id, gg.display_order;

-- Backward compatibility alias
CREATE OR REPLACE VIEW hospital_gallery_with_gym AS
SELECT * FROM hospital_gallery_with_hospital;

-- Grant access to views
GRANT SELECT ON hospital_gallery_with_hospital TO authenticated, anon;
GRANT SELECT ON hospital_gallery_with_gym TO authenticated, anon;

-- Add comment
COMMENT ON TABLE hospital_gallery IS 'Stores individual hospital images with metadata for gallery management';
COMMENT ON COLUMN hospital_gallery.is_featured IS 'Only one image per hospital should be featured at a time';
COMMENT ON COLUMN hospital_gallery.display_order IS 'Order in which images are displayed (lower numbers first)';
COMMENT ON COLUMN hospital_gallery.storage_path IS 'Full path in Supabase storage for cleanup';

