-- Promotion Conditions Migration
-- Migration: 20251214000000_promotion_conditions.sql
-- Adds additional condition fields to promotions table for coupon code system
-- ---
-- PART 1: ADD CONDITION FIELDS
-- ---
-- Add first_time_user_only column (boolean - promotion only for first-time users)
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS first_time_user_only BOOLEAN NOT NULL DEFAULT FALSE;

-- Add applicable_product_ids column (array of product IDs - promotion applies to specific products)
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS applicable_product_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Add applicable_hospital_ids column (array of hospital IDs - promotion applies to specific hospitals)
-- Note: hospital_id already exists for partner promotions, but this allows multiple hospitals
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS applicable_hospital_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Add free_shipping column (boolean - promotion includes free shipping)
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT FALSE;

-- ---
-- PART 2: ADD INDEXES FOR PERFORMANCE
-- ---
-- Index for querying promotions by product IDs
CREATE INDEX IF NOT EXISTS idx_promotions_applicable_products 
  ON promotions USING GIN(applicable_product_ids) 
  WHERE array_length(applicable_product_ids, 1) > 0;

-- Index for querying promotions by hospital IDs
CREATE INDEX IF NOT EXISTS idx_promotions_applicable_hospitals 
  ON promotions USING GIN(applicable_hospital_ids) 
  WHERE array_length(applicable_hospital_ids, 1) > 0;
CREATE INDEX IF NOT EXISTS idx_promotions_applicable_gyms 
  ON promotions USING GIN(applicable_hospital_ids) 
  WHERE array_length(applicable_hospital_ids, 1) > 0; -- Backward compatibility

-- Index for first-time user promotions
CREATE INDEX IF NOT EXISTS idx_promotions_first_time_user 
  ON promotions(is_active, first_time_user_only) 
  WHERE is_active = true AND first_time_user_only = true;

-- Index for free shipping promotions
CREATE INDEX IF NOT EXISTS idx_promotions_free_shipping 
  ON promotions(is_active, free_shipping) 
  WHERE is_active = true AND free_shipping = true;

-- ---
-- PART 3: ADD COMMENTS FOR DOCUMENTATION
-- ---
COMMENT ON COLUMN promotions.first_time_user_only IS 'If true, this promotion can only be used by first-time users (users with no previous orders)';
COMMENT ON COLUMN promotions.applicable_product_ids IS 'Array of product IDs this promotion applies to. Empty array means applies to all products';
COMMENT ON COLUMN promotions.applicable_hospital_ids IS 'Array of hospital IDs this promotion applies to. Empty array means applies to all hospitals. Note: hospital_id field is for partner-created promotions';
COMMENT ON COLUMN promotions.free_shipping IS 'If true, this promotion includes free shipping';

-- ---
-- PART 4: ADD VALIDATION CONSTRAINTS
-- ---
-- Ensure applicable_product_ids and applicable_hospital_ids are not null (default to empty array)
ALTER TABLE promotions
  ALTER COLUMN applicable_product_ids SET DEFAULT ARRAY[]::UUID[],
  ALTER COLUMN applicable_hospital_ids SET DEFAULT ARRAY[]::UUID[];

