-- Partner Payouts and Audit Logs Migration
-- Migration: 20251202000000_partner_payouts_audit_logs.sql
-- Creates supplementary tables: partner_payouts and audit_logs
-- ---
-- PART 1: PARTNER PAYOUTS TABLE
-- ---
-- Create enum for payout status
CREATE TYPE payout_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

-- Create enum for payout method
CREATE TYPE payout_method AS ENUM (
  'bank_transfer',
  'promptpay',
  'truewallet',
  'paypal',
  'other'
);

-- Create partner_payouts table
CREATE TABLE IF NOT EXISTS partner_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  
  -- Payout details
  payout_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'thb',
  status payout_status NOT NULL DEFAULT 'pending',
  payout_method payout_method,
  
  -- Commission calculation
  total_revenue DECIMAL(10, 2) NOT NULL CHECK (total_revenue >= 0),
  commission_rate DECIMAL(5, 2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  platform_fee DECIMAL(10, 2) DEFAULT 0 CHECK (platform_fee >= 0),
  net_amount DECIMAL(10, 2) NOT NULL CHECK (net_amount >= 0),
  
  -- Payment information
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  payment_reference TEXT,
  transaction_id TEXT,
  
  -- Period covered
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  
  -- Related appointments/orders (JSONB array of IDs)
  related_booking_ids UUID[] DEFAULT ARRAY[]::UUID[],
  related_order_ids UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Additional information
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Constraints
  CONSTRAINT valid_period CHECK (period_end_date >= period_start_date),
  CONSTRAINT valid_net_amount CHECK (net_amount <= total_revenue)
);

