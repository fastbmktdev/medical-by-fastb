-- Add ID Card columns to hospitals table
-- For storing both watermarked and original versions of ID cards

ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS id_card_original_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN hospitals.id_card_url IS 'URL of ID card with watermark (for public display and verification)';
COMMENT ON COLUMN hospitals.id_card_original_url IS 'URL of original ID card without watermark (stored securely, admin access only)';

