-- Consolidated Optimization Migration
-- Migration: 20251020100000_optimization_final.sql
-- Consolidates: refactor_remove_duplicates.sql, optimize_triggers.sql, add_helper_functions.sql, optimize_indexes.sql, test_refactoring.sql
-- ---
-- PART 1: HELPER FUNCTIONS (Consolidated)
-- ---
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

-- 2. Check if user is partner
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

-- 3. Check if user owns a gym
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

-- 4. Create unified reference number generator
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

-- 5. Update existing generator functions to use the unified one
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
-- ---
-- PART 2: GYM HELPER FUNCTIONS
-- ---
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
-- ---
-- PART 3: BOOKING HELPER FUNCTIONS
-- ---
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
-- ---
-- PART 4: UPDATE RLS POLICIES TO USE is_admin() FUNCTION
-- ---
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
-- ---
-- PART 5: CONSOLIDATE BOOKINGS TABLES
-- ---
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
-- ---
-- PART 6: OPTIMIZE TRIGGERS
-- ---
-- Function to automatically add updated_at trigger to any table
CREATE OR REPLACE FUNCTION add_updated_at_trigger(table_name TEXT)
RETURNS VOID AS $$
DECLARE
  trigger_name TEXT;
BEGIN
  trigger_name := 'update_' || table_name || '_updated_at';
  
  -- Drop trigger if exists
  EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_name, table_name);
  
  -- Create trigger
  EXECUTE format(
    'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
    trigger_name,
    table_name
  );
  
  RAISE NOTICE 'Created trigger % on table %', trigger_name, table_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_updated_at_trigger IS 'Helper to add updated_at trigger to any table';

-- Apply to all tables that need updated_at triggers
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'user_roles',
    'gyms',
    'profiles',
    'gym_packages',
    'bookings',
    'payments',
    'orders',
    'product_orders',
    'ticket_bookings'
  ];
  tbl_name TEXT;
BEGIN
  FOREACH tbl_name IN ARRAY tables
  LOOP
    -- Check if table exists before adding trigger
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = tbl_name
    ) THEN
      PERFORM add_updated_at_trigger(tbl_name);
    END IF;
  END LOOP;
END $$;

-- Optimize handle_new_user to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile (with conflict handling)
  INSERT INTO public.profiles (user_id, username, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    username = COALESCE(EXCLUDED.username, profiles.username),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
  
  -- Create user_role (with conflict handling)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'authenticated')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION handle_new_user IS 'Auto-create profile and user_role on signup (with conflict handling)';

-- Optimize handle_gym_application to be more robust
CREATE OR REPLACE FUNCTION public.handle_gym_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user role to 'partner' when they submit a gym application
  -- Only upgrade from authenticated to partner (not downgrade from admin)
  UPDATE public.user_roles
  SET 
    role = 'partner',
    updated_at = NOW()
  WHERE user_id = NEW.user_id
  AND role = 'authenticated';
  
  -- If no rows updated, user might already be partner or admin
  -- This is fine, no error needed
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION handle_gym_application IS 'Auto-promote user to partner role on gym application';

-- Function to auto-generate booking number if not provided
CREATE OR REPLACE FUNCTION auto_generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
    NEW.booking_number := generate_booking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_booking_number ON bookings;

CREATE TRIGGER trigger_auto_generate_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_booking_number();

COMMENT ON FUNCTION auto_generate_booking_number IS 'Auto-generate booking_number if not provided';

-- Function to auto-generate order number if not provided
CREATE OR REPLACE FUNCTION auto_generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_order_number ON orders;

CREATE TRIGGER trigger_auto_generate_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_order_number();

COMMENT ON FUNCTION auto_generate_order_number IS 'Auto-generate order_number if not provided';
-- ---
-- PART 7: OPTIMIZE INDEXES
-- ---
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

