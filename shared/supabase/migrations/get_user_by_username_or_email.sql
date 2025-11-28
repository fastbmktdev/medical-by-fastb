-- ============================================================================
-- Name: get_user_by_username_or_email
-- Description: Find user by username or email for authentication purposes.
--              Returns user_id, email, and username.
--              Only returns active (non-deleted) users.
-- Returns: TABLE (user_id UUID, email TEXT, username TEXT)
-- ============================================================================
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
  SELECT p.user_id, u.email, p.username
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE (p.username = identifier OR u.email = identifier)
    AND u.deleted_at IS NULL
  LIMIT 1;
END;
$$;