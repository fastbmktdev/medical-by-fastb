-- ============================================================================
-- SCHEDULED REPORTS & CUSTOM REPORTS SYSTEM MIGRATION
-- ============================================================================
-- This migration creates tables for managing custom report configurations
-- and scheduled report generation

-- Create enum for report schedule frequency
CREATE TYPE report_schedule_frequency AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom'
);

-- Create enum for report status
CREATE TYPE report_status AS ENUM (
  'active',
  'paused',
  'completed',
  'failed',
  'deleted'
);

-- Create enum for report format
CREATE TYPE report_format AS ENUM (
  'pdf',
  'csv',
  'excel'
);

-- Create custom_reports table (saved custom report configurations)
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Report configuration
  name TEXT NOT NULL,
  description TEXT,
  table_name TEXT NOT NULL, -- Table to report on
  columns TEXT[] NOT NULL, -- Selected columns
  column_headers TEXT[], -- Custom headers for columns
  
  -- Filters (stored as JSONB for flexibility)
  filters JSONB DEFAULT '{}', -- { dateFrom, dateTo, status, etc. }
  
  -- Format and options
  format report_format NOT NULL DEFAULT 'pdf',
  include_summary BOOLEAN DEFAULT FALSE,
  include_charts BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Constraints
  CONSTRAINT valid_columns CHECK (array_length(columns, 1) > 0)
);

-- Create scheduled_reports table
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_report_id UUID REFERENCES custom_reports(id) ON DELETE SET NULL, -- If based on custom report
  
  -- Report configuration (if not using custom_report_id)
  name TEXT NOT NULL,
  description TEXT,
  table_name TEXT NOT NULL,
  columns TEXT[],
  column_headers TEXT[],
  filters JSONB DEFAULT '{}',
  format report_format NOT NULL DEFAULT 'pdf',
  
  -- Schedule configuration
  frequency report_schedule_frequency NOT NULL,
  schedule_config JSONB NOT NULL DEFAULT '{}', -- { dayOfWeek, dayOfMonth, time, timezone, etc. }
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  
  -- Recipients
  recipients TEXT[] NOT NULL, -- Array of email addresses
  cc_recipients TEXT[],
  bcc_recipients TEXT[],
  
  -- Status and execution
  status report_status NOT NULL DEFAULT 'active',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Execution tracking
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_recipients CHECK (array_length(recipients, 1) > 0),
  CONSTRAINT valid_schedule_config CHECK (schedule_config IS NOT NULL)
);

-- Create scheduled_report_executions table (history of report generations)
CREATE TABLE IF NOT EXISTS scheduled_report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id UUID NOT NULL REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  
  -- Execution details
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  
  -- Results
  rows_processed INTEGER,
  file_url TEXT, -- URL to generated report file (stored in storage)
  file_size_bytes BIGINT,
  error_message TEXT,
  error_details JSONB,
  
  -- Email delivery
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_recipients TEXT[],
  email_queue_id UUID, -- Reference to email_queue if email was queued
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('running', 'completed', 'failed'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_reports_created_by ON custom_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_reports_table_name ON custom_reports(table_name);
CREATE INDEX IF NOT EXISTS idx_custom_reports_created_at ON custom_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_created_by ON scheduled_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_status ON scheduled_reports(status, is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run_at ON scheduled_reports(next_run_at) WHERE is_active = TRUE AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_custom_report_id ON scheduled_reports(custom_report_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_report_executions_report_id ON scheduled_report_executions(scheduled_report_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_report_executions_started_at ON scheduled_report_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_report_executions_status ON scheduled_report_executions(status);

-- Triggers to update updated_at timestamp
CREATE TRIGGER update_custom_reports_updated_at
  BEFORE UPDATE ON custom_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at
  BEFORE UPDATE ON scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_report_executions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own custom reports
CREATE POLICY "users_can_manage_own_custom_reports"
  ON custom_reports FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Admins can see all custom reports
CREATE POLICY "admins_can_see_all_custom_reports"
  ON custom_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Users can only see their own scheduled reports
CREATE POLICY "users_can_manage_own_scheduled_reports"
  ON scheduled_reports FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Admins can see all scheduled reports
CREATE POLICY "admins_can_see_all_scheduled_reports"
  ON scheduled_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Users can see executions of their own scheduled reports
CREATE POLICY "users_can_see_own_report_executions"
  ON scheduled_report_executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_reports
      WHERE scheduled_reports.id = scheduled_report_executions.scheduled_report_id
        AND scheduled_reports.created_by = auth.uid()
    )
  );

-- Admins can see all report executions
CREATE POLICY "admins_can_see_all_report_executions"
  ON scheduled_report_executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- ============================================================================
-- PERMISSIONS AND GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON custom_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduled_reports TO authenticated;
GRANT SELECT ON scheduled_report_executions TO authenticated;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE custom_reports IS 'Saved custom report configurations that can be reused';
COMMENT ON TABLE scheduled_reports IS 'Scheduled automatic report generation and email delivery';
COMMENT ON TABLE scheduled_report_executions IS 'Execution history for scheduled reports';
COMMENT ON COLUMN scheduled_reports.schedule_config IS 'JSONB configuration: { dayOfWeek: 1-7, dayOfMonth: 1-31, time: "HH:MM", timezone: "Asia/Bangkok" }';
COMMENT ON COLUMN custom_reports.filters IS 'JSONB filters: { dateFrom, dateTo, status, role, etc. }';
