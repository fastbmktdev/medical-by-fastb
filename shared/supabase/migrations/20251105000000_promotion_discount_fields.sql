-- Promotion Discount Fields Migration
-- Migration: 20251105000000_promotion_discount_fields.sql
-- Adds discount calculation fields to promotions table for partner promotion discount system
-- ---
-- PART 1: CREATE DISCOUNT TYPE ENUM
-- ---
-- Create enum for discount type
CREATE TYPE discount_type AS ENUM (
  'percentage',
  'fixed_amount'
);

COMMENT ON TYPE discount_type IS 'Type of discount: percentage (ส่วนลดเป็นเปอร์เซ็นต์) or fixed_amount (ส่วนลดเป็นจำนวนเงินคงที่)';
-- ---
-- PART 2: ADD DISCOUNT FIELDS TO PROMOTIONS TABLE
-- ---
-- Add discount_type column
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS discount_type discount_type;

-- Add discount_value column (DECIMAL for percentage or fixed amount)
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2) CHECK (discount_value >= 0);

-- Add package_id column (nullable - NULL means applicable to all packages)
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES hospital_packages(id) ON DELETE SET NULL;

-- Add min_purchase_amount column (nullable - minimum purchase required to use promotion)
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS min_purchase_amount DECIMAL(10, 2) CHECK (min_purchase_amount IS NULL OR min_purchase_amount >= 0);

-- Add max_discount_amount column (nullable - maximum discount amount for percentage discounts)
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS max_discount_amount DECIMAL(10, 2) CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0);

-- Add max_uses column (nullable - maximum number of times promotion can be used)
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0);

-- Add current_uses column (default 0 - tracks how many times promotion has been used)
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS current_uses INTEGER NOT NULL DEFAULT 0 CHECK (current_uses >= 0);

-- ---
-- PART 3: ADD INDEXES FOR PERFORMANCE
-- ---
-- Note: Index with hospital_id will be added in a later migration when hospital_id column is added
-- Index for querying active promotions with discount by package
CREATE INDEX IF NOT EXISTS idx_promotions_discount_active 
  ON promotions(package_id, is_active, discount_type) 
  WHERE is_active = true AND discount_type IS NOT NULL;

-- Index for querying promotions by package_id
CREATE INDEX IF NOT EXISTS idx_promotions_package_id 
  ON promotions(package_id) 
  WHERE package_id IS NOT NULL;

-- Index for checking available promotions (not exceeded max_uses)
CREATE INDEX IF NOT EXISTS idx_promotions_available_uses 
  ON promotions(is_active, max_uses, current_uses) 
  WHERE is_active = true AND discount_type IS NOT NULL;

-- ---
-- PART 4: ADD COMMENTS FOR DOCUMENTATION
-- ---
COMMENT ON COLUMN promotions.discount_type IS 'Type of discount: percentage or fixed_amount. NULL means no discount (display-only promotion)';
COMMENT ON COLUMN promotions.discount_value IS 'Discount value: percentage (0-100) for percentage type, or fixed amount for fixed_amount type';
COMMENT ON COLUMN promotions.package_id IS 'Specific package this promotion applies to. NULL means applicable to all packages for the hospital';
COMMENT ON COLUMN promotions.min_purchase_amount IS 'Minimum purchase amount required to use this promotion. NULL means no minimum';
COMMENT ON COLUMN promotions.max_discount_amount IS 'Maximum discount amount (for percentage discounts). NULL means no maximum';
COMMENT ON COLUMN promotions.max_uses IS 'Maximum number of times this promotion can be used. NULL means unlimited';
COMMENT ON COLUMN promotions.current_uses IS 'Current number of times this promotion has been used. Defaults to 0';

-- ---
-- PART 5: ADD VALIDATION CONSTRAINTS
-- ---
-- Ensure discount_value is set when discount_type is set
ALTER TABLE promotions
  ADD CONSTRAINT check_discount_fields_consistency 
  CHECK (
    (discount_type IS NULL AND discount_value IS NULL) OR
    (discount_type IS NOT NULL AND discount_value IS NOT NULL)
  );

-- Ensure percentage discount_value is between 0 and 100
ALTER TABLE promotions
  ADD CONSTRAINT check_percentage_range 
  CHECK (
    discount_type != 'percentage' OR 
    (discount_value >= 0 AND discount_value <= 100)
  );

-- Ensure current_uses doesn't exceed max_uses
ALTER TABLE promotions
  ADD CONSTRAINT check_uses_limit 
  CHECK (
    max_uses IS NULL OR 
    current_uses <= max_uses
  );

