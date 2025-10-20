-- Refactor: Remove duplicate code and consolidate functions
-- Migration: 20251020100000_refactor_remove_duplicates.sql

-- ============================================================================
-- HELPER FUNCTIONS (Consolidated)
-- ============================================================================

-- 1. Create reusable admin check function
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated, anon;

COMMENT ON FUNCTION is_admin IS 'Check if user has admin role. Reusable across all RLS policies.';

-- 2. Create unified reference number generator
CREATE OR REPLACE FUNCTION generate_reference_number(
  prefix TEXT,
  date_format TEXT DEFAULT 'YYYYMMDD',
  random_digits INTEGER DEFAULT 4
)
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  random_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), date_format);
  
  LOOP
    random_part := LPAD(FLOOR(RANDOM() * POWER(10, random_digits))::TEXT, random_digits, '0');
    new_number := prefix || date_part || random_part;
    
    -- Check uniqueness across all tables that might use this
    IF NOT EXISTS (
      SELECT 1 FROM bookings WHERE booking_number = new_number
      UNION ALL
      SELECT 1 FROM orders WHERE order_number = new_number
    ) THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION generate_reference_number(TEXT, TEXT, INTEGER) TO authenticated;

COMMENT ON FUNCTION generate_reference_number IS 'Unified function to generate unique reference numbers with custom prefix';

-- 3. Update existing generator functions to use the unified one
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
BEGIN
  RETURN generate_reference_number('BK', 'YYYYMM', 4);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN generate_reference_number('ORD-', 'YYYYMMDD-', 4);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE RLS POLICIES TO USE is_admin() FUNCTION
-- ============================================================================

-- Drop old admin policies
DROP POLICY IF EXISTS "admins_can_manage_all_gyms" ON gyms;
DROP POLICY IF EXISTS "admins_can_manage_all_packages" ON gym_packages;
DROP POLICY IF EXISTS "admins_can_manage_all_bookings" ON bookings;
DROP POLICY IF EXISTS "admins_can_view_all_payments" ON payments;
DROP POLICY IF EXISTS "admins_can_view_all_orders" ON orders;
DROP POLICY IF EXISTS "admins_can_update_all_orders" ON orders;

-- Recreate with simplified is_admin() function
CREATE POLICY "admins_can_manage_all_gyms"
  ON gyms FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admins_can_manage_all_packages"
  ON gym_packages FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admins_can_manage_all_bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admins_can_view_all_payments"
  ON payments FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "admins_can_view_all_orders"
  ON orders FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "admins_can_update_all_orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- CONSOLIDATE BOOKINGS TABLES
-- ============================================================================

-- Add missing columns to bookings table to replace gym_bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS checked_out BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMP WITH TIME ZONE;

-- Create index for order_id
CREATE INDEX IF NOT EXISTS idx_bookings_order_id ON bookings(order_id);

-- Add comments
COMMENT ON COLUMN bookings.order_id IS 'Link to payment order (if paid through orders system)';
COMMENT ON COLUMN bookings.is_confirmed IS 'Whether booking is confirmed by gym owner';
COMMENT ON COLUMN bookings.checked_in IS 'Whether customer has checked in';
COMMENT ON COLUMN bookings.checked_out IS 'Whether customer has checked out';

-- Migrate data from gym_bookings to bookings (if gym_bookings exists and has data)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gym_bookings') THEN
    -- Insert gym_bookings data into bookings
    INSERT INTO bookings (
      user_id,
      gym_id,
      package_id,
      booking_number,
      customer_name,
      customer_email,
      customer_phone,
      start_date,
      end_date,
      price_paid,
      package_name,
      package_type,
      duration_months,
      special_requests,
      payment_status,
      status,
      order_id,
      is_confirmed,
      confirmed_at,
      checked_in,
      checked_in_at,
      checked_out,
      checked_out_at,
      created_at,
      updated_at
    )
    SELECT
      gb.user_id,
      gb.gym_id,
      NULL, -- package_id might not exist in gym_bookings
      generate_booking_number(),
      COALESCE(o.customer_name, p.full_name, 'Unknown'),
      COALESCE(o.customer_email, u.email, 'unknown@example.com'),
      COALESCE(o.customer_phone, p.phone, ''),
      gb.start_date,
      gb.end_date,
      gb.total_price,
      gb.package_name,
      gb.package_type,
      EXTRACT(MONTH FROM AGE(gb.end_date, gb.start_date))::INTEGER,
      gb.notes,
      CASE 
        WHEN o.status IN ('completed', 'confirmed') THEN 'paid'
        WHEN o.status = 'canceled' THEN 'failed'
        ELSE 'pending'
      END,
      CASE
        WHEN gb.is_confirmed THEN 'confirmed'
        WHEN gb.checked_out THEN 'completed'
        ELSE 'pending'
      END,
      gb.order_id,
      gb.is_confirmed,
      gb.confirmed_at,
      gb.checked_in,
      gb.checked_in_at,
      gb.checked_out,
      gb.checked_out_at,
      gb.created_at,
      gb.updated_at
    FROM gym_bookings gb
    LEFT JOIN orders o ON o.id = gb.order_id
    LEFT JOIN auth.users u ON u.id = gb.user_id
    LEFT JOIN profiles p ON p.user_id = gb.user_id
    WHERE NOT EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.order_id = gb.order_id 
      AND b.user_id = gb.user_id
      AND b.start_date = gb.start_date
    );
    
    RAISE NOTICE 'Migrated data from gym_bookings to bookings';
  END IF;
END $$;

-- Drop gym_bookings table if it exists (after migration)
DROP TABLE IF EXISTS gym_bookings CASCADE;

COMMENT ON TABLE bookings IS 'Unified bookings table for all gym reservations (consolidated from gym_bookings)';

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- This migration:
-- ✅ Created is_admin() helper function (eliminates duplicate EXISTS checks)
-- ✅ Created generate_reference_number() unified function
-- ✅ Updated all admin RLS policies to use is_admin()
-- ✅ Consolidated bookings and gym_bookings into single table
-- ✅ Migrated existing gym_bookings data
-- ✅ Removed duplicate table

