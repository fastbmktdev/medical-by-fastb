-- appointment Promotion Fields Migration
-- Migration: 20251105000001_booking_promotion_fields.sql
-- Adds promotion_id and discount_amount fields to appointments table
-- ---
-- PART 1: ADD PROMOTION FIELDS TO appointments TABLE
-- ---
-- Add promotion_id column (nullable - reference to promotions table)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL;

-- Add discount_amount column (nullable - amount discounted from original price)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) CHECK (discount_amount IS NULL OR discount_amount >= 0);

-- ---
-- PART 2: ADD INDEXES FOR PERFORMANCE
-- ---
-- Index for querying appointments by promotion
CREATE INDEX IF NOT EXISTS idx_bookings_promotion_id 
  ON appointments(promotion_id) 
  WHERE promotion_id IS NOT NULL;

-- ---
-- PART 3: ADD COMMENTS FOR DOCUMENTATION
-- ---
COMMENT ON COLUMN appointments.promotion_id IS 'Reference to promotion used for this appointment. NULL if no promotion was used.';
COMMENT ON COLUMN appointments.discount_amount IS 'Amount discounted from original package price. NULL if no promotion was used.';

