-- Partner Application System Setup
-- This migration creates the necessary tables for the partner application feature

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'authenticated',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Add constraint to ensure valid roles
  CONSTRAINT valid_role CHECK (role IN ('authenticated', 'partner', 'admin'))
);

-- Create gyms table for partner applications
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
  
  -- Add constraint to ensure valid status values
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Ensure one gym application per user
  CONSTRAINT unique_user_gym UNIQUE (user_id)
);

-- Create storage bucket for gym images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-images', 'gym-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS) policies

-- Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own role
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own role (for initial signup)
CREATE POLICY "Users can insert their own role"
  ON user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own role (for partner application)
CREATE POLICY "Users can update their own role"
  ON user_roles FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable RLS on gyms table
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own gym
CREATE POLICY "Users can view their own gym"
  ON gyms FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own gym
CREATE POLICY "Users can insert their own gym"
  ON gyms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own gym
CREATE POLICY "Users can update their own gym"
  ON gyms FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Admins can view all gyms
CREATE POLICY "Admins can view all gyms"
  ON gyms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins can update any gym
CREATE POLICY "Admins can update any gym"
  ON gyms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Storage policies for gym-images bucket
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_gyms_user_id ON gyms(user_id);
CREATE INDEX IF NOT EXISTS idx_gyms_status ON gyms(status);
CREATE INDEX IF NOT EXISTS idx_gyms_created_at ON gyms(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at on changes
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gyms_updated_at
  BEFORE UPDATE ON gyms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user role (optional - replace with your admin user ID)
-- INSERT INTO user_roles (user_id, role) 
-- VALUES ('YOUR_ADMIN_USER_UUID', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

COMMENT ON TABLE user_roles IS 'Stores user roles for authorization';
COMMENT ON TABLE gyms IS 'Stores gym partner applications and information';
COMMENT ON COLUMN gyms.status IS 'Application status: pending, approved, or rejected';
COMMENT ON COLUMN gyms.services IS 'Array of services offered by the gym';
COMMENT ON COLUMN gyms.images IS 'Array of image URLs for the gym';

