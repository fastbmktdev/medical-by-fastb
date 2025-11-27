-- ============================================
-- EMAIL VERIFICATION SCRIPT
-- ============================================
-- This script provides functions to verify user email addresses
-- in Supabase without requiring the user to click on the email link.
-- Useful for testing and development.
-- ============================================

-- ============================================
-- EMAIL VERIFICATION FUNCTIONS
-- ============================================

-- Function to verify email address for a user
CREATE OR REPLACE FUNCTION public.verify_user_email(user_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  was_already_verified BOOLEAN,
  verified_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  target_user_id UUID;
  current_verified_at TIMESTAMP WITH TIME ZONE;
  result_message TEXT;
  status_code TEXT;
BEGIN
  -- Validate input
  IF user_email IS NULL OR user_email = '' THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::TEXT, 
      FALSE::BOOLEAN,
      NULL::TIMESTAMP WITH TIME ZONE,
      'ERROR'::TEXT, 
      'Email cannot be null or empty'::TEXT;
    RETURN;
  END IF;

  -- Find user by email
  SELECT id, email_confirmed_at INTO target_user_id, current_verified_at
  FROM auth.users u
  WHERE u.email = user_email;

  -- Check if user exists
  IF target_user_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      user_email, 
      FALSE::BOOLEAN,
      NULL::TIMESTAMP WITH TIME ZONE,
      'ERROR'::TEXT, 
      'User with email ' || user_email || ' not found'::TEXT;
    RETURN;
  END IF;

  -- Check if email is already verified
  IF current_verified_at IS NOT NULL THEN
    RETURN QUERY SELECT 
      target_user_id,
      user_email,
      TRUE::BOOLEAN,
      current_verified_at,
      'INFO'::TEXT,
      'Email ' || user_email || ' is already verified (verified at: ' || current_verified_at || ')'::TEXT;
    RETURN;
  END IF;

  -- Update user to verify email
  -- Note: confirmed_at is a generated column and will be updated automatically
  UPDATE auth.users u
  SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE u.id = target_user_id;

  -- Get updated verification timestamp
  SELECT u.email_confirmed_at INTO current_verified_at
  FROM auth.users u
  WHERE u.id = target_user_id;

  status_code := 'SUCCESS';
  result_message := 'Email ' || user_email || ' verified successfully';

  -- Return result
  RETURN QUERY SELECT 
    target_user_id,
    user_email,
    FALSE::BOOLEAN,
    current_verified_at,
    status_code,
    result_message;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      COALESCE(target_user_id, NULL::UUID),
      user_email,
      FALSE::BOOLEAN,
      NULL::TIMESTAMP WITH TIME ZONE,
      'ERROR'::TEXT,
      'Failed to verify email: ' || SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify multiple email addresses
CREATE OR REPLACE FUNCTION public.verify_multiple_emails(emails TEXT[])
RETURNS TABLE (
  email TEXT,
  user_id UUID,
  was_already_verified BOOLEAN,
  verified_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  email_item TEXT;
  result_record RECORD;
BEGIN
  -- Validate input
  IF emails IS NULL OR array_length(emails, 1) IS NULL THEN
    RETURN QUERY SELECT 
      NULL::TEXT,
      NULL::UUID,
      FALSE::BOOLEAN,
      NULL::TIMESTAMP WITH TIME ZONE,
      'ERROR'::TEXT,
      'No emails provided'::TEXT;
    RETURN;
  END IF;

  -- Process each email
  FOREACH email_item IN ARRAY emails
  LOOP
    BEGIN
      SELECT * INTO result_record FROM public.verify_user_email(email_item);
      
      RETURN QUERY SELECT 
        result_record.email,
        result_record.user_id,
        result_record.was_already_verified,
        result_record.verified_at,
        result_record.status,
        result_record.message;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN QUERY SELECT 
          email_item,
          NULL::UUID,
          FALSE::BOOLEAN,
          NULL::TIMESTAMP WITH TIME ZONE,
          'ERROR'::TEXT,
          'Failed to process email ' || email_item || ': ' || SQLERRM::TEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list all unverified users
CREATE OR REPLACE FUNCTION public.list_unverified_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  WHERE u.email_confirmed_at IS NULL
    AND u.deleted_at IS NULL
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check email verification status
CREATE OR REPLACE FUNCTION public.check_email_verification_status(user_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  is_verified BOOLEAN,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  message TEXT
) AS $$
DECLARE
  target_user_id UUID;
  is_verified_flag BOOLEAN;
  verified_timestamp TIMESTAMP WITH TIME ZONE;
  created_timestamp TIMESTAMP WITH TIME ZONE;
  result_message TEXT;
BEGIN
  -- Validate input
  IF user_email IS NULL OR user_email = '' THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TEXT,
      FALSE::BOOLEAN,
      NULL::TIMESTAMP WITH TIME ZONE,
      NULL::TIMESTAMP WITH TIME ZONE,
      'Email cannot be null or empty'::TEXT;
    RETURN;
  END IF;

  -- Find user by email
  SELECT 
    u.id, 
    (u.email_confirmed_at IS NOT NULL),
    u.email_confirmed_at,
    u.created_at
  INTO 
    target_user_id,
    is_verified_flag,
    verified_timestamp,
    created_timestamp
  FROM auth.users u
  WHERE u.email = user_email;

  -- Check if user exists
  IF target_user_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      user_email,
      FALSE::BOOLEAN,
      NULL::TIMESTAMP WITH TIME ZONE,
      NULL::TIMESTAMP WITH TIME ZONE,
      'User with email ' || user_email || ' not found'::TEXT;
    RETURN;
  END IF;

  -- Build result message
  IF is_verified_flag THEN
    result_message := 'Email is verified (verified at: ' || verified_timestamp || ')';
  ELSE
    result_message := 'Email is not verified';
  END IF;

  -- Return result
  RETURN QUERY SELECT 
    target_user_id,
    user_email,
    is_verified_flag,
    verified_timestamp,
    created_timestamp,
    result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.verify_user_email(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_multiple_emails(TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_unverified_users() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_email_verification_status(TEXT) TO authenticated;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- EXAMPLE 1: Verify a single email address
-- SELECT * FROM public.verify_user_email('test@example.com');

-- EXAMPLE 2: Verify multiple email addresses
-- SELECT * FROM public.verify_multiple_emails(ARRAY['test@example.com', 'user@example.com']);

-- EXAMPLE 3: List all unverified users
-- SELECT * FROM public.list_unverified_users();

-- EXAMPLE 4: Check email verification status
-- SELECT * FROM public.check_email_verification_status('test@example.com');

-- EXAMPLE 5: Quick verify for test@example.com (uncomment to run)
-- SELECT * FROM public.verify_user_email('test@example.com');

-- ============================================
-- DIRECT SQL UPDATE (Alternative method)
-- ============================================
-- If you prefer to use direct SQL UPDATE instead of the function:
-- 
-- UPDATE auth.users
-- SET 
--   email_confirmed_at = NOW(),
--   updated_at = NOW()
-- WHERE email = 'test@example.com'
--   AND email_confirmed_at IS NULL;
-- 
-- Note: confirmed_at is a generated column and will be updated automatically
--
-- To verify the update:
-- SELECT id, email, email_confirmed_at, created_at
-- FROM auth.users
-- WHERE email = 'test@example.com';

-- ============================================
-- END OF EMAIL VERIFICATION SCRIPT
-- ============================================

