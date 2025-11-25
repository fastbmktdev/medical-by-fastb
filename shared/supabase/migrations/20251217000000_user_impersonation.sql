-- ---
-- USER IMPERSONATION SYSTEM MIGRATION
-- Migration: 20251217000000_user_impersonation.sql
-- ---
-- This migration creates tables and functions for user impersonation
-- which allows admins to log in as other users for support purposes
-- ---

-- PART 1: UPDATE AUDIT ACTION TYPES
-- ---
-- Add impersonation action types to audit_action_type enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'impersonate' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_action_type')
  ) THEN
    ALTER TYPE audit_action_type ADD VALUE 'impersonate';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'stop_impersonation' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_action_type')
  ) THEN
    ALTER TYPE audit_action_type ADD VALUE 'stop_impersonation';
  END IF;
END $$;

-- PART 2: USER IMPERSONATIONS TABLE
-- ---
CREATE TABLE IF NOT EXISTS user_impersonations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Admin and target user
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Impersonation details
  reason TEXT, -- Support ticket ID, issue description, etc.
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Constraints
  CONSTRAINT check_impersonation_not_self CHECK (admin_user_id != impersonated_user_id),
  CONSTRAINT check_ended_after_started CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- Indexes for user_impersonations
CREATE INDEX IF NOT EXISTS idx_impersonations_admin ON user_impersonations(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonations_user ON user_impersonations(impersonated_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonations_active ON user_impersonations(ended_at) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_impersonations_started ON user_impersonations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_impersonations_session ON user_impersonations(session_id) WHERE session_id IS NOT NULL;

-- PART 3: FUNCTIONS
-- ---
-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_impersonation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_impersonation_updated_at
  BEFORE UPDATE ON user_impersonations
  FOR EACH ROW
  EXECUTE FUNCTION update_impersonation_updated_at();

-- Function to get active impersonation for admin
CREATE OR REPLACE FUNCTION get_active_impersonation(p_admin_user_id UUID)
RETURNS TABLE (
  id UUID,
  admin_user_id UUID,
  impersonated_user_id UUID,
  reason TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  session_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.id,
    ui.admin_user_id,
    ui.impersonated_user_id,
    ui.reason,
    ui.started_at,
    ui.session_id
  FROM user_impersonations ui
  WHERE ui.admin_user_id = p_admin_user_id
    AND ui.ended_at IS NULL
  ORDER BY ui.started_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to stop impersonation
CREATE OR REPLACE FUNCTION stop_impersonation(
  p_impersonation_id UUID,
  p_admin_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_impersonation RECORD;
BEGIN
  -- Get impersonation record
  SELECT * INTO v_impersonation
  FROM user_impersonations
  WHERE id = p_impersonation_id
    AND admin_user_id = p_admin_user_id
    AND ended_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update ended_at
  UPDATE user_impersonations
  SET ended_at = TIMEZONE('utc', NOW())
  WHERE id = p_impersonation_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 4: ROW LEVEL SECURITY (RLS)
-- ---
ALTER TABLE user_impersonations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all impersonations
CREATE POLICY "admins_can_view_impersonations"
  ON user_impersonations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Admins can create impersonations
CREATE POLICY "admins_can_create_impersonations"
  ON user_impersonations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
    AND admin_user_id = auth.uid()
  );

-- Policy: Admins can update their own impersonations
CREATE POLICY "admins_can_update_own_impersonations"
  ON user_impersonations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
    AND admin_user_id = auth.uid()
  )
  WITH CHECK (
    admin_user_id = auth.uid()
  );

-- Policy: Service role has full access
CREATE POLICY "service_role_manage_impersonations"
  ON user_impersonations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE user_impersonations IS 'Tracks admin impersonation of users for support purposes';
COMMENT ON COLUMN user_impersonations.reason IS 'Reason for impersonation (support ticket ID, issue description, etc.)';
COMMENT ON COLUMN user_impersonations.metadata IS 'Additional metadata about the impersonation session';
COMMENT ON FUNCTION get_active_impersonation IS 'Get active impersonation session for an admin user';
COMMENT ON FUNCTION stop_impersonation IS 'Stop an active impersonation session';

