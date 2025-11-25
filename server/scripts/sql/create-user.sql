-- ============================================
-- USER CREATION SCRIPT
-- ============================================
-- This script provides functions to create users in the database
-- It includes functions for creating users with different roles
-- and comprehensive error handling
-- ============================================

-- ============================================
-- USER CREATION FUNCTIONS
-- ============================================

-- Function to create a user with profile and role
CREATE OR REPLACE FUNCTION public.create_user_with_profile(
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT DEFAULT NULL,
  user_username TEXT DEFAULT NULL,
  user_phone TEXT DEFAULT NULL,
  user_role TEXT DEFAULT 'authenticated',
  user_avatar_url TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT,
  full_name TEXT,
  role TEXT,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  new_user_id UUID;
  result_message TEXT;
  status_code TEXT;
BEGIN
  -- Validate input
  IF user_email IS NULL OR user_email = '' THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::TEXT, 
      NULL::TEXT, 
      NULL::TEXT, 
      NULL::TEXT, 
      'ERROR'::TEXT, 
      'Email cannot be null or empty'::TEXT;
    RETURN;
  END IF;

  IF user_password IS NULL OR user_password = '' THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::TEXT, 
      NULL::TEXT, 
      NULL::TEXT, 
      NULL::TEXT, 
      'ERROR'::TEXT, 
      'Password cannot be null or empty'::TEXT;
    RETURN;
  END IF;

  -- Validate role
  IF user_role NOT IN ('authenticated', 'partner', 'admin') THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::TEXT, 
      NULL::TEXT, 
      NULL::TEXT, 
      NULL::TEXT, 
      'ERROR'::TEXT, 
      'Invalid role. Must be authenticated, partner, or admin'::TEXT;
    RETURN;
  END IF;

  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      user_email, 
      NULL::TEXT, 
      NULL::TEXT, 
      NULL::TEXT, 
      'ERROR'::TEXT, 
      'User with email ' || user_email || ' already exists'::TEXT;
    RETURN;
  END IF;

  -- Check if username is already taken (if provided)
  IF user_username IS NOT NULL AND user_username != '' THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = user_username) THEN
      RETURN QUERY SELECT 
        NULL::UUID, 
        user_email, 
        NULL::TEXT, 
        NULL::TEXT, 
        NULL::TEXT, 
        'ERROR'::TEXT, 
        'Username ' || user_username || ' is already taken'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Create user in auth.users
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      confirmed_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),
      NULL,
      '',
      NULL,
      '',
      NULL,
      '',
      '',
      NULL,
      NULL,
      '{"provider": "email", "providers": ["email"]}',
      json_build_object(
        'full_name', COALESCE(user_full_name, ''),
        'username', COALESCE(user_username, ''),
        'phone', COALESCE(user_phone, ''),
        'avatar_url', COALESCE(user_avatar_url, '')
      ),
      FALSE,
      NOW(),
      NOW(),
      COALESCE(user_phone, ''),
      CASE WHEN user_phone IS NOT NULL THEN NOW() ELSE NULL END,
      '',
      '',
      NULL,
      NOW(),
      '',
      0,
      NULL,
      '',
      NULL,
      FALSE,
      NULL
    ) RETURNING id INTO new_user_id;

    -- Create profile
    INSERT INTO public.profiles (
      user_id,
      username,
      full_name,
      phone,
      avatar_url
    ) VALUES (
      new_user_id,
      user_username,
      user_full_name,
      user_phone,
      user_avatar_url
    );

    -- Create user role
    INSERT INTO public.user_roles (
      user_id,
      role
    ) VALUES (
      new_user_id,
      user_role
    );

    -- Initialize user points for gamification
    INSERT INTO public.user_points (
      user_id,
      total_points,
      current_level,
      points_to_next_level
    ) VALUES (
      new_user_id,
      0,
      1,
      100
    );

    status_code := 'SUCCESS';
    result_message := 'User created successfully';

  EXCEPTION
    WHEN OTHERS THEN
      status_code := 'ERROR';
      result_message := 'Failed to create user: ' || SQLERRM;
      new_user_id := NULL;
  END;

  -- Return result
  RETURN QUERY SELECT 
    new_user_id,
    user_email,
    user_username,
    user_full_name,
    user_role,
    status_code,
    result_message;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create multiple users at once
