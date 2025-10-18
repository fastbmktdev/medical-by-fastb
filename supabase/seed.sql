-- ============================================================================
-- DATABASE SCHEMA SETUP
-- ============================================================================
-- Seed file for local development
-- This file runs automatically when you run: supabase db reset
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
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'denied')),
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

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;
DROP POLICY IF EXISTS "users_can_read_own_role" ON user_roles;
DROP POLICY IF EXISTS "users_can_insert_own_role" ON user_roles;
DROP POLICY IF EXISTS "admins_can_view_all_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_can_update_roles" ON user_roles;

-- RLS Policies for user_roles
-- Simple policies without recursion
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

CREATE POLICY "admins_can_view_all_gyms"
  ON gyms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "users_can_insert_own_gym"
  ON gyms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_gym"
  ON gyms FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "admins_can_update_all_gyms"
  ON gyms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "admins_can_delete_gyms"
  ON gyms FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
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

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT SELECT ON user_roles TO authenticated, anon;
GRANT INSERT ON user_roles TO authenticated;
GRANT UPDATE ON user_roles TO authenticated;

GRANT SELECT, INSERT, UPDATE ON gyms TO authenticated;
GRANT SELECT ON gyms TO anon;

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon, public;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_gyms_user_id ON gyms(user_id);
CREATE INDEX IF NOT EXISTS idx_gyms_status ON gyms(status);
CREATE INDEX IF NOT EXISTS idx_gyms_created_at ON gyms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gyms_updated_at ON gyms;
CREATE TRIGGER update_gyms_updated_at
  BEFORE UPDATE ON gyms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Drop old auto role promotion trigger if exists
DROP TRIGGER IF EXISTS on_gym_application_submitted ON gyms;
DROP FUNCTION IF EXISTS public.handle_gym_application();

-- NOTE: Removed auto role promotion trigger
-- Role will be updated manually by admin through API when approved
-- This ensures proper approval workflow

-- Create storage bucket for gym images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-images', 'gym-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Authenticated users can upload gym images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view gym images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own gym images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own gym images" ON storage.objects;

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

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;

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

-- Comments
COMMENT ON TABLE user_roles IS 'Stores user roles for authorization';
COMMENT ON TABLE gyms IS 'Stores gym partner applications and information';
COMMENT ON TABLE profiles IS 'Stores user profiles with username support';
COMMENT ON FUNCTION get_user_role IS 'Helper function to get user role, bypasses RLS for easier access';
COMMENT ON FUNCTION is_admin IS 'Check if current authenticated user is an admin';

-- ============================================================================
-- SEED DATA FOR TESTING
-- ============================================================================
-- NOTE: All test users have the password: "password123"
-- ============================================================================

