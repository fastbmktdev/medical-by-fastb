-- Check Partner Role Promotion
-- Use this to verify that users are automatically promoted to 'partner' role
-- when they submit a gym application

-- View all users with their roles and gym applications
SELECT 
  u.id,
  u.email,
  p.username,
  p.full_name,
  ur.role,
  g.gym_name,
  g.status as gym_status,
  g.created_at as application_date,
  ur.updated_at as role_updated_at
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN gyms g ON g.user_id = u.id
ORDER BY u.created_at DESC;

-- Count users by role
SELECT 
  role,
  COUNT(*) as count
FROM user_roles
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'partner' THEN 2
    WHEN 'authenticated' THEN 3
  END;

-- View partners with their gym applications
SELECT 
  u.email,
  p.username,
  ur.role,
  g.gym_name,
  g.status,
  g.created_at as applied_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
LEFT JOIN profiles p ON p.user_id = ur.user_id
LEFT JOIN gyms g ON g.user_id = ur.user_id
WHERE ur.role = 'partner'
ORDER BY g.created_at DESC;

-- Check if trigger is working (compare timestamps)
SELECT 
  u.email,
  g.gym_name,
  g.created_at as gym_created,
  ur.updated_at as role_updated,
  ur.role,
  -- Should be very close (within seconds)
  EXTRACT(EPOCH FROM (ur.updated_at - g.created_at)) as seconds_difference
FROM gyms g
JOIN auth.users u ON u.id = g.user_id
JOIN user_roles ur ON ur.user_id = g.user_id
ORDER BY g.created_at DESC;

