-- Fix user_roles policies to avoid recursive self-references
-- Migration: 20251107093000_fix_user_roles_policies.sql

-- Ensure helper function exists (defined in earlier migrations)
-- Function is security definer and bypasses RLS checks for this logic.

-- Drop policies that self-reference user_roles
DROP POLICY IF EXISTS "admins_can_update_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_can_view_all_roles" ON user_roles;

-- Recreate admin policies using the is_admin() helper to prevent recursion
CREATE POLICY "admins_can_update_roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admins_can_view_all_roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (is_admin());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'service_role_manage_user_roles'
  ) THEN
    EXECUTE 'CREATE POLICY "service_role_manage_user_roles" ON user_roles FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END;
$$;

-- Notes:
-- - Policies now delegate admin check to is_admin(), which runs as SECURITY DEFINER
--   and avoids recursive evaluation on user_roles.
-- - service_role retains full access for background jobs and Supabase management API.

