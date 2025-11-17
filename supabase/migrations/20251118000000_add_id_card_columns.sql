-- Add ID Card columns to gyms table
-- For storing both watermarked and original versions of ID cards

ALTER TABLE gyms
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS id_card_original_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN gyms.id_card_url IS 'URL of ID card with watermark (for public display and verification)';
COMMENT ON COLUMN gyms.id_card_original_url IS 'URL of original ID card without watermark (stored securely, admin access only)';

