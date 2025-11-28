-- ============================================================================
-- Fix get_user_by_username_or_email Function
-- ============================================================================
-- This migration ensures the get_user_by_username_or_email function exists
-- and is properly accessible in the schema cache
-- Also ensures required tables (profiles) exist before creating the function
-- ============================================================================

-- Ensure profiles table exists (create if it doesn't)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT username_length CHECK (username IS NULL OR (char_length(username) >= 3 AND char_length(username) <= 30)),
  CONSTRAINT username_format CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_-]+$')
);

-- Add phone column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop the function if it exists (both with and without public schema prefix)
DROP FUNCTION IF EXISTS public.get_user_by_username_or_email(TEXT);
DROP FUNCTION IF EXISTS get_user_by_username_or_email(TEXT);

-- Create the function with explicit schema and proper security settings
-- This function handles both username and email lookup, and works even if profile doesn't exist
CREATE OR REPLACE FUNCTION public.get_user_by_username_or_email(identifier TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id::UUID as user_id,
    u.email::TEXT as email,
    COALESCE(p.username, '')::TEXT as username
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE (
    -- Match by email
    u.email = identifier
    -- OR match by username (if profile exists and username is not null)
    OR (p.username IS NOT NULL AND p.username = identifier)
  )
  AND u.deleted_at IS NULL
  LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_by_username_or_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_username_or_email(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_username_or_email(TEXT) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_user_by_username_or_email IS 
'Find user by username or email for authentication purposes. Returns user_id, email, and username. Only returns active (non-deleted) users.';

-- ============================================================================
-- Create missing profiles for existing users
-- ============================================================================
-- This ensures all existing users have a profile record, which is required
-- for username-based login to work
INSERT INTO public.profiles (user_id, username, full_name, phone, avatar_url)
SELECT 
  u.id,
  u.raw_user_meta_data->>'username',
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'phone',
  u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
  )
ON CONFLICT (user_id) DO NOTHING;

