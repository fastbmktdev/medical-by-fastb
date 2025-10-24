-- ============================================
-- CONSOLIDATED ADMIN MANAGEMENT SCRIPT
-- ============================================
-- This script consolidates all admin-related functionality into a single comprehensive file.
-- It includes functions for promoting users to admin, demoting admins, checking roles,
-- and batch operations with comprehensive error handling.
--
-- USAGE INSTRUCTIONS:
-- 1. Run this entire script in Supabase SQL Editor to create all functions
-- 2. Use the provided functions to manage admin users
-- 3. See examples at the bottom of this file
-- ============================================

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to promote user to admin by email
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS TEXT AS $
DECLARE
  target_user_id UUID;
  result_message TEXT;
BEGIN
  -- Validate input
  IF user_email IS NULL OR user_email = '' THEN
    RETURN 'ERROR: Email cannot be null or empty.';
  END IF;

  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  -- Check if user exists
  IF target_user_id IS NULL THEN
    RETURN 'ERROR: User with email ' || user_email || ' not found. Please ensure the user is registered first.';
  END IF;

  -- Check if user already has admin role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin') THEN
    RETURN 'INFO: User ' || user_email || ' is already an admin.';
  END IF;

  -- Insert or update role to admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE
    SET role = 'admin', updated_at = NOW();

  result_message := 'SUCCESS: User ' || user_email || ' has been promoted to admin.';
  
  -- Log the action
  RAISE NOTICE '%', result_message;
  
  RETURN result_message;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: Failed to promote user ' || user_email || ' to admin. ' || SQLERRM;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to admin by user ID
CREATE OR REPLACE FUNCTION public.promote_to_admin_by_id(target_user_id UUID)
RETURNS TEXT AS $
DECLARE
  user_email TEXT;
  result_message TEXT;
BEGIN
  -- Validate input
  IF target_user_id IS NULL THEN
    RETURN 'ERROR: User ID cannot be null.';
  END IF;

  -- Find user email by ID
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = target_user_id;

  -- Check if user exists
  IF user_email IS NULL THEN
    RETURN 'ERROR: User with ID ' || target_user_id || ' not found.';
  END IF;

  -- Check if user already has admin role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin') THEN
    RETURN 'INFO: User ' || user_email || ' (ID: ' || target_user_id || ') is already an admin.';
  END IF;

  -- Insert or update role to admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE
    SET role = 'admin', updated_at = NOW();

  result_message := 'SUCCESS: User ' || user_email || ' (ID: ' || target_user_id || ') has been promoted to admin.';
  
  -- Log the action
  RAISE NOTICE '%', result_message;
  
  RETURN result_message;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: Failed to promote user ID ' || target_user_id || ' to admin. ' || SQLERRM;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote admin to regular user
CREATE OR REPLACE FUNCTION public.demote_from_admin(user_email TEXT)
RETURNS TEXT AS $
DECLARE
  target_user_id UUID;
  current_role TEXT;
  result_message TEXT;
BEGIN
  -- Validate input
  IF user_email IS NULL OR user_email = '' THEN
    RETURN 'ERROR: Email cannot be null or empty.';
  END IF;

  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  -- Check if user exists
  IF target_user_id IS NULL THEN
    RETURN 'ERROR: User with email ' || user_email || ' not found.';
  END IF;

  -- Check current role
  SELECT role INTO current_role
  FROM public.user_roles
  WHERE user_id = target_user_id;

  IF current_role IS NULL THEN
    RETURN 'INFO: User ' || user_email || ' has no role assigned.';
  END IF;

  IF current_role != 'admin' THEN
    RETURN 'INFO: User ' || user_email || ' is not an admin (current role: ' || current_role || ').';
  END IF;

  -- Update role to authenticated
  UPDATE public.user_roles
  SET role = 'authenticated', updated_at = NOW()
  WHERE user_id = target_user_id;

  result_message := 'SUCCESS: User ' || user_email || ' has been demoted from admin to regular user.';
  
  -- Log the action
  RAISE NOTICE '%', result_message;
  
  RETURN result_message;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: Failed to demote user ' || user_email || ' from admin. ' || SQLERRM;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user's role and details
