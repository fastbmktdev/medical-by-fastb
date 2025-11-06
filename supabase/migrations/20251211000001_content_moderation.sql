-- Content Moderation System Migration
-- Migration: 20251211000001_content_moderation.sql
-- Creates tables and functions for content moderation (flagging, reviewing, moderating user-generated content)
-- ---
-- PART 1: CONTENT FLAGS TABLE
-- ---
-- Create content_flags table for reporting/flagging content
CREATE TABLE IF NOT EXISTS content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content reference
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'gym', 'review', 'comment', 'product', 'event', 'user_profile', 'message')),
  content_id UUID NOT NULL,
  
  -- Flag details
  flag_type TEXT NOT NULL CHECK (flag_type IN ('spam', 'inappropriate', 'harassment', 'false_information', 'copyright', 'other')),
  reason TEXT,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Moderation status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'resolved')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  moderation_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context (content snapshot, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  CONSTRAINT unique_user_flag UNIQUE(content_type, content_id, reported_by, flag_type)
);

-- Indexes for content flags
CREATE INDEX IF NOT EXISTS idx_content_flags_type_id ON content_flags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_status ON content_flags(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_flags_reported_by ON content_flags(reported_by);
CREATE INDEX IF NOT EXISTS idx_content_flags_reviewed_by ON content_flags(reviewed_by);

-- ---
-- PART 2: CONTENT MODERATION LOG TABLE
-- ---
-- Create content_moderation_log table for tracking moderation actions
CREATE TABLE IF NOT EXISTS content_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content reference
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  
  -- Moderation action
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'flag', 'unflag', 'delete', 'edit', 'hide', 'unhide')),
  action_reason TEXT,
  
  -- Moderator
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Related flag (if action is from a flag)
  flag_id UUID REFERENCES content_flags(id) ON DELETE SET NULL,
  
  -- Content snapshot before action (for audit)
  content_snapshot JSONB,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for moderation log
CREATE INDEX IF NOT EXISTS idx_moderation_log_type_id ON content_moderation_log(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_moderated_by ON content_moderation_log(moderated_by);
CREATE INDEX IF NOT EXISTS idx_moderation_log_created ON content_moderation_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_log_flag ON content_moderation_log(flag_id);

-- ---
-- PART 3: FUNCTIONS
-- ---
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_content_flags_updated_at
  BEFORE UPDATE ON content_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_content_flags_updated_at();

-- Function to auto-log moderation actions
CREATE OR REPLACE FUNCTION log_content_moderation()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be called manually to log moderation actions
  -- It will be used by application code, not as a trigger
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ---
-- PART 4: ROW LEVEL SECURITY POLICIES
-- ---
-- Enable RLS
ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_log ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create flags (report content)
CREATE POLICY "Anyone can create content flags"
  ON content_flags FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Policy: Users can view their own flags
CREATE POLICY "Users can view own flags"
  ON content_flags FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());

-- Policy: Admins can view all flags
CREATE POLICY "Admins can view all flags"
  ON content_flags FOR SELECT
  TO authenticated
  USING (is_admin());

-- Policy: Admins can manage all flags
CREATE POLICY "Admins can manage all flags"
  ON content_flags FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Policy: Admins can view moderation logs
CREATE POLICY "Admins can view moderation logs"
  ON content_moderation_log FOR SELECT
  TO authenticated
  USING (is_admin());

-- Policy: Admins can create moderation logs
CREATE POLICY "Admins can create moderation logs"
  ON content_moderation_log FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- ---
-- PART 5: COMMENTS
-- ---
COMMENT ON TABLE content_flags IS 'User-reported content flags for moderation review';
COMMENT ON TABLE content_moderation_log IS 'Log of all content moderation actions for audit trail';
COMMENT ON COLUMN content_flags.content_type IS 'Type of content being flagged: article, gym, review, comment, product, event, user_profile, message';
COMMENT ON COLUMN content_flags.flag_type IS 'Type of flag: spam, inappropriate, harassment, false_information, copyright, other';
COMMENT ON COLUMN content_flags.status IS 'Moderation status: pending, reviewed, approved, rejected, resolved';

