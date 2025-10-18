-- ============================================
-- Set an Existing User as Admin Script
-- ============================================
-- Usage:
-- 1. Sign up a user through your app if they do not exist.
-- 2. Replace 'admin@example.com' in admin_email below with the target user's email.
-- 3. Run this script in the Supabase SQL Editor.
-- ============================================

-- Set admin email here
DO $$
DECLARE
  admin_email TEXT := 'admin@example.com'; -- <-- CHANGE THIS TO THE ADMIN USER'S EMAIL
  admin_user_id UUID;
BEGIN
  -- Attempt to lookup user id based on email
  SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please create the user first.', admin_email;
  END IF;

  -- Upsert to admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE
    SET role = 'admin',
        updated_at = NOW();

  RAISE NOTICE 'User % has been granted admin role.', admin_email;
END $$;

-- ============================================
-- Verification Query
-- ============================================
-- To confirm admin assignment, run:
-- SELECT u.email, ur.role, ur.created_at
-- FROM auth.users u
-- JOIN public.user_roles ur ON u.id = ur.user_id
-- WHERE u.email = 'admin@example.com';

-- ============================================
