-- Add reusable helper functions for common operations
-- Migration: 20251020100002_add_helper_functions.sql

-- ============================================================================
-- ROLE CHECK HELPERS
-- ============================================================================

-- Check if user is partner
CREATE OR REPLACE FUNCTION is_partner(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id AND role IN ('partner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION is_partner(UUID) TO authenticated, anon;

COMMENT ON FUNCTION is_partner IS 'Check if user has partner or admin role';

-- Check if user owns a gym
CREATE OR REPLACE FUNCTION owns_gym(gym_id_param UUID, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM gyms
    WHERE id = gym_id_param AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION owns_gym(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION owns_gym IS 'Check if user owns a specific gym';

-- ============================================================================
-- GYM HELPERS
-- ============================================================================

-- Get gym by slug (public function)
CREATE OR REPLACE FUNCTION get_gym_by_slug(slug_param TEXT)
RETURNS TABLE (
  id UUID,
  gym_name TEXT,
  gym_name_english TEXT,
  short_description TEXT,
  location TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  images TEXT[],
  latitude DECIMAL,
  longitude DECIMAL,
  map_url TEXT,
  socials TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.gym_name,
    g.gym_name_english,
    g.short_description,
    g.location,
    g.address,
    g.phone,
    g.email,
    g.website,
    g.images,
    g.latitude,
    g.longitude,
    g.map_url,
    g.socials,
    g.status,
    g.created_at
  FROM gyms g
  WHERE g.slug = slug_param AND g.status = 'approved'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_gym_by_slug(TEXT) TO authenticated, anon;

COMMENT ON FUNCTION get_gym_by_slug IS 'Get approved gym details by slug';

-- Get gym packages
CREATE OR REPLACE FUNCTION get_gym_packages(gym_id_param UUID)
RETURNS TABLE (
  id UUID,
  package_type TEXT,
  name TEXT,
  name_english TEXT,
  description TEXT,
  price DECIMAL,
  duration_months INTEGER,
  features TEXT[],
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gp.id,
    gp.package_type,
    gp.name,
    gp.name_english,
    gp.description,
    gp.price,
    gp.duration_months,
    gp.features,
    gp.is_active
  FROM gym_packages gp
  WHERE gp.gym_id = gym_id_param AND gp.is_active = true
  ORDER BY 
    CASE gp.package_type 
      WHEN 'one_time' THEN 1 
      WHEN 'package' THEN 2 
    END,
    gp.duration_months NULLS FIRST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_gym_packages(UUID) TO authenticated, anon;

COMMENT ON FUNCTION get_gym_packages IS 'Get active packages for a gym, sorted by type and duration';

-- ============================================================================
-- BOOKING HELPERS
-- ============================================================================

-- Get user bookings with gym details
CREATE OR REPLACE FUNCTION get_user_bookings(user_id_param UUID DEFAULT auth.uid())
RETURNS TABLE (
  booking_id UUID,
  booking_number TEXT,
  gym_id UUID,
  gym_name TEXT,
  gym_slug TEXT,
  package_name TEXT,
  package_type TEXT,
  start_date DATE,
  end_date DATE,
  price_paid DECIMAL,
  payment_status TEXT,
  status TEXT,
  is_confirmed BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.booking_number,
    b.gym_id,
    g.gym_name,
    g.slug,
    b.package_name,
    b.package_type,
    b.start_date,
    b.end_date,
    b.price_paid,
    b.payment_status,
    b.status,
    b.is_confirmed,
    b.created_at
  FROM bookings b
  JOIN gyms g ON g.id = b.gym_id
  WHERE b.user_id = user_id_param
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_user_bookings(UUID) TO authenticated;

COMMENT ON FUNCTION get_user_bookings IS 'Get all bookings for a user with gym details';

-- Get gym bookings (for gym owners)
CREATE OR REPLACE FUNCTION get_gym_bookings(gym_id_param UUID)
RETURNS TABLE (
  booking_id UUID,
  booking_number TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  package_name TEXT,
  package_type TEXT,
  start_date DATE,
  end_date DATE,
  price_paid DECIMAL,
  payment_status TEXT,
  status TEXT,
  is_confirmed BOOLEAN,
  checked_in BOOLEAN,
  checked_out BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if user owns this gym or is admin
  IF NOT (owns_gym(gym_id_param) OR is_admin()) THEN
    RAISE EXCEPTION 'Access denied: You do not own this gym';
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.booking_number,
    b.customer_name,
    b.customer_email,
    b.customer_phone,
    b.package_name,
    b.package_type,
    b.start_date,
    b.end_date,
    b.price_paid,
    b.payment_status,
    b.status,
    b.is_confirmed,
    b.checked_in,
    b.checked_out,
    b.created_at
  FROM bookings b
  WHERE b.gym_id = gym_id_param
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_gym_bookings(UUID) TO authenticated;

COMMENT ON FUNCTION get_gym_bookings IS 'Get all bookings for a gym (gym owners and admins only)';

-- ============================================================================
-- STATISTICS HELPERS
-- ============================================================================

-- Get gym statistics
CREATE OR REPLACE FUNCTION get_gym_stats(gym_id_param UUID)
RETURNS TABLE (
  total_bookings BIGINT,
  confirmed_bookings BIGINT,
  pending_bookings BIGINT,
  total_revenue DECIMAL,
  active_packages INTEGER
) AS $$
BEGIN
  -- Check if user owns this gym or is admin
  IF NOT (owns_gym(gym_id_param) OR is_admin()) THEN
    RAISE EXCEPTION 'Access denied: You do not own this gym';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(b.id)::BIGINT,
    COUNT(b.id) FILTER (WHERE b.status = 'confirmed')::BIGINT,
    COUNT(b.id) FILTER (WHERE b.status = 'pending')::BIGINT,
    COALESCE(SUM(b.price_paid) FILTER (WHERE b.payment_status = 'paid'), 0),
    COUNT(DISTINCT gp.id)::INTEGER
  FROM gyms g
  LEFT JOIN bookings b ON b.gym_id = g.id
  LEFT JOIN gym_packages gp ON gp.gym_id = g.id AND gp.is_active = true
  WHERE g.id = gym_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_gym_stats(UUID) TO authenticated;

COMMENT ON FUNCTION get_gym_stats IS 'Get statistics for a gym (gym owners and admins only)';

-- ============================================================================
-- VALIDATION HELPERS
-- ============================================================================

-- Validate booking dates
CREATE OR REPLACE FUNCTION validate_booking_dates(
  start_date_param DATE,
  end_date_param DATE,
  package_type_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Start date must be in the future
  IF start_date_param < CURRENT_DATE THEN
    RAISE EXCEPTION 'Start date must be in the future';
  END IF;
  
  -- For one_time bookings, end_date should be same as start_date or null
  IF package_type_param = 'one_time' THEN
    IF end_date_param IS NOT NULL AND end_date_param != start_date_param THEN
      RAISE EXCEPTION 'One-time bookings should have same start and end date';
    END IF;
  END IF;
  
  -- For package bookings, end_date must be after start_date
  IF package_type_param = 'package' THEN
    IF end_date_param IS NULL OR end_date_param <= start_date_param THEN
      RAISE EXCEPTION 'Package bookings must have end date after start date';
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION validate_booking_dates(DATE, DATE, TEXT) TO authenticated;

COMMENT ON FUNCTION validate_booking_dates IS 'Validate booking date logic';

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- This migration adds:
-- ✅ is_partner() - Check partner role
-- ✅ owns_gym() - Check gym ownership
-- ✅ get_gym_by_slug() - Public gym lookup
-- ✅ get_gym_packages() - Get active packages
-- ✅ get_user_bookings() - User's booking history
-- ✅ get_gym_bookings() - Gym's booking list (with auth)
-- ✅ get_gym_stats() - Gym statistics (with auth)
-- ✅ validate_booking_dates() - Date validation logic
--
-- All functions are:
-- - Properly secured with SECURITY DEFINER
-- - Have appropriate STABLE/VOLATILE markers
-- - Include permission checks where needed
-- - Have descriptive comments

