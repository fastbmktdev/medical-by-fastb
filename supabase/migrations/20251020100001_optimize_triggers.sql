-- Optimize: Consolidate trigger creation and ensure idempotency
-- Migration: 20251020100001_optimize_triggers.sql

-- ============================================================================
-- ENSURE update_updated_at_column() EXISTS (Idempotent)
-- ============================================================================

-- This function is already created in initial_schema.sql and create_payments_tables.sql
-- We ensure it exists with CREATE OR REPLACE (already done in previous migrations)
-- No action needed - function already exists

-- ============================================================================
-- CREATE HELPER FUNCTION TO ADD UPDATED_AT TRIGGER
-- ============================================================================

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

-- ============================================================================
-- APPLY TRIGGERS TO ALL TABLES (Idempotent)
-- ============================================================================

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
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    -- Check if table exists before adding trigger
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND tables.table_name = table_name
    ) THEN
      PERFORM add_updated_at_trigger(table_name);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- OPTIMIZE TRIGGER FUNCTIONS
-- ============================================================================

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

-- ============================================================================
-- ADD TRIGGER FOR AUTO-GENERATING BOOKING NUMBERS
-- ============================================================================

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

-- ============================================================================
-- ADD TRIGGER FOR AUTO-GENERATING ORDER NUMBERS
-- ============================================================================

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

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- This migration:
-- ✅ Created add_updated_at_trigger() helper function
-- ✅ Applied updated_at triggers to all tables consistently
-- ✅ Optimized handle_new_user() with conflict handling
-- ✅ Optimized handle_gym_application() to be more robust
-- ✅ Added auto-generation triggers for booking and order numbers
-- ✅ All triggers are now idempotent and centrally managed

