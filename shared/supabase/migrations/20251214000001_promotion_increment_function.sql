-- Promotion Increment Usage Function
-- Migration: 20251214000001_promotion_increment_function.sql
-- Creates a function to safely increment promotion usage count
-- ---
-- PART 1: CREATE FUNCTION
-- ---
CREATE OR REPLACE FUNCTION increment_promotion_uses(promotion_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE promotions
  SET current_uses = COALESCE(current_uses, 0) + 1,
      updated_at = TIMEZONE('utc', NOW())
  WHERE id = promotion_id
    AND (max_uses IS NULL OR current_uses < max_uses)
    AND is_active = true;
END;
$$;

-- Add comment
COMMENT ON FUNCTION increment_promotion_uses IS 'Safely increments the current_uses count for a promotion. Only increments if promotion is active and has not reached max_uses.';

