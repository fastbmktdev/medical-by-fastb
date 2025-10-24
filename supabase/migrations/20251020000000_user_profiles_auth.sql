-- ============================================
-- User Profiles and Authentication Enhancement
-- ============================================
-- This migration consolidates user profile and authentication improvements:
-- - Adds phone column to profiles table
-- - Enhances username support and validation
-- - Improves user roles RLS policies for better security
-- - Adds helper functions for user management
-- ============================================

-- ============================================
-- PROFILES TABLE ENHANCEMENTS
-- ============================================

-- Add phone column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add index for better query performance on phone
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Add comment for phone column
COMMENT ON COLUMN profiles.phone IS 'User phone number';

-- ============================================
-- ENHANCED USER ROLES RLS POLICIES
-- ============================================

-- Drop existing user_roles policies for clean slate
DROP POLICY IF EXISTS "users_can_read_own_role" ON user_roles;
DROP POLICY IF EXISTS "users_can_insert_own_role" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;

-- Policy: Authenticated users can read their own role
CREATE POLICY "users_can_read_own_role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can read all roles (for server-side operations)
CREATE POLICY "service_role_can_read_all_roles"
  ON user_roles
  FOR SELECT
  TO service_role
  USING (true);

-- Policy: Users can insert their own role during signup
CREATE POLICY "users_can_insert_own_role"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Only admins can update roles (prevent self-promotion)
CREATE POLICY "admins_can_update_roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Policy: Admins can view all roles
CREATE POLICY "admins_can_view_all_roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- ============================================
-- ENHANCED PROFILES POLICIES
-- ============================================

-- Drop existing profiles policies for clean slate
DROP POLICY IF EXISTS "anyone_can_view_profiles" ON profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Policy: Allow everyone to view profiles (public profiles)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO public
  USING (true);

-- Policy: Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ENHANCED PERMISSIONS
-- ============================================

-- Grant necessary permissions for user_roles
GRANT SELECT ON user_roles TO authenticated;
GRANT INSERT ON user_roles TO authenticated;
GRANT UPDATE ON user_roles TO authenticated;
GRANT ALL ON user_roles TO service_role;

-- Grant necessary permissions for profiles
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon, public;

-- ============================================
-- ENHANCED TRIGGER FUNCTIONS
-- ============================================

-- Update the handle_new_user function to include phone and improved error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
BEGIN
  -- Create profile with phone number and enhanced metadata handling
  INSERT INTO public.profiles (user_id, username, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create user_role with default 'authenticated' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'authenticated');
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- ENHANCED HELPER FUNCTIONS
-- ============================================

-- Enhanced function to get user role (bypasses RLS for easier access)
CREATE OR REPLACE FUNCTION get_user_role(target_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $
  SELECT role FROM user_roles WHERE user_id = target_user_id;
$;

-- Grant execute permission on get_user_role function
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO anon;

-- Enhanced function to find user by username or email with better performance
CREATE OR REPLACE FUNCTION public.get_user_by_username_or_email(identifier TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT
) AS $
BEGIN
  RETURN QUERY
  SELECT
    p.user_id as user_id,
    u.email::TEXT,
    p.username::TEXT
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.username = identifier OR u.email = identifier
  LIMIT 1;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on get_user_by_username_or_email function
GRANT EXECUTE ON FUNCTION public.get_user_by_username_or_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_username_or_email(TEXT) TO anon;

-- ============================================
-- ENHANCED INDEXES
-- ============================================

-- Ensure all necessary indexes exist for optimal performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- ============================================
-- COMMENTS AND DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION get_user_role IS 'Helper function to get user role, bypasses RLS for easier access';
COMMENT ON FUNCTION public.get_user_by_username_or_email IS 'Find user by username or email for authentication purposes';
COMMENT ON COLUMN profiles.phone IS 'User phone number for contact and verification';
COMMENT ON COLUMN profiles.username IS 'Unique username for login and identification';

-- ============================================
-- Migration Complete!
-- ============================================
-- This migration provides:
-- 1. Phone number support in user profiles
-- 2. Enhanced username-based authentication
-- 3. Improved RLS policies for better security
-- 4. Helper functions for user management
-- 5. Optimized indexes for better performance
-- ============================================