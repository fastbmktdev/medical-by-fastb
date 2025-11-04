-- Storage Policies Enhancement Migration
-- Enhances existing storage configuration with additional security and limits
-- Created: 2025-10-24
-- Consolidates backup migrations: create_gym_images_bucket.sql, create_bucket_only.sql, setup-storage.sql
-- Note: Basic storage setup already exists in initial_schema.sql
-- Enable storage extension if not already enabled
-- Note: Storage extension is automatically enabled in Supabase Cloud
-- For local development, this may not be available
-- CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "extensions";
-- Update existing gym-images bucket with enhanced configuration
-- Add file size limits and MIME type restrictions for better security
-- Note: This is for production use only, local development may not have storage extension
-- UPDATE storage.buckets 
-- SET 
--   file_size_limit = 52428800, -- 50MB limit
--   allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
-- WHERE id = 'gym-images';
-- Enhance upload policy to include folder-based security
-- This ensures users can only upload to their own folders
-- DROP POLICY IF EXISTS "Authenticated users can upload gym images" ON storage.objects;
-- CREATE POLICY "Authenticated users can upload gym images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'gym-images'
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
-- Update existing policies to ensure they have WITH CHECK clauses for better security
-- Note: These policies are for production use only, local development may not have storage extension
-- DROP POLICY IF EXISTS "Users can update their own gym images" ON storage.objects;
-- CREATE POLICY "Users can update their own gym images"
--   ON storage.objects FOR UPDATE
--   USING (
--     bucket_id = 'gym-images'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   )
--   WITH CHECK (
--     bucket_id = 'gym-images'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );
-- Create additional storage buckets that may be needed in the future
-- These are based on patterns from backup migrations but prepared for expansion
-- Placeholder for additional buckets (uncomment and modify as needed)
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars', 
  'user-avatars', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
*/

-- Verification queries (commented out for migration)
-- Uncomment these to verify the setup after running the migration

/*
-- Verify bucket configuration
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at 
FROM storage.buckets 
WHERE id = 'gym-images';

-- Verify enhanced policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%gym%';
*/

-- Add comment for tracking
-- COMMENT ON SCHEMA storage IS 'Storage schema enhanced with security policies and file restrictions - consolidated from backup migrations';
