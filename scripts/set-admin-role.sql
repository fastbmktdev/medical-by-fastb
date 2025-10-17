-- Set Admin Role Script
-- Run this in Supabase SQL Editor to promote a user to admin
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID

-- Method 1: Insert or update user role to admin
INSERT INTO user_roles (user_id, role) 
VALUES ('YOUR_USER_ID_HERE', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = TIMEZONE('utc', NOW());

-- Method 2: Find user by email and set as admin
-- Uncomment and replace YOUR_EMAIL_HERE with the actual email
-- 
-- WITH user_info AS (
--   SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE'
-- )
-- INSERT INTO user_roles (user_id, role)
-- SELECT id, 'admin' FROM user_info
-- ON CONFLICT (user_id)
-- DO UPDATE SET role = 'admin', updated_at = TIMEZONE('utc', NOW());

-- Verify the admin role was set
SELECT 
  u.email,
  ur.role,
  ur.created_at,
  ur.updated_at
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'admin';