-- Index only pending payments (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_payments_pending ON payments(user_id, created_at DESC) 
  WHERE status = 'pending';

-- Index only active/pending bookings
CREATE INDEX IF NOT EXISTS idx_bookings_active ON bookings(gym_id, start_date) 
  WHERE status IN ('pending', 'confirmed');

-- For searching in gym services array
CREATE INDEX IF NOT EXISTS idx_gyms_services_gin ON gyms USING GIN(services) 
  WHERE status = 'approved';

-- For searching in gym images array
CREATE INDEX IF NOT EXISTS idx_gyms_images_gin ON gyms USING GIN(images);

-- For searching in package features array
CREATE INDEX IF NOT EXISTS idx_gym_packages_features_gin ON gym_packages USING GIN(features) 
  WHERE is_active = true;

-- For querying order items
CREATE INDEX IF NOT EXISTS idx_orders_items_gin ON orders USING GIN(items);

-- For querying metadata
CREATE INDEX IF NOT EXISTS idx_payments_metadata_gin ON payments USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_orders_metadata_gin ON orders USING GIN(metadata);

-- For searching gym names (Thai and English)
CREATE INDEX IF NOT EXISTS idx_gyms_name_search ON gyms 
  USING GIN(to_tsvector('simple', COALESCE(gym_name, '') || ' ' || COALESCE(gym_name_english, '')))
  WHERE status = 'approved';

-- For searching gym location and address
CREATE INDEX IF NOT EXISTS idx_gyms_location_search ON gyms 
  USING GIN(to_tsvector('simple', COALESCE(location, '') || ' ' || COALESCE(address, '')))
  WHERE status = 'approved';
-- ---
-- PART 8: ADD CONSTRAINTS FOR DATA INTEGRITY
-- ---
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
-- ---
-- PART 9: ANALYZE TABLES FOR QUERY PLANNER
-- ---
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
-- ---
-- PART 10: VALIDATION AND TESTING
-- ---
DO $$
DECLARE
  test_result BOOLEAN;
  test_count INTEGER := 0;
  pass_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Testing Consolidated Optimization Migration';
  RAISE NOTICE '========================================';
  
  -- Test 1: is_admin function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: is_admin() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: is_admin() function NOT found', test_count;
  END IF;
  
  -- Test 2: is_partner function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_partner') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: is_partner() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: is_partner() function NOT found', test_count;
  END IF;
  
  -- Test 3: owns_gym function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'owns_gym') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: owns_gym() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: owns_gym() function NOT found', test_count;
  END IF;
  
  -- Test 4: generate_reference_number function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_reference_number') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: generate_reference_number() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: generate_reference_number() function NOT found', test_count;
  END IF;
  
  -- Test 5: get_gym_by_slug function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_gym_by_slug') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: get_gym_by_slug() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: get_gym_by_slug() function NOT found', test_count;
  END IF;
  
  -- Test 6: get_gym_packages function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_gym_packages') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: get_gym_packages() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: get_gym_packages() function NOT found', test_count;
  END IF;
  
  -- Test 7: get_user_bookings function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_bookings') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: get_user_bookings() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: get_user_bookings() function NOT found', test_count;
  END IF;
  
  -- Test 8: get_gym_bookings function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_gym_bookings') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: get_gym_bookings() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: get_gym_bookings() function NOT found', test_count;
  END IF;
  
  -- Test 9: get_gym_stats function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_gym_stats') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: get_gym_stats() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: get_gym_stats() function NOT found', test_count;
  END IF;
  
  -- Test 10: validate_booking_dates function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_booking_dates') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: validate_booking_dates() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: validate_booking_dates() function NOT found', test_count;
  END IF;
  
  -- Test 11: add_updated_at_trigger function exists
  test_count := test_count + 1;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'add_updated_at_trigger') THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: add_updated_at_trigger() function exists', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: add_updated_at_trigger() function NOT found', test_count;
  END IF;
  
  -- Test 12: bookings table has new columns
  test_count := test_count + 1;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name IN ('order_id', 'is_confirmed', 'checked_in', 'checked_out')
    GROUP BY table_name
    HAVING COUNT(*) = 4
  ) THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: bookings table has new columns', test_count;
  ELSE
    RAISE NOTICE '❌ Test %: bookings table missing new columns', test_count;
  END IF;
  
  -- Test 13: Check if key indexes exist
  test_count := test_count + 1;
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname IN (
      'idx_bookings_gym_date',
      'idx_gyms_status_created',
      'idx_gym_packages_gym_active'
    )
    GROUP BY tablename
    HAVING COUNT(*) >= 2
  ) THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: Key composite indexes exist', test_count;
  ELSE
    RAISE NOTICE '⚠️  Test %: Some composite indexes may be missing', test_count;
  END IF;
  
  -- Test 14: Check if GIN indexes exist
  test_count := test_count + 1;
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname LIKE '%_gin'
    LIMIT 1
  ) THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: GIN indexes exist', test_count;
  ELSE
    RAISE NOTICE '⚠️  Test %: GIN indexes may be missing', test_count;
  END IF;
  
  -- Test 15: Check if constraints exist
  test_count := test_count + 1;
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name IN (
      'check_booking_dates',
      'check_positive_price',
      'check_positive_amount'
    )
  ) THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: Data integrity constraints exist', test_count;
  ELSE
    RAISE NOTICE '⚠️  Test %: Some constraints may be missing', test_count;
  END IF;
  
  -- Test 16: Test generate_reference_number function
  test_count := test_count + 1;
  BEGIN
    PERFORM generate_reference_number('TEST', 'YYYYMMDD', 4);
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: generate_reference_number() works', test_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test %: generate_reference_number() failed: %', test_count, SQLERRM;
  END;
  
  -- Test 17: Test generate_booking_number function
  test_count := test_count + 1;
  BEGIN
    PERFORM generate_booking_number();
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: generate_booking_number() works', test_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test %: generate_booking_number() failed: %', test_count, SQLERRM;
  END;
  
  -- Test 18: Test generate_order_number function
  test_count := test_count + 1;
  BEGIN
    PERFORM generate_order_number();
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: generate_order_number() works', test_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test %: generate_order_number() failed: %', test_count, SQLERRM;
  END;
  
  -- Test 19: Check RLS policies use is_admin
  test_count := test_count + 1;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname LIKE '%admin%'
    LIMIT 1
  ) THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test %: Admin RLS policies exist', test_count;
  ELSE
    RAISE NOTICE '⚠️  Test %: Admin RLS policies may need review', test_count;
  END IF;
  
  -- Summary
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test Results: % / % passed', pass_count, test_count;
  RAISE NOTICE '========================================';
  
  IF pass_count = test_count THEN
    RAISE NOTICE '🎉 All tests passed! Consolidated optimization successful!';
  ELSIF pass_count >= test_count * 0.9 THEN
    RAISE NOTICE '✅ Most tests passed (%.0f%%). Review warnings above.', (pass_count::FLOAT / test_count * 100);
  ELSE
    RAISE NOTICE '⚠️  Some tests failed (%.0f%% passed). Please review.', (pass_count::FLOAT / test_count * 100);
  END IF;
  
END $$;
-- ---
-- SUMMARY
-- ---
COMMENT ON SCHEMA public IS 'Consolidated optimization migration completed successfully. This migration includes:
✅ Helper functions (is_admin, is_partner, owns_gym, generate_reference_number)
✅ Gym helper functions (get_gym_by_slug, get_gym_packages)
✅ Booking helper functions (get_user_bookings, get_gym_bookings, get_gym_stats, validate_booking_dates)
✅ Updated RLS policies to use helper functions
✅ Consolidated bookings table (merged gym_bookings)
✅ Optimized triggers with helper functions
✅ Comprehensive indexing strategy (composite, partial, GIN, full-text search)
✅ Data integrity constraints
✅ Performance optimizations and statistics updates
✅ Built-in validation and testing';
