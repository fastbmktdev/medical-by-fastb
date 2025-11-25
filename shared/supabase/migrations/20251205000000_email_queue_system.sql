-- ---
-- EMAIL QUEUE SYSTEM MIGRATION
-- ---
-- This migration creates an email queue system for managing email sending
-- with retry logic, priority, and status tracking
-- Create enum for email status
CREATE TYPE email_status AS ENUM (
  'pending',
  'processing',
  'sent',
  'failed',
  'cancelled'
);

-- Create enum for email priority
CREATE TYPE email_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- Create enum for email type
CREATE TYPE email_type AS ENUM (
  'verification',
  'booking_confirmation',
  'booking_reminder',
  'payment_receipt',
  'payment_failed',
  'partner_approval',
  'partner_rejection',
  'admin_alert',
  'contact_form',
  'welcome',
  'other'
);

-- Create email_queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Email details
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  from_email TEXT,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  
  -- Queue metadata
  email_type email_type NOT NULL DEFAULT 'other',
  priority email_priority NOT NULL DEFAULT 'normal',
  status email_status NOT NULL DEFAULT 'pending',
  
  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- Provider info
  provider TEXT DEFAULT 'smtp', -- 'smtp' or 'resend'
  provider_message_id TEXT,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  related_resource_type TEXT, -- 'appointment', 'payment', 'partner_application', etc.
  related_resource_id UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Constraints
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0),
  CONSTRAINT valid_max_retries CHECK (max_retries >= 0),
  CONSTRAINT valid_scheduled_at CHECK (scheduled_at IS NOT NULL)
);

-- Indexes for email_queue
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_next_retry_at ON email_queue(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority DESC, scheduled_at ASC);
CREATE INDEX IF NOT EXISTS idx_email_queue_type ON email_queue(email_type);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(status, priority DESC, scheduled_at ASC) 
  WHERE status IN ('pending', 'processing');

-- Composite index for efficient queue processing
-- Note: Cannot use NOW() in index predicate, so we index on status and next_retry_at separately
CREATE INDEX IF NOT EXISTS idx_email_queue_processing ON email_queue(status, next_retry_at, priority DESC)
  WHERE status IN ('pending', 'failed');

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate next retry time (exponential backoff)
CREATE OR REPLACE FUNCTION calculate_next_retry_time(
  p_retry_count INTEGER,
  p_base_delay_minutes INTEGER DEFAULT 5
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_delay_minutes INTEGER;
  v_next_retry TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Exponential backoff: 5min, 10min, 20min, 40min, etc.
  v_delay_minutes := p_base_delay_minutes * POWER(2, p_retry_count);
  
  -- Cap at 24 hours
  IF v_delay_minutes > 1440 THEN
    v_delay_minutes := 1440;
  END IF;
  
  v_next_retry := NOW() + (v_delay_minutes || ' minutes')::INTERVAL;
  
  RETURN v_next_retry;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
-- ---
-- ROW LEVEL SECURITY POLICIES
-- ---
-- Enable RLS on email_queue
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Users can view their own queued emails
CREATE POLICY "users_can_view_own_email_queue"
  ON email_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all email queue items
CREATE POLICY "admins_can_view_all_email_queue"
  ON email_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can manage all email queue items
-- (This is implicit - service role bypasses RLS)
-- ---
-- PERMISSIONS AND GRANTS
-- ---
-- Grant permissions for email_queue
GRANT SELECT ON email_queue TO authenticated;
GRANT INSERT ON email_queue TO authenticated;

-- Service role has full access (implicit)
-- ---
-- COMMENTS AND DOCUMENTATION
-- ---
COMMENT ON TABLE email_queue IS 'Queue system for managing email sending with retry logic and priority';
COMMENT ON COLUMN email_queue.status IS 'Current status of the email (pending, processing, sent, failed, cancelled)';
COMMENT ON COLUMN email_queue.priority IS 'Email priority level (low, normal, high, urgent)';
COMMENT ON COLUMN email_queue.email_type IS 'Type of email for categorization and preference checking';
COMMENT ON COLUMN email_queue.retry_count IS 'Number of retry attempts made';
COMMENT ON COLUMN email_queue.max_retries IS 'Maximum number of retry attempts before giving up';
COMMENT ON COLUMN email_queue.next_retry_at IS 'Next scheduled retry time (exponential backoff)';
COMMENT ON COLUMN email_queue.scheduled_at IS 'When the email should be sent';
COMMENT ON COLUMN email_queue.provider IS 'Email provider used (smtp or resend)';
COMMENT ON COLUMN email_queue.related_resource_type IS 'Type of related resource (appointment, payment, etc.)';
COMMENT ON COLUMN email_queue.related_resource_id IS 'ID of related resource';

COMMENT ON FUNCTION calculate_next_retry_time IS 'Calculates next retry time using exponential backoff algorithm';
