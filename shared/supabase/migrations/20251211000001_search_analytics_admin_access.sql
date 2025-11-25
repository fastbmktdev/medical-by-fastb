-- Search Analytics Admin Access Migration
-- Migration: 20251211000000_search_analytics_admin_access.sql
-- Adds admin RLS policy to search_history table for analytics purposes
-- ---
-- PART 1: ADMIN RLS POLICY FOR SEARCH HISTORY
-- ---
-- Drop policy if it exists (idempotent)
DROP POLICY IF EXISTS "Admin can view all search history" ON search_history;

-- Policy: Admin can view all search history for analytics
CREATE POLICY "Admin can view all search history"
  ON search_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

COMMENT ON POLICY "Admin can view all search history" ON search_history IS 'Allow admins to view all search history for analytics purposes';
