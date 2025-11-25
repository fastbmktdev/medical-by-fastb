-- ---
-- Migration: Update social platform naming from Twitter to X
-- ---

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'valid_platform'
      AND table_name = 'user_social_links'
  ) THEN
    ALTER TABLE user_social_links
      DROP CONSTRAINT valid_platform;
  END IF;
END $$;

UPDATE user_social_links
SET platform = 'x'
WHERE platform = 'twitter';

ALTER TABLE user_social_links
  ADD CONSTRAINT valid_platform
  CHECK (platform IN ('facebook', 'instagram', 'x', 'youtube', 'tiktok'));