CREATE OR REPLACE FUNCTION public.create_multiple_users(
  users_data JSONB
)
RETURNS TABLE (
  email TEXT,
  username TEXT,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  user_record JSONB;
  result_record RECORD;
BEGIN
  -- Validate input
  IF users_data IS NULL OR jsonb_array_length(users_data) = 0 THEN
    RETURN QUERY SELECT 
      NULL::TEXT, 
      NULL::TEXT, 
      'ERROR'::TEXT, 
      'No user data provided'::TEXT;
    RETURN;
  END IF;

  -- Process each user
  FOR user_record IN SELECT * FROM jsonb_array_elements(users_data)
  LOOP
    BEGIN
      SELECT * INTO result_record FROM public.create_user_with_profile(
        user_record->>'email',
        user_record->>'password',
        user_record->>'full_name',
        user_record->>'username',
        user_record->>'phone',
        COALESCE(user_record->>'role', 'authenticated'),
        user_record->>'avatar_url'
      );

      RETURN QUERY SELECT 
        result_record.email,
        result_record.username,
        result_record.status,
        result_record.message;

    EXCEPTION
      WHEN OTHERS THEN
        RETURN QUERY SELECT 
          COALESCE(user_record->>'email', 'unknown'),
          COALESCE(user_record->>'username', 'unknown'),
          'ERROR'::TEXT,
          'Failed to process user: ' || SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create test users for development
CREATE OR REPLACE FUNCTION public.create_test_users()
RETURNS TABLE (
  email TEXT,
  username TEXT,
  role TEXT,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  test_users JSONB;
  result_record RECORD;
BEGIN
  -- Define test users
  test_users := '[
    {
      "email": "admin@medical.com",
      "password": "admin123456",
      "full_name": "Admin User",
      "username": "admin",
      "phone": "+66812345678",
      "role": "admin"
    },
    {
      "email": "partner@medical.com",
      "password": "partner123456",
      "full_name": "Partner User",
      "username": "partner",
      "phone": "+66887654321",
      "role": "partner"
    },
    {
      "email": "user@medical.com",
      "password": "user123456",
      "full_name": "Regular User",
      "username": "user",
      "phone": "+66811111111",
      "role": "authenticated"
    },
    {
      "email": "hospitalowner@medical.com",
      "password": "hospital123456",
      "full_name": "hospital Owner",
      "username": "hospitalowner",
      "phone": "+66822222222",
      "role": "authenticated"
    },
    {
      "email": "doctor@medical.com",
      "password": "trainer123456",
      "full_name": "Medical doctor",
      "username": "doctor",
      "phone": "+66833333333",
      "role": "authenticated"
    }
  ]'::JSONB;

  -- Create all test users
  FOR result_record IN 
    SELECT * FROM public.create_multiple_users(test_users)
  LOOP
    RETURN QUERY SELECT 
      result_record.email,
      result_record.username,
      'test'::TEXT,
      result_record.status,
      result_record.message;
  END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user exists
CREATE OR REPLACE FUNCTION public.user_exists(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM auth.users WHERE email = user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user details
CREATE OR REPLACE FUNCTION public.get_user_details(user_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    p.username,
    p.full_name,
    p.phone,
    ur.role,
    p.avatar_url,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.user_id
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.create_user_with_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_multiple_users(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_test_users() TO service_role;
GRANT EXECUTE ON FUNCTION public.user_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_details(TEXT) TO authenticated;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- EXAMPLE 1: Create a single user
-- SELECT * FROM public.create_user_with_profile(
--   'newuser@example.com',
--   'password123',
--   'John Doe',
--   'johndoe',
--   '+66812345678',
--   'authenticated'
-- );

-- EXAMPLE 2: Create an admin user
-- SELECT * FROM public.create_user_with_profile(
--   'admin@example.com',
--   'adminpassword123',
--   'Admin User',
--   'admin',
--   '+66887654321',
--   'admin'
-- );

-- EXAMPLE 3: Create multiple users
-- SELECT * FROM public.create_multiple_users('[
--   {
--     "email": "user1@example.com",
--     "password": "password123",
--     "full_name": "User One",
--     "username": "user1",
--     "role": "authenticated"
--   },
--   {
--     "email": "user2@example.com",
--     "password": "password123",
--     "full_name": "User Two",
--     "username": "user2",
--     "role": "authenticated"
--   }
-- ]'::JSONB);

-- EXAMPLE 4: Create test users for development
-- SELECT * FROM public.create_test_users();

-- EXAMPLE 5: Check if user exists
-- SELECT public.user_exists('user@example.com');

-- EXAMPLE 6: Get user details
-- SELECT * FROM public.get_user_details('user@example.com');

-- ============================================
-- QUICK SETUP FOR DEVELOPMENT
-- ============================================

-- Uncomment the line below to create test users immediately
-- SELECT * FROM public.create_test_users();

-- ============================================
-- END OF USER CREATION SCRIPT
-- ============================================
