-- Fix user_roles RLS policies for better compatibility
-- This migration adds policies to allow proper access to user roles

-- Drop existing policies if they exist
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

-- Grant necessary permissions
GRANT SELECT ON user_roles TO authenticated;
GRANT INSERT ON user_roles TO authenticated;
GRANT UPDATE ON user_roles TO authenticated;
GRANT ALL ON user_roles TO service_role;

-- Create helper function to get user role (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_role(target_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM user_roles WHERE user_id = target_user_id;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;

COMMENT ON FUNCTION get_user_role IS 'Helper function to get user role, bypasses RLS for easier access';

