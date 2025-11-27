-- Enable Supabase Realtime Extension
-- This migration enables the Realtime extension for Supabase
-- The _realtime table will be created automatically by Supabase

-- Enable the Realtime extension
CREATE EXTENSION IF NOT EXISTS "realtime" WITH SCHEMA "realtime";

-- Grant necessary permissions
GRANT USAGE ON SCHEMA realtime TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA realtime TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA realtime TO postgres, anon, authenticated, service_role;

-- Note: The _realtime table is an internal Supabase table that gets created automatically
-- If you see a warning about it, it's usually safe to ignore in local development
-- The table will be created when Supabase Realtime service starts

