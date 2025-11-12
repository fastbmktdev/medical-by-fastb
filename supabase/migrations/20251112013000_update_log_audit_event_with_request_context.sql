-- ---
-- Migration: Update log_audit_event to capture request context and result metadata
-- ---

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
  p_user_agent TEXT DEFAULT NULL,
  p_request_method TEXT DEFAULT NULL,
  p_request_path TEXT DEFAULT NULL,
  p_request_params JSONB DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
  v_changed_fields TEXT[];
BEGIN
  -- Get user email and role if available
  IF p_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
    SELECT role INTO v_user_role FROM user_roles WHERE user_id = p_user_id LIMIT 1;
  END IF;

  -- Extract changed fields when both old and new values are provided
  IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    SELECT ARRAY_AGG(key) INTO v_changed_fields
    FROM jsonb_each(p_new_values)
    WHERE value IS DISTINCT FROM (p_old_values -> key);
  END IF;

  -- Insert audit log entry
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
    user_agent,
    request_method,
    request_path,
    request_params,
    success,
    error_message,
    session_id
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
    COALESCE(p_metadata, '{}'::JSONB),
    p_severity::audit_severity,
    p_ip_address,
    p_user_agent,
    p_request_method,
    p_request_path,
    COALESCE(p_request_params, '{}'::JSONB),
    COALESCE(p_success, TRUE),
    p_error_message,
    p_session_id
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_audit_event(
  UUID,
  TEXT,
  TEXT,
  UUID,
  TEXT,
  TEXT,
  JSONB,
  JSONB,
  JSONB,
  TEXT,
  INET,
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  BOOLEAN,
  TEXT,
  TEXT
) IS 'Helper function to log audit events with user context, change tracking, and request metadata';

