-- Initial schema for medical Platform
-- Creates tables, policies, triggers, and functions
-- ---
-- TABLES
-- ---
-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'authenticated',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_role CHECK (role IN ('authenticated', 'partner', 'admin'))
);

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  location TEXT NOT NULL,
  hospital_details TEXT,
  services TEXT[] DEFAULT ARRAY[]::TEXT[],
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT unique_user_gym UNIQUE (user_id), -- Legacy name, kept for backward compatibility
  CONSTRAINT unique_user_hospital UNIQUE (user_id) -- New name
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
-- ---
-- ROW LEVEL SECURITY (RLS)
-- ---
-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (for idempotency)
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

-- RLS Policies for hospitals
CREATE POLICY "anyone_can_view_approved_hospitals"
  ON hospitals FOR SELECT
  TO public
  USING (status = 'approved');
-- Backward compatibility
CREATE POLICY "anyone_can_view_approved_gyms"
  ON hospitals FOR SELECT
  TO public
  USING (status = 'approved');

CREATE POLICY "users_can_view_own_hospital"
  ON hospitals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
-- Backward compatibility
CREATE POLICY "users_can_view_own_gym"
  ON hospitals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_hospital"
  ON hospitals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
-- Backward compatibility
CREATE POLICY "users_can_insert_own_gym"
  ON hospitals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_hospital"
  ON hospitals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
-- Backward compatibility
CREATE POLICY "users_can_update_own_gym"
  ON hospitals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "admins_can_manage_all_hospitals"
  ON hospitals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
-- Backward compatibility
CREATE POLICY "admins_can_manage_all_gyms"
  ON hospitals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

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
-- ---
-- PERMISSIONS
-- ---
GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT SELECT ON user_roles TO authenticated, anon;
GRANT INSERT ON user_roles TO authenticated;
GRANT UPDATE ON user_roles TO authenticated;

GRANT SELECT, INSERT, UPDATE ON hospitals TO authenticated;

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon, public;
-- ---
-- INDEXES
-- ---
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_hospitals_user_id ON hospitals(user_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_status ON hospitals(status);
CREATE INDEX IF NOT EXISTS idx_hospitals_created_at ON hospitals(created_at DESC);
-- Backward compatibility
CREATE INDEX IF NOT EXISTS idx_gyms_user_id ON hospitals(user_id);
CREATE INDEX IF NOT EXISTS idx_gyms_status ON hospitals(status);
CREATE INDEX IF NOT EXISTS idx_gyms_created_at ON hospitals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
-- ---
-- TRIGGERS AND FUNCTIONS
-- ---
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
DROP TRIGGER IF EXISTS update_hospitals_updated_at ON hospitals;
DROP TRIGGER IF EXISTS update_gyms_updated_at ON hospitals; -- Legacy name
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_hospital_application_submitted ON hospitals;

-- Create triggers to update updated_at on changes
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger with new name (replaces legacy name)
CREATE TRIGGER update_hospitals_updated_at
  BEFORE UPDATE ON hospitals
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

-- Auto-promote user to 'partner' role when hospital application is submitted
CREATE OR REPLACE FUNCTION public.handle_hospital_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user role to 'partner' when they submit a hospital application
  UPDATE public.user_roles
  SET role = 'partner', updated_at = TIMEZONE('utc', NOW())
  WHERE user_id = NEW.user_id
  AND role = 'authenticated';  -- Only upgrade from authenticated to partner
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_hospital_application_submitted
  AFTER INSERT ON hospitals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_hospital_application();
-- ---
-- STORAGE
-- ---
-- Create storage bucket for hospital images
INSERT INTO storage.buckets (id, name, public)
VALUES ('hospital-images', 'hospital-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies (for idempotency)
DROP POLICY IF EXISTS "Authenticated users can upload hospital images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view hospital images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own hospital images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own hospital images" ON storage.objects;

-- Storage policies
CREATE POLICY "Authenticated users can upload hospital images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'hospital-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view hospital images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hospital-images');

CREATE POLICY "Users can update their own hospital images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'hospital-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own hospital images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'hospital-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
-- ---
-- HELPER FUNCTIONS
-- ---
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
-- ---
-- COMMENTS
-- ---
COMMENT ON TABLE user_roles IS 'Stores user roles for authorization';
COMMENT ON TABLE hospitals IS 'Stores hospital partner applications and information';
COMMENT ON TABLE profiles IS 'Stores user profiles with username support';
COMMENT ON FUNCTION get_user_role IS 'Helper function to get user role, bypasses RLS for easier access';
