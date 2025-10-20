-- Optimize: Add missing indexes and remove redundant ones
-- Migration: 20251020100003_optimize_indexes.sql

-- ============================================================================
-- ANALYZE EXISTING INDEXES AND ADD MISSING ONES
-- ============================================================================

-- Profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles((user_id)) WHERE user_id IS NOT NULL;

-- User roles table (already has idx_user_roles_role)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role);

-- Gyms table - composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_gyms_status_created ON gyms(status, created_at DESC) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_gyms_user_status ON gyms(user_id, status);
CREATE INDEX IF NOT EXISTS idx_gyms_location ON gyms(location) WHERE status = 'approved';

-- Gym packages - composite indexes
CREATE INDEX IF NOT EXISTS idx_gym_packages_gym_active ON gym_packages(gym_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gym_packages_type_active ON gym_packages(package_type, is_active) WHERE is_active = true;

-- Bookings - composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_gym_status ON bookings(gym_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_gym_date ON bookings(gym_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status) WHERE payment_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);

-- Payments table
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_type_status ON payments(payment_type, status);

-- Orders table
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_status ON orders(created_at DESC, status);

-- Product orders
CREATE INDEX IF NOT EXISTS idx_product_orders_product ON product_orders(product_id);

-- Ticket bookings
CREATE INDEX IF NOT EXISTS idx_ticket_bookings_event ON ticket_bookings(event_id, event_date);
CREATE INDEX IF NOT EXISTS idx_ticket_bookings_date ON ticket_bookings(event_date) WHERE event_date >= CURRENT_DATE;

-- ============================================================================
-- ADD PARTIAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index only pending payments (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_payments_pending ON payments(user_id, created_at DESC) 
  WHERE status = 'pending';

-- Index only active/pending bookings
CREATE INDEX IF NOT EXISTS idx_bookings_active ON bookings(gym_id, start_date) 
  WHERE status IN ('pending', 'confirmed');

-- Index only future bookings
CREATE INDEX IF NOT EXISTS idx_bookings_future ON bookings(user_id, start_date) 
  WHERE start_date >= CURRENT_DATE;

-- ============================================================================
-- ADD GIN INDEXES FOR ARRAY COLUMNS
-- ============================================================================

-- For searching in gym services array
CREATE INDEX IF NOT EXISTS idx_gyms_services_gin ON gyms USING GIN(services) 
  WHERE status = 'approved';

-- For searching in gym images array
CREATE INDEX IF NOT EXISTS idx_gyms_images_gin ON gyms USING GIN(images);

-- For searching in package features array
CREATE INDEX IF NOT EXISTS idx_gym_packages_features_gin ON gym_packages USING GIN(features) 
  WHERE is_active = true;

-- ============================================================================
-- ADD INDEXES FOR JSONB COLUMNS
-- ============================================================================

-- For querying order items
CREATE INDEX IF NOT EXISTS idx_orders_items_gin ON orders USING GIN(items);

-- For querying metadata
CREATE INDEX IF NOT EXISTS idx_payments_metadata_gin ON payments USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_orders_metadata_gin ON orders USING GIN(metadata);

-- ============================================================================
-- ADD TEXT SEARCH INDEXES
-- ============================================================================

-- For searching gym names (Thai and English)
CREATE INDEX IF NOT EXISTS idx_gyms_name_search ON gyms 
  USING GIN(to_tsvector('simple', COALESCE(gym_name, '') || ' ' || COALESCE(gym_name_english, '')))
  WHERE status = 'approved';

-- For searching gym location and address
CREATE INDEX IF NOT EXISTS idx_gyms_location_search ON gyms 
  USING GIN(to_tsvector('simple', COALESCE(location, '') || ' ' || COALESCE(address, '')))
  WHERE status = 'approved';

-- ============================================================================
-- REMOVE REDUNDANT INDEXES (if they exist)
-- ============================================================================

-- These might be redundant if composite indexes cover them
-- Only drop if the composite index is more useful

-- Check and document which indexes might be redundant:
-- idx_gyms_status might be redundant with idx_gyms_status_created
-- idx_gym_packages_type might be redundant with idx_gym_packages_type_active
-- idx_bookings_status might be redundant with idx_bookings_user_status

-- We keep them for now as they might be used by different queries
-- Can be dropped after analyzing query patterns in production

-- ============================================================================
-- ADD CONSTRAINTS FOR DATA INTEGRITY
-- ============================================================================

-- Ensure booking dates are logical
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_booking_dates;
ALTER TABLE bookings ADD CONSTRAINT check_booking_dates 
  CHECK (end_date IS NULL OR end_date >= start_date);

-- Ensure package prices are positive
ALTER TABLE gym_packages DROP CONSTRAINT IF EXISTS check_positive_price;
ALTER TABLE gym_packages ADD CONSTRAINT check_positive_price 
  CHECK (price > 0);

-- Ensure booking prices are positive
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_positive_price_paid;
ALTER TABLE bookings ADD CONSTRAINT check_positive_price_paid 
  CHECK (price_paid >= 0);

-- Ensure payment amounts are positive
ALTER TABLE payments DROP CONSTRAINT IF EXISTS check_positive_amount;
ALTER TABLE payments ADD CONSTRAINT check_positive_amount 
  CHECK (amount > 0);

-- Ensure order amounts are positive
ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_positive_total;
ALTER TABLE orders ADD CONSTRAINT check_positive_total 
  CHECK (total_amount >= 0);

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

-- Update statistics for better query planning
ANALYZE user_roles;
ANALYZE profiles;
ANALYZE gyms;
ANALYZE gym_packages;
ANALYZE bookings;
ANALYZE payments;
ANALYZE orders;
ANALYZE product_orders;
ANALYZE ticket_bookings;

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- This migration:
-- ✅ Added composite indexes for common query patterns
-- ✅ Added partial indexes for frequently filtered data
-- ✅ Added GIN indexes for array and JSONB columns
-- ✅ Added full-text search indexes for gym search
-- ✅ Added data integrity constraints
-- ✅ Analyzed tables for query planner optimization
--
-- Performance improvements:
-- - Faster gym searches by location/name
-- - Faster booking queries by date ranges
-- - Faster filtering by status fields
-- - Better support for array/JSON queries

