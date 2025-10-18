-- ============================================
-- Admin Helper Functions
-- ============================================
-- Helper functions to manage admin users
-- ============================================

-- Function to promote user to admin by email
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  target_user_id UUID;
  result_message TEXT;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  -- Check if user exists
  IF target_user_id IS NULL THEN
    RETURN 'ERROR: User with email ' || user_email || ' not found.';
  END IF;

  -- Check if user already has a role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id) THEN
    -- Update existing role to admin
    UPDATE public.user_roles
    SET role = 'admin', updated_at = NOW()
    WHERE user_id = target_user_id;

    result_message := 'SUCCESS: User ' || user_email || ' has been promoted to admin.';
  ELSE
    -- Insert new admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin');

    result_message := 'SUCCESS: Admin role created for user ' || user_email || '.';
  END IF;

  RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote admin to regular user
CREATE OR REPLACE FUNCTION public.demote_from_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  target_user_id UUID;
  result_message TEXT;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  -- Check if user exists
  IF target_user_id IS NULL THEN
    RETURN 'ERROR: User with email ' || user_email || ' not found.';
  END IF;

  -- Update role to authenticated
  UPDATE public.user_roles
  SET role = 'authenticated', updated_at = NOW()
  WHERE user_id = target_user_id;

  result_message := 'SUCCESS: User ' || user_email || ' has been demoted to regular user.';

  RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user's role
CREATE OR REPLACE FUNCTION public.check_user_role(user_email TEXT)
RETURNS TABLE (
  email TEXT,
  username TEXT,
  role TEXT,
  role_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.email::TEXT,
    p.username,
    ur.role::TEXT,
    ur.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions (only to authenticated users for security)
GRANT EXECUTE ON FUNCTION public.promote_to_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demote_from_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_role(TEXT) TO authenticated;

-- ============================================
-- Usage Examples:
-- ============================================
-- To promote a user to admin:
-- SELECT public.promote_to_admin('user@example.com');

-- To demote an admin to regular user:
-- SELECT public.demote_from_admin('admin@example.com');

-- To check a user's role:
-- SELECT * FROM public.check_user_role('user@example.com');

-- To list all admins:
-- SELECT u.email, u.created_at, ur.role
-- FROM auth.users u
-- JOIN public.user_roles ur ON u.id = ur.user_id
-- WHERE ur.role = 'admin';
-- ============================================