-- Insert test admin user
-- Email: admin@muaythai.com
-- Password: password123
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@muaythai.com',
  '$2a$10$pQ5M8HnxXqxEVPvXLmXvJ.s0E8EY7G9qNWFq7h.ZJOHvLKZxXBEVW', -- password123
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User","username":"admin"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Set admin role
INSERT INTO user_roles (user_id, role, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Create admin profile
INSERT INTO profiles (user_id, username, full_name, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', 'Admin User', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- Insert test partner users with gym applications
-- ============================================================================

-- Partner 1 - Pending application
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'partner1@muaythai.com',
  '$2a$10$pQ5M8HnxXqxEVPvXLmXvJ.s0E8EY7G9qNWFq7h.ZJOHvLKZxXBEVW',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"สมชาย มวยไทย","username":"somchai_gym"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000002', 'partner')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO profiles (user_id, username, full_name)
VALUES ('00000000-0000-0000-0000-000000000002', 'somchai_gym', 'สมชาย มวยไทย')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO gyms (
  id,
  user_id,
  gym_name,
  contact_name,
  phone,
  email,
  website,
  location,
  gym_details,
  services,
  images,
  status,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Tiger Muay Thai Gym',
  'สมชาย มวยไทย',
  '0812345678',
  'contact@tigermuaythai.com',
  'https://www.tigermuaythai.com',
  '123 ถนนพระราม 4 แขวงสีลม เขตบางรัก กรุงเทพ 10500',
  'ยิมมวยไทยชั้นนำในกรุงเทพฯ มีเวที 2 เวที รองรับได้ 50 คน เปิดทุกวัน 06:00-22:00 มีครูมืออาชีพ 10 คน อุปกรณ์ครบครัน สะอาด ทันสมัย',
  ARRAY['มวยไทย', 'ฟิตเนส', 'Private Class', 'คลาสกลุ่ม'],
  ARRAY['https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800', 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800'],
  'pending',
  NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- Partner 2 - Approved application
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'partner2@muaythai.com',
  '$2a$10$pQ5M8HnxXqxEVPvXLmXvJ.s0E8EY7G9qNWFq7h.ZJOHvLKZxXBEVW',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"สมหญิง ฟิตเนส","username":"somying_fitness"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000003', 'partner')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO profiles (user_id, username, full_name)
VALUES ('00000000-0000-0000-0000-000000000003', 'somying_fitness', 'สมหญิง ฟิตเนส')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO gyms (
  id,
  user_id,
  gym_name,
  contact_name,
  phone,
  email,
  website,
  location,
  gym_details,
  services,
  images,
  status,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  'Bangkok Fight Club',
  'สมหญิง ฟิตเนส',
  '0898765432',
  'info@bangkokfightclub.com',
  'https://www.bangkokfightclub.com',
  '456 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพ 10110',
  'Fight club สำหรับนักสู้มืออาชีพและมือใหม่ มีคอร์สลดน้ำหนัก มวยไทย คิกบ็อกซิ่ง MMA และฟิตเนส มีเทรนเนอร์ระดับประเทศ',
  ARRAY['มวยไทย', 'ฟิตเนส', 'เทรนนิ่งมืออาชีพ', 'คอร์สลดน้ำหนัก', 'Private Class'],
  ARRAY['https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800'],
  'approved',
  NOW() - INTERVAL '5 days'
) ON CONFLICT (id) DO NOTHING;

-- Partner 3 - Another pending application
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'partner3@muaythai.com',
  '$2a$10$pQ5M8HnxXqxEVPvXLmXvJ.s0E8EY7G9qNWFq7h.ZJOHvLKZxXBEVW',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"วิชัย นักชก","username":"wichai_boxer"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000004', 'partner')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO profiles (user_id, username, full_name)
VALUES ('00000000-0000-0000-0000-000000000004', 'wichai_boxer', 'วิชัย นักชก')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO gyms (
  id,
  user_id,
  gym_name,
  contact_name,
  phone,
  email,
  location,
  gym_details,
  services,
  images,
  status,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  'Lumpinee Training Camp',
  'วิชัย นักชก',
  '0823456789',
  'training@lumpinee.com',
  '789 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพ 10400',
  'ค่ายมวยไทยมืออาชีพ เน้นเทรนนิ่งนักมวยระดับแชมป์ มีเวทีซ้อม 3 เวที ห้องน้ำหนัก ซาวน่า และบริการพักอาศัย',
  ARRAY['มวยไทย', 'เทรนนิ่งมืออาชีพ', 'เทรนนิ่งเด็ก'],
  ARRAY['https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800', 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800'],
  'pending',
  NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- Partner 4 - Rejected application
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'partner4@muaythai.com',
  '$2a$10$pQ5M8HnxXqxEVPvXLmXvJ.s0E8EY7G9qNWFq7h.ZJOHvLKZxXBEVW',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"สมศักดิ์ ออกกำลัง","username":"somsak_gym"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000005', 'authenticated')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO profiles (user_id, username, full_name)
VALUES ('00000000-0000-0000-0000-000000000005', 'somsak_gym', 'สมศักดิ์ ออกกำลัง')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO gyms (
  id,
  user_id,
  gym_name,
  contact_name,
  phone,
  email,
  location,
  gym_details,
  services,
  status,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  'Small Home Gym',
  'สมศักดิ์ ออกกำลัง',
  '0834567890',
  'somsak@email.com',
  '12/34 ซอยลาดพร้าว 15 กรุงเทพ',
  'ยิมขนาดเล็กในบ้าน',
  ARRAY['ฟิตเนส'],
  'rejected',
  NOW() - INTERVAL '7 days'
) ON CONFLICT (id) DO NOTHING;

-- Regular authenticated user (not a partner)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'user@muaythai.com',
  '$2a$10$pQ5M8HnxXqxEVPvXLmXvJ.s0E8EY7G9qNWFq7h.ZJOHvLKZxXBEVW',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"ผู้ใช้ทั่วไป","username":"regular_user"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000006', 'authenticated')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO profiles (user_id, username, full_name)
VALUES ('00000000-0000-0000-0000-000000000006', 'regular_user', 'ผู้ใช้ทั่วไป')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- SEED DATA SUMMARY
-- ============================================================================
-- Admin User:
--   Email: admin@muaythai.com
--   Password: password123
--   Role: admin
--
-- Partner Users:
--   1. partner1@muaythai.com (pending application - Tiger Muay Thai Gym)
--   2. partner2@muaythai.com (approved application - Bangkok Fight Club)
--   3. partner3@muaythai.com (pending application - Lumpinee Training Camp)
--   4. partner4@muaythai.com (rejected application - Small Home Gym)
--
-- Regular User:
--   Email: user@muaythai.com
--   Password: password123
--   Role: authenticated
--
-- All passwords: password123
-- ============================================================================
