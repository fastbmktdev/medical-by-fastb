-- Initial schema for MUAYTHAI Platform
-- Creates tables, policies, triggers, and functions

-- ============================================================================
-- TABLES
-- ============================================================================

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'authenticated',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_role CHECK (role IN ('authenticated', 'partner', 'admin'))
);

-- Create gyms table
CREATE TABLE IF NOT EXISTS gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  location TEXT NOT NULL,
  gym_details TEXT,
  services TEXT[] DEFAULT ARRAY[]::TEXT[],
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT unique_user_gym UNIQUE (user_id)
);

-- Create profiles table for username support
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (for idempotency)
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;
DROP POLICY IF EXISTS "users_can_read_own_role" ON user_roles;
DROP POLICY IF EXISTS "users_can_insert_own_role" ON user_roles;
DROP POLICY IF EXISTS "admins_can_view_all_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_can_update_roles" ON user_roles;
DROP POLICY IF EXISTS "users_can_view_own_gym" ON gyms;
DROP POLICY IF EXISTS "users_can_insert_own_gym" ON gyms;
DROP POLICY IF EXISTS "users_can_update_own_gym" ON gyms;
DROP POLICY IF EXISTS "anyone_can_view_profiles" ON profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON profiles;

-- RLS Policies for user_roles
CREATE POLICY "users_can_read_own_role"
  ON user_roles FOR SELECT
  TO authenticated, anon
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_role"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for gyms
CREATE POLICY "users_can_view_own_gym"
  ON gyms FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_gym"
  ON gyms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_gym"
  ON gyms FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "anyone_can_view_profiles"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "users_can_insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT SELECT ON user_roles TO authenticated, anon;
GRANT INSERT ON user_roles TO authenticated;
GRANT UPDATE ON user_roles TO authenticated;

GRANT SELECT, INSERT, UPDATE ON gyms TO authenticated;
GRANT SELECT ON gyms TO anon;

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon, public;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_gyms_user_id ON gyms(user_id);
CREATE INDEX IF NOT EXISTS idx_gyms_status ON gyms(status);
CREATE INDEX IF NOT EXISTS idx_gyms_created_at ON gyms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers (for idempotency)
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
DROP TRIGGER IF EXISTS update_gyms_updated_at ON gyms;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_gym_application_submitted ON gyms;

-- Create triggers to update updated_at on changes
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gyms_updated_at
  BEFORE UPDATE ON gyms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile and user_role when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create user_role with default 'authenticated' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'authenticated');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-promote user to 'partner' role when gym application is submitted
CREATE OR REPLACE FUNCTION public.handle_gym_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user role to 'partner' when they submit a gym application
  UPDATE public.user_roles
  SET role = 'partner', updated_at = TIMEZONE('utc', NOW())
  WHERE user_id = NEW.user_id
  AND role = 'authenticated';  -- Only upgrade from authenticated to partner
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_gym_application_submitted
  AFTER INSERT ON gyms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_gym_application();

-- ============================================================================
-- STORAGE
-- ============================================================================

-- Create storage bucket for gym images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-images', 'gym-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies (for idempotency)
DROP POLICY IF EXISTS "Authenticated users can upload gym images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view gym images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own gym images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own gym images" ON storage.objects;

-- Storage policies
CREATE POLICY "Authenticated users can upload gym images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gym-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view gym images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gym-images');

CREATE POLICY "Users can update their own gym images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'gym-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own gym images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gym-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(target_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM user_roles WHERE user_id = target_user_id;
$$;

GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated, anon;

-- Helper function to get user by username or email (for login)
CREATE OR REPLACE FUNCTION get_user_by_username_or_email(identifier TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    u.email::TEXT,
    p.username::TEXT
  FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.username = identifier OR u.email = identifier
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_user_by_username_or_email(TEXT) TO authenticated, anon;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_roles IS 'Stores user roles for authorization';
COMMENT ON TABLE gyms IS 'Stores gym partner applications and information';
COMMENT ON TABLE profiles IS 'Stores user profiles with username support';
COMMENT ON FUNCTION get_user_role IS 'Helper function to get user role, bypasses RLS for easier access';
