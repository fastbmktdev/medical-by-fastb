-- ---
-- Migrate All User Roles
-- ---
-- This migration ensures all users in auth.users have corresponding roles in user_roles table
-- It will:
-- 1. Create user_roles for any users missing roles (default to 'authenticated')
-- 2. Validate and fix any invalid roles
-- 3. Ensure data consistency across the system
-- ---

-- Step 1: Create user_roles for users who don't have one yet
-- This handles cases where users were created before the trigger was set up
-- or cases where the trigger failed
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT 
  au.id as user_id,
  'authenticated' as role,
  COALESCE(au.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Fix any invalid roles (roles that don't match the constraint)
-- This ensures all roles are valid: 'authenticated', 'partner', or 'admin'
UPDATE public.user_roles
SET 
  role = 'authenticated',
  updated_at = NOW()
WHERE role NOT IN ('authenticated', 'partner', 'admin');

-- Step 3: Ensure users who have hospitals with status 'approved' have 'partner' role
-- This fixes any inconsistencies where hospital was approved but role wasn't updated
UPDATE public.user_roles ur
SET 
  role = 'partner',
  updated_at = NOW()
FROM public.hospitals g
WHERE ur.user_id = g.user_id
  AND g.status = 'approved'
  AND ur.role = 'authenticated';

-- Step 4: Add comment to track migration
COMMENT ON TABLE user_roles IS 'User roles table - migrated on 2025-12-12 to ensure all users have roles';

-- Step 5: Create a helpful function to check for users without roles
CREATE OR REPLACE FUNCTION check_users_without_roles()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email::TEXT,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id
  WHERE ur.user_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION check_users_without_roles IS 'Helper function to check for users without roles in user_roles table';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_users_without_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION check_users_without_roles() TO service_role;

-- Step 6: Create a function to get role statistics
CREATE OR REPLACE FUNCTION get_role_statistics()
RETURNS TABLE (
  role TEXT,
  user_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.role::TEXT,
    COUNT(*)::BIGINT as user_count
  FROM public.user_roles ur
  GROUP BY ur.role
  ORDER BY ur.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION get_role_statistics IS 'Get count of users per role';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_role_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_role_statistics() TO service_role;

