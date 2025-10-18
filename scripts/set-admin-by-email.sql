-- Set User as Admin by Email
-- Run this in Supabase SQL Editor to promote a user to admin

-- Replace 'admin@gmail.com' with the actual email

-- Method: Update user_roles by email
WITH user_info AS (
  SELECT id FROM auth.users WHERE email = 'admin@gmail.com'
)
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM user_info
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin', updated_at = TIMEZONE('utc', NOW());

-- Verify the admin role was set
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  ur.role,
  ur.created_at,
  ur.updated_at
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'admin@gmail.com';
