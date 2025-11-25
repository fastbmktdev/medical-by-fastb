-- ---
-- ERROR TRACKING SYSTEM MIGRATION
-- ---
-- This migration creates tables for tracking errors, performance metrics,
-- and conversion funnels for Phase 2 analytics
-- ---
-- PART 1: ERROR TRACKING TABLES
-- ---
-- Create error_severity enum
CREATE TYPE error_severity AS ENUM (
  'debug',
  'info',
  'warning',
  'error',
  'critical'
);

-- Create error_source enum
CREATE TYPE error_source AS ENUM (
  'client',
  'server',
  'api',
  'database',
  'third_party',
  'unknown'
);

-- Create error_events table for tracking errors
CREATE TABLE IF NOT EXISTS error_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Error details
  error_message TEXT NOT NULL,
  error_type TEXT,
  error_stack TEXT,
  severity error_severity NOT NULL DEFAULT 'error',
  source error_source NOT NULL DEFAULT 'unknown',
  
  -- Context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  page_url TEXT,
  component_name TEXT,
  user_agent TEXT,
  
  -- Metadata
  tags JSONB DEFAULT '{}',
  extra_data JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Indexes for common queries
  CONSTRAINT valid_error_message CHECK (char_length(error_message) > 0)
);

-- Create indexes for error_events
CREATE INDEX IF NOT EXISTS idx_error_events_user ON error_events(user_id);
CREATE INDEX IF NOT EXISTS idx_error_events_severity ON error_events(severity);
CREATE INDEX IF NOT EXISTS idx_error_events_source ON error_events(source);
CREATE INDEX IF NOT EXISTS idx_error_events_created ON error_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_events_type ON error_events(error_type);
CREATE INDEX IF NOT EXISTS idx_error_events_component ON error_events(component_name) WHERE component_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_events_tags_gin ON error_events USING GIN(tags);

-- ---
-- PART 2: PERFORMANCE METRICS TABLE
-- ---
-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metric details
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10, 2) NOT NULL,
  metric_unit TEXT NOT NULL DEFAULT 'millisecond',
  
  -- Context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url TEXT,
  component_name TEXT,
  operation_name TEXT,
  
  -- Metadata
  tags JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  CONSTRAINT valid_metric_name CHECK (char_length(metric_name) > 0),
  CONSTRAINT valid_metric_value CHECK (metric_value >= 0)
);

-- Create indexes for performance_metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created ON performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_component ON performance_metrics(component_name) WHERE component_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_performance_metrics_tags_gin ON performance_metrics USING GIN(tags);

-- ---
-- PART 3: CONVERSION FUNNELS TABLE
-- ---
-- Create funnel_status enum
CREATE TYPE funnel_status AS ENUM (
  'started',
  'in_progress',
  'completed',
  'abandoned'
);

-- Create conversion_funnels table
CREATE TABLE IF NOT EXISTS conversion_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Funnel details
  funnel_name TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  total_steps INTEGER NOT NULL,
  status funnel_status NOT NULL DEFAULT 'in_progress',
  
  -- User context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Context
  page_url TEXT,
  referrer_url TEXT,
  
  -- Timing
  time_spent_seconds INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  CONSTRAINT valid_funnel_name CHECK (char_length(funnel_name) > 0),
  CONSTRAINT valid_step_name CHECK (char_length(step_name) > 0),
  CONSTRAINT valid_step_number CHECK (step_number > 0 AND step_number <= total_steps),
  CONSTRAINT valid_total_steps CHECK (total_steps > 0)
);

-- Create indexes for conversion_funnels
CREATE INDEX IF NOT EXISTS idx_funnels_name ON conversion_funnels(funnel_name);
CREATE INDEX IF NOT EXISTS idx_funnels_user ON conversion_funnels(user_id);
CREATE INDEX IF NOT EXISTS idx_funnels_session ON conversion_funnels(session_id);
CREATE INDEX IF NOT EXISTS idx_funnels_status ON conversion_funnels(status);
CREATE INDEX IF NOT EXISTS idx_funnels_created ON conversion_funnels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnels_step ON conversion_funnels(funnel_name, step_number);

-- ---
-- PART 4: CLICK TRACKING TABLE
-- ---
-- Create click_type enum
CREATE TYPE click_type AS ENUM (
  'button',
  'link',
  'cta',
  'card',
  'image',
  'video',
  'dropdown',
  'modal',
  'navigation',
  'form_field',
  'other'
);

-- Create click_events table
CREATE TABLE IF NOT EXISTS click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Click details
  click_type click_type NOT NULL,
  element_text TEXT,
  element_id TEXT,
  element_url TEXT,
  
  -- Context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  page_url TEXT NOT NULL,
  section TEXT,
  
  -- Position (for heatmaps)
  x_position INTEGER,
  y_position INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for click_events
CREATE INDEX IF NOT EXISTS idx_click_events_type ON click_events(click_type);
CREATE INDEX IF NOT EXISTS idx_click_events_user ON click_events(user_id);
CREATE INDEX IF NOT EXISTS idx_click_events_page ON click_events(page_url);
CREATE INDEX IF NOT EXISTS idx_click_events_created ON click_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_click_events_session ON click_events(session_id);

-- ---
-- PART 5: ERROR AGGREGATION VIEW
-- ---
-- Create view for error aggregation
CREATE OR REPLACE VIEW error_aggregation AS
SELECT 
  error_type,
  severity,
  source,
  component_name,
  DATE(created_at) as error_date,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_id) as affected_users,
  COUNT(DISTINCT session_id) as affected_sessions
FROM error_events
GROUP BY error_type, severity, source, component_name, DATE(created_at);

-- ---
-- PART 6: FUNNEL ANALYTICS VIEW
-- ---
-- Create view for funnel analytics
CREATE OR REPLACE VIEW funnel_analytics AS
SELECT 
  funnel_name,
  step_number,
  step_name,
  COUNT(*) as step_entries,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) FILTER (WHERE status = 'completed') as completions,
  COUNT(*) FILTER (WHERE status = 'abandoned') as abandonments,
  AVG(time_spent_seconds) as avg_time_spent,
  DATE(created_at) as funnel_date
FROM conversion_funnels
GROUP BY funnel_name, step_number, step_name, DATE(created_at);

-- ---
-- PART 7: RLS POLICIES
-- ---
-- Enable RLS on all tables
ALTER TABLE error_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own errors
CREATE POLICY "Users can view own errors"
  ON error_events FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own errors
CREATE POLICY "Users can insert own errors"
  ON error_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Admins can view all errors
CREATE POLICY "Admins can view all errors"
  ON error_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Similar policies for other tables
CREATE POLICY "Users can view own performance metrics"
  ON performance_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance metrics"
  ON performance_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all performance metrics"
  ON performance_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own funnels"
  ON conversion_funnels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own funnels"
  ON conversion_funnels FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all funnels"
  ON conversion_funnels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own clicks"
  ON click_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clicks"
  ON click_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all clicks"
  ON click_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

