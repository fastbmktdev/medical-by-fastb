-- Partner Promotions Support
-- Migration: 20251209000000_partner_promotions.sql
-- Allows partners to create promotions for their hospital appointments
-- ---
-- PART 1: ADD hospital_ID TO PROMOTIONS TABLE
-- ---
-- Add hospital_id column to promotions table (nullable - for admin promotions)
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_promotions_hospital_id ON promotions(hospital_id) WHERE hospital_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN promotions.hospital_id IS 'Reference to hospital for partner promotions. NULL for admin-created promotions.';
-- ---
-- PART 2: UPDATE RLS POLICIES
-- ---
-- Drop existing policy
DROP POLICY IF EXISTS "Only admins can manage promotions" ON promotions;

-- Policy: Everyone can view active promotions
-- (Keep existing policy, already exists)
-- Policy: Admins can manage all promotions
CREATE POLICY "admins_can_manage_all_promotions"
  ON promotions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policy: Partners can create promotions for their own hospital
CREATE POLICY "partners_can_create_own_hospital_promotions"
  ON promotions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = promotions.hospital_id
      AND hospitals.user_id = auth.uid()
      AND hospitals.status = 'approved'
    )
  );

-- Policy: Partners can view their own hospital promotions
CREATE POLICY "partners_can_view_own_hospital_promotions"
  ON promotions
  FOR SELECT
  TO authenticated
  USING (
    hospital_id IS NULL OR -- Admin promotions (visible to everyone if active)
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = promotions.hospital_id
      AND hospitals.user_id = auth.uid()
    )
  );

-- Policy: Partners can update their own hospital promotions
CREATE POLICY "partners_can_update_own_hospital_promotions"
  ON promotions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = promotions.hospital_id
      AND hospitals.user_id = auth.uid()
      AND hospitals.status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = promotions.hospital_id
      AND hospitals.user_id = auth.uid()
      AND hospitals.status = 'approved'
    )
  );

-- Policy: Partners can delete their own hospital promotions
CREATE POLICY "partners_can_delete_own_hospital_promotions"
  ON promotions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = promotions.hospital_id
      AND hospitals.user_id = auth.uid()
    )
  );
-- ---
-- PART 3: UPDATE GRANTS
-- ---
-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON promotions TO authenticated;
-- ---
-- PART 4: ADD COMMENTS
-- ---
COMMENT ON TABLE promotions IS 'Promotions for marquee and banner displays. Can be created by admins (hospital_id = NULL) or partners (hospital_id = their hospital)';
