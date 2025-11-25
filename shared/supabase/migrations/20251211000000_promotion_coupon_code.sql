-- Promotion Coupon Code Migration
-- Migration: 20251211000000_promotion_coupon_code.sql
-- Adds coupon_code field to promotions table for coupon-based promotions
-- ---
-- PART 1: ADD COUPON CODE FIELD
-- ---
-- Add coupon_code column (nullable - unique when set)
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Add index for coupon code lookups
CREATE INDEX IF NOT EXISTS idx_promotions_coupon_code 
  ON promotions(coupon_code) 
  WHERE coupon_code IS NOT NULL;

-- Add unique constraint for coupon codes (only one promotion can have a specific coupon code)
CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_coupon_code_unique 
  ON promotions(coupon_code) 
  WHERE coupon_code IS NOT NULL;

-- Add comment
COMMENT ON COLUMN promotions.coupon_code IS 'Coupon code for this promotion. Users must enter this code to apply the discount. NULL means no coupon required (automatic promotion).';