CREATE OR REPLACE FUNCTION public.check_user_role(user_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT,
  role TEXT,
  role_created_at TIMESTAMP WITH TIME ZONE,
  role_updated_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  -- Validate input
  IF user_email IS NULL OR user_email = '' THEN
    RAISE EXCEPTION 'Email cannot be null or empty.';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::TEXT,
    p.username,
    COALESCE(ur.role, 'no_role')::TEXT,
    ur.created_at,
    ur.updated_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE u.email = user_email;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list all admin users
CREATE OR REPLACE FUNCTION public.list_all_admins()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT,
  role_created_at TIMESTAMP WITH TIME ZONE,
  role_updated_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email::TEXT,
    p.username,
    ur.created_at,
    ur.updated_at
  FROM auth.users u
  JOIN public.user_roles ur ON u.id = ur.user_id
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE ur.role = 'admin'
  ORDER BY ur.created_at DESC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for batch admin promotion
CREATE OR REPLACE FUNCTION public.batch_promote_to_admin(user_emails TEXT[])
RETURNS TABLE (
  email TEXT,
  status TEXT,
  message TEXT
) AS $
DECLARE
  user_email TEXT;
  result_msg TEXT;
BEGIN
  -- Validate input
  IF user_emails IS NULL OR array_length(user_emails, 1) IS NULL THEN
    RETURN QUERY SELECT ''::TEXT, 'ERROR'::TEXT, 'Email array cannot be null or empty.'::TEXT;
    RETURN;
  END IF;

  -- Process each email
  FOREACH user_email IN ARRAY user_emails
  LOOP
    BEGIN
      result_msg := public.promote_to_admin(user_email);
      
      IF result_msg LIKE 'SUCCESS:%' THEN
        RETURN QUERY SELECT user_email, 'SUCCESS'::TEXT, result_msg;
      ELSIF result_msg LIKE 'INFO:%' THEN
        RETURN QUERY SELECT user_email, 'INFO'::TEXT, result_msg;
      ELSE
        RETURN QUERY SELECT user_email, 'ERROR'::TEXT, result_msg;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN QUERY SELECT user_email, 'ERROR'::TEXT, ('Failed to process ' || user_email || ': ' || SQLERRM)::TEXT;
    END;
  END LOOP;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate admin permissions
CREATE OR REPLACE FUNCTION public.validate_admin_setup()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $
DECLARE
  admin_count INTEGER;
  table_exists BOOLEAN;
BEGIN
  -- Check if user_roles table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) INTO table_exists;

  IF table_exists THEN
    RETURN QUERY SELECT 'user_roles_table'::TEXT, 'OK'::TEXT, 'Table exists'::TEXT;
    
    -- Count admin users
    SELECT COUNT(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin';
    
    RETURN QUERY SELECT 'admin_count'::TEXT, 'INFO'::TEXT, (admin_count || ' admin users found')::TEXT;
  ELSE
    RETURN QUERY SELECT 'user_roles_table'::TEXT, 'ERROR'::TEXT, 'Table does not exist'::TEXT;
  END IF;

  -- Check RLS policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles'
  ) THEN
    RETURN QUERY SELECT 'rls_policies'::TEXT, 'OK'::TEXT, 'RLS policies configured'::TEXT;
  ELSE
    RETURN QUERY SELECT 'rls_policies'::TEXT, 'WARNING'::TEXT, 'No RLS policies found'::TEXT;
  END IF;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Grant execute permissions to authenticated users for security
GRANT EXECUTE ON FUNCTION public.promote_to_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_admin_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demote_from_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_all_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.batch_promote_to_admin(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_admin_setup() TO authenticated;

-- ============================================
-- USAGE EXAMPLES AND DOCUMENTATION
-- ============================================

-- EXAMPLE 1: Promote a single user to admin by email
-- SELECT public.promote_to_admin('user@example.com');

-- EXAMPLE 2: Promote a user to admin by user ID
-- SELECT public.promote_to_admin_by_id('550e8400-e29b-41d4-a716-446655440000');

-- EXAMPLE 3: Demote an admin to regular user
-- SELECT public.demote_from_admin('admin@example.com');

-- EXAMPLE 4: Check a user's role and details
-- SELECT * FROM public.check_user_role('user@example.com');

-- EXAMPLE 5: List all admin users
-- SELECT * FROM public.list_all_admins();

-- EXAMPLE 6: Batch promote multiple users to admin
-- SELECT * FROM public.batch_promote_to_admin(ARRAY['user1@example.com', 'user2@example.com']);

-- EXAMPLE 7: Validate admin setup
-- SELECT * FROM public.validate_admin_setup();

-- EXAMPLE 8: Quick admin setup for development (replace with actual email)
-- DO $
-- DECLARE
--   admin_email TEXT := 'admin@example.com'; -- <-- Change this to your admin email
--   result TEXT;
-- BEGIN
--   result := public.promote_to_admin(admin_email);
--   RAISE NOTICE '%', result;
-- END $;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Query to verify admin users
-- SELECT 
--   u.id,
--   u.email,
--   u.raw_user_meta_data->>'full_name' as full_name,
--   ur.role,
--   ur.created_at,
--   ur.updated_at
-- FROM auth.users u
-- LEFT JOIN public.user_roles ur ON ur.user_id = u.id
-- WHERE ur.role = 'admin'
-- ORDER BY ur.created_at DESC;

-- Query to check user role by email
-- SELECT 
--   u.email,
--   COALESCE(ur.role, 'no_role') as role,
--   ur.created_at,
--   ur.updated_at
-- FROM auth.users u
-- LEFT JOIN public.user_roles ur ON ur.user_id = u.id
-- WHERE u.email = 'your-email@example.com';

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If you get permission errors:
-- 1. Ensure you're running this as a superuser or service_role
-- 2. Check that the user_roles table exists
-- 3. Verify RLS policies are properly configured

-- If functions don't work:
-- 1. Run the validation function: SELECT * FROM public.validate_admin_setup();
-- 2. Check that all required tables exist
-- 3. Ensure the user you're trying to promote is registered in auth.users

-- Common error solutions:
-- - "User not found": The user must be registered through your app first
-- - "Permission denied": Run with appropriate database permissions
-- - "Table doesn't exist": Ensure migrations have been run

-- ============================================
-- END OF CONSOLIDATED ADMIN MANAGEMENT SCRIPT
-- ============================================