-- Indexes for partner_payouts
CREATE INDEX IF NOT EXISTS idx_partner_payouts_partner ON partner_payouts(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_hospital ON partner_payouts(hospital_id);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_gym ON partner_payouts(hospital_id); -- Backward compatibility
CREATE INDEX IF NOT EXISTS idx_partner_payouts_status ON partner_payouts(status);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_payout_number ON partner_payouts(payout_number);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_period ON partner_payouts(period_start_date, period_end_date);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_created ON partner_payouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_requested ON partner_payouts(requested_at DESC);
-- ---
-- PART 2: AUDIT LOGS TABLE
-- ---
-- Create enum for audit action types
CREATE TYPE audit_action_type AS ENUM (
  'create',
  'update',
  'delete',
  'view',
  'login',
  'logout',
  'approve',
  'reject',
  'publish',
  'unpublish',
  'activate',
  'deactivate',
  'payment',
  'refund',
  'payout',
  'status_change',
  'permission_change',
  'role_change',
  'password_change',
  'email_change',
  'data_export',
  'data_import',
  'bulk_operation',
  'system_action'
);

-- Create enum for audit resource types
CREATE TYPE audit_resource_type AS ENUM (
  'user',
  'profile',
  'hospital',
  'appointment',
  'order',
  'payment',
  'product',
  'event',
  'article',
  'ticket',
  'package',
  'promotion',
  'affiliate_conversion',
  'partner_payout',
  'notification',
  'favorite',
  'review',
  'analytics',
  'admin_action',
  'system_config',
  'other'
);

-- Create enum for audit severity
CREATE TYPE audit_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT, -- Store email as fallback if user is deleted
  user_role TEXT, -- Store role at time of action
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  
  -- Action details
  action_type audit_action_type NOT NULL,
  resource_type audit_resource_type NOT NULL,
  resource_id UUID, -- ID of the affected resource
  resource_name TEXT, -- Name/title of the resource for easier tracking
  
  -- Change details
  old_values JSONB, -- Previous state (for updates)
  new_values JSONB, -- New state (for creates/updates)
  changed_fields TEXT[], -- List of fields that changed
  
  -- Description and metadata
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  severity audit_severity DEFAULT 'medium',
  
  -- Request information
  request_method TEXT, -- GET, POST, PUT, DELETE, etc.
  request_path TEXT,
  request_params JSONB,
  
  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_date ON audit_logs(user_id, action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type_id ON audit_logs(resource_type, resource_id);

-- GIN index for JSONB fields
CREATE INDEX IF NOT EXISTS idx_audit_logs_old_values_gin ON audit_logs USING GIN(old_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_new_values_gin ON audit_logs USING GIN(new_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin ON audit_logs USING GIN(metadata);
-- ---
-- PART 3: FUNCTIONS AND TRIGGERS
-- ---
-- Function to generate payout number
CREATE OR REPLACE FUNCTION generate_payout_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_month TEXT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  new_number := 'PO' || year_month || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  -- Check if exists, regenerate if needed
  WHILE EXISTS (SELECT 1 FROM partner_payouts WHERE payout_number = new_number) LOOP
    new_number := 'PO' || year_month || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate payout_number
CREATE OR REPLACE FUNCTION set_payout_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payout_number IS NULL OR NEW.payout_number = '' THEN
    NEW.payout_number := generate_payout_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_payout_number
  BEFORE INSERT ON partner_payouts
  FOR EACH ROW
  EXECUTE FUNCTION set_payout_number();

-- Trigger to update updated_at timestamp for partner_payouts
CREATE TRIGGER update_partner_payouts_updated_at
  BEFORE UPDATE ON partner_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log audit event (helper function for application code)
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_resource_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_severity TEXT DEFAULT 'medium',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
  v_changed_fields TEXT[];
BEGIN
  -- Get user email and role
  IF p_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
    SELECT role INTO v_user_role FROM user_roles WHERE user_id = p_user_id LIMIT 1;
  END IF;
  
  -- Extract changed fields if both old and new values exist
  IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    SELECT ARRAY_AGG(key) INTO v_changed_fields
    FROM jsonb_each(p_new_values)
    WHERE value IS DISTINCT FROM (p_old_values->key);
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    user_email,
    user_role,
    action_type,
    resource_type,
    resource_id,
    resource_name,
    description,
    old_values,
    new_values,
    changed_fields,
    metadata,
    severity,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    v_user_email,
    v_user_role,
    p_action_type::audit_action_type,
    p_resource_type::audit_resource_type,
    p_resource_id,
    p_resource_name,
    COALESCE(p_description, p_action_type || ' ' || p_resource_type),
    p_old_values,
    p_new_values,
    v_changed_fields,
    p_metadata,
    p_severity::audit_severity,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ---
-- PART 4: ROW LEVEL SECURITY POLICIES
-- ---
-- Enable RLS on tables
ALTER TABLE partner_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_payouts
-- Partners can view their own payouts
CREATE POLICY "partners_can_view_own_payouts"
  ON partner_payouts FOR SELECT
  TO authenticated
  USING (auth.uid() = partner_user_id);

-- Admins can view all payouts
CREATE POLICY "admins_can_view_all_payouts"
  ON partner_payouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage payouts
CREATE POLICY "admins_can_manage_payouts"
  ON partner_payouts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for audit_logs
-- Users can view their own audit logs
CREATE POLICY "users_can_view_own_audit_logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "admins_can_view_all_audit_logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert audit logs (via service role or function)
-- Note: Service role has full access, this policy is for authenticated users
CREATE POLICY "authenticated_can_insert_audit_logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow authenticated users to log their own actions
-- Admins can insert audit logs
CREATE POLICY "admins_can_insert_audit_logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
-- ---
-- PART 5: PERMISSIONS AND GRANTS
-- ---
-- Grant permissions for partner_payouts
GRANT SELECT ON partner_payouts TO authenticated;
GRANT INSERT, UPDATE ON partner_payouts TO authenticated;

-- Grant permissions for audit_logs
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;

-- Grant execute permission on helper functions
-- Note: log_audit_event GRANT is handled in 20251112013000_update_log_audit_event_with_request_context.sql
GRANT EXECUTE ON FUNCTION generate_payout_number TO authenticated;
-- ---
-- PART 6: COMMENTS AND DOCUMENTATION
-- ---
-- Table comments
COMMENT ON TABLE partner_payouts IS 'Tracks payouts to hospital owners/partners for their appointments and revenue';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for tracking system changes, user actions, and security events';

-- Column comments for partner_payouts
COMMENT ON COLUMN partner_payouts.payout_number IS 'Unique payout reference number (format: POYYYYMMXXXX)';
COMMENT ON COLUMN partner_payouts.commission_rate IS 'Commission percentage paid to partner (0-100)';
COMMENT ON COLUMN partner_payouts.platform_fee IS 'Platform service fee deducted from revenue';
COMMENT ON COLUMN partner_payouts.net_amount IS 'Final amount paid to partner after fees';
COMMENT ON COLUMN partner_payouts.period_start_date IS 'Start date of the revenue period for this payout';
COMMENT ON COLUMN partner_payouts.period_end_date IS 'End date of the revenue period for this payout';
COMMENT ON COLUMN partner_payouts.related_booking_ids IS 'Array of appointment IDs included in this payout';
COMMENT ON COLUMN partner_payouts.related_order_ids IS 'Array of order IDs included in this payout';

-- Column comments for audit_logs
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action performed (create, update, delete, etc.)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (user, hospital, appointment, etc.)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous state of the resource (JSONB)';
COMMENT ON COLUMN audit_logs.new_values IS 'New state of the resource (JSONB)';
COMMENT ON COLUMN audit_logs.changed_fields IS 'Array of field names that changed';
COMMENT ON COLUMN audit_logs.severity IS 'Severity level of the audit event (low, medium, high, critical)';
COMMENT ON COLUMN audit_logs.user_email IS 'Email stored as fallback if user is deleted';
COMMENT ON COLUMN audit_logs.user_role IS 'User role at the time of action';

-- Function comments
COMMENT ON FUNCTION generate_payout_number IS 'Generates unique payout number in format POYYYYMMXXXX';
-- Note: log_audit_event comment is handled in 20251112013000_update_log_audit_event_with_request_context.sql
