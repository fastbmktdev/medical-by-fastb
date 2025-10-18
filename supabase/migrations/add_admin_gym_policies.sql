-- Migration: Add admin policies for gyms table
-- Created: 2025-10-18
-- Purpose: Allow admins to view, update, and delete all gyms for approval workflow

-- Drop old policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "admins_can_view_all_gyms" ON gyms;
DROP POLICY IF EXISTS "admins_can_update_all_gyms" ON gyms;
DROP POLICY IF EXISTS "admins_can_delete_gyms" ON gyms;

-- Create helper function to check if current user is admin
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

-- Add comment
COMMENT ON FUNCTION is_admin IS 'Check if current authenticated user is an admin';

-- Policy: Allow admins to view all gyms
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

-- Policy: Allow admins to update all gyms
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

-- Policy: Allow admins to delete gyms (for denied applications)
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

