-- ============================================================================
-- CONSOLIDATED STORAGE CONFIGURATION SCRIPT
-- ============================================================================
-- 
-- This script consolidates all storage-related functionality including:
-- - Bucket creation and configuration
-- - Storage policies for access control
-- - Verification queries and error handling
-- - Rollback procedures for cleanup
--
-- USAGE:
--   Run this script in Supabase SQL Editor or via psql
--   
-- REQUIREMENTS:
--   - Supabase project with storage extension enabled
--   - Authenticated users system in place
--   - auth.users table exists
--
-- SAFETY:
--   - Uses ON CONFLICT clauses to prevent duplicate creation errors
--   - Includes rollback procedures at the end
--   - Validates existing configurations before making changes
--
-- ============================================================================

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- VALIDATION AND PREPARATION
-- ============================================================================

-- Check if storage extension is available
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'supabase_storage'
    ) THEN
        RAISE NOTICE 'WARNING: Supabase storage extension not found. Storage functionality may not work properly.';
    ELSE
        RAISE NOTICE 'INFO: Supabase storage extension is available.';
    END IF;
END $$;

-- Check current storage buckets
DO $$
DECLARE
    bucket_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO bucket_count FROM storage.buckets;
    RAISE NOTICE 'INFO: Found % existing storage buckets', bucket_count;
END $$;

-- ============================================================================
-- BUCKET CREATION
-- ============================================================================

-- Create gym-images bucket
DO $$
BEGIN
    -- Check if bucket already exists
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'gym-images') THEN
        RAISE NOTICE 'INFO: gym-images bucket already exists, updating configuration...';
        
        -- Update existing bucket to ensure it's public
        UPDATE storage.buckets 
        SET public = true, 
            updated_at = NOW()
        WHERE id = 'gym-images';
        
    ELSE
        RAISE NOTICE 'INFO: Creating new gym-images bucket...';
        
        -- Create new bucket
        INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
        VALUES ('gym-images', 'gym-images', true, NOW(), NOW());
        
        RAISE NOTICE 'SUCCESS: gym-images bucket created successfully';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'ERROR: Failed to create/update gym-images bucket: %', SQLERRM;
END $$;

-- ============================================================================
-- STORAGE POLICIES SETUP
-- ============================================================================

-- Drop existing policies to ensure clean setup (idempotent)
DO $$
BEGIN
    RAISE NOTICE 'INFO: Cleaning up existing storage policies...';
    
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Authenticated users can upload gym images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view gym images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own gym images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own gym images" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can manage all gym images" ON storage.objects;
    
    RAISE NOTICE 'INFO: Existing policies cleaned up successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'WARNING: Error cleaning up policies (may not exist): %', SQLERRM;
END $$;

-- Create comprehensive storage policies
DO $$
BEGIN
    RAISE NOTICE 'INFO: Creating storage policies...';
    
    -- Policy 1: Authenticated users can upload gym images
    CREATE POLICY "Authenticated users can upload gym images"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'gym-images'
            AND auth.role() = 'authenticated'
            AND auth.uid() IS NOT NULL
        );
    
    -- Policy 2: Public read access for gym images
    CREATE POLICY "Users can view gym images"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'gym-images');
    
    -- Policy 3: Users can update their own gym images
    CREATE POLICY "Users can update their own gym images"
        ON storage.objects FOR UPDATE
        USING (
            bucket_id = 'gym-images'
            AND auth.uid() IS NOT NULL
            AND auth.uid()::text = (storage.foldername(name))[1]
        );
    
    -- Policy 4: Users can delete their own gym images
    CREATE POLICY "Users can delete their own gym images"
        ON storage.objects FOR DELETE
        USING (
            bucket_id = 'gym-images'
            AND auth.uid() IS NOT NULL
            AND auth.uid()::text = (storage.foldername(name))[1]
        );
    
    -- Policy 5: Admins can manage all gym images
    CREATE POLICY "Admins can manage all gym images"
        ON storage.objects FOR ALL
        USING (
            bucket_id = 'gym-images'
            AND EXISTS (
                SELECT 1 FROM user_roles
                WHERE user_roles.user_id = auth.uid()
                AND user_roles.role = 'admin'
            )
        );
    
    RAISE NOTICE 'SUCCESS: All storage policies created successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'ERROR: Failed to create storage policies: %', SQLERRM;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify bucket creation and configuration
DO $$
DECLARE
    bucket_record RECORD;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE 'INFO: Verifying storage configuration...';
    
    -- Check bucket exists and is properly configured
    SELECT id, name, public, created_at, updated_at 
    INTO bucket_record
    FROM storage.buckets 
    WHERE id = 'gym-images';
    
    IF bucket_record.id IS NULL THEN
        RAISE EXCEPTION 'ERROR: gym-images bucket was not created properly';
    END IF;
    
    IF NOT bucket_record.public THEN
        RAISE WARNING 'WARNING: gym-images bucket is not public, this may cause access issues';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Bucket verification passed - ID: %, Name: %, Public: %, Created: %', 
        bucket_record.id, bucket_record.name, bucket_record.public, bucket_record.created_at;
    
    -- Check policies were created
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%gym images%';
    
    IF policy_count < 4 THEN
        RAISE WARNING 'WARNING: Expected at least 4 gym image policies, found %', policy_count;
    ELSE
        RAISE NOTICE 'SUCCESS: Found % storage policies for gym images', policy_count;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'ERROR: Storage verification failed: %', SQLERRM;
END $$;

-- Display current storage configuration
SELECT 
    'BUCKET CONFIGURATION' as info_type,
    id as bucket_id,
    name as bucket_name,
    public as is_public,
    created_at,
    updated_at
FROM storage.buckets 
WHERE id = 'gym-images'

UNION ALL

SELECT 
    'POLICY COUNT' as info_type,
    COUNT(*)::text as bucket_id,
    'gym image policies' as bucket_name,
    NULL as is_public,
    NULL as created_at,
    NULL as updated_at
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%gym images%';

-- ============================================================================
-- ADDITIONAL UTILITY FUNCTIONS
-- ============================================================================

-- Function to check storage bucket health
CREATE OR REPLACE FUNCTION check_storage_bucket_health(bucket_name TEXT DEFAULT 'gym-images')
RETURNS TABLE (
    status TEXT,
    bucket_exists BOOLEAN,
    is_public BOOLEAN,
    policy_count INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
AS $$
DECLARE
    bucket_info RECORD;
    policies_count INTEGER;
BEGIN
    -- Check if bucket exists
    SELECT b.id, b.public, b.updated_at
    INTO bucket_info
    FROM storage.buckets b
    WHERE b.id = bucket_name;
    
    -- Count related policies
    SELECT COUNT(*)
    INTO policies_count
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%' || bucket_name || '%';
    
    -- Return results
    IF bucket_info.id IS NOT NULL THEN
        RETURN QUERY SELECT 
            'HEALTHY'::TEXT,
            TRUE,
            bucket_info.public,
            policies_count,
            bucket_info.updated_at;
    ELSE
        RETURN QUERY SELECT 
            'MISSING'::TEXT,
            FALSE,
            FALSE,
            policies_count,
            NULL::TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Function to safely recreate storage policies
CREATE OR REPLACE FUNCTION recreate_storage_policies(bucket_name TEXT DEFAULT 'gym-images')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can upload %s images" ON storage.objects', bucket_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can view %s images" ON storage.objects', bucket_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update their own %s images" ON storage.objects', bucket_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete their own %s images" ON storage.objects', bucket_name);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can manage all %s images" ON storage.objects', bucket_name);
    
    -- Recreate policies
    EXECUTE format('
        CREATE POLICY "Authenticated users can upload %s images"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = %L
            AND auth.role() = ''authenticated''
            AND auth.uid() IS NOT NULL
        )', bucket_name, bucket_name);
    
    EXECUTE format('
        CREATE POLICY "Users can view %s images"
        ON storage.objects FOR SELECT
        USING (bucket_id = %L)', bucket_name, bucket_name);
    
    EXECUTE format('
        CREATE POLICY "Users can update their own %s images"
        ON storage.objects FOR UPDATE
        USING (
            bucket_id = %L
            AND auth.uid() IS NOT NULL
            AND auth.uid()::text = (storage.foldername(name))[1]
        )', bucket_name, bucket_name);
    
    EXECUTE format('
        CREATE POLICY "Users can delete their own %s images"
        ON storage.objects FOR DELETE
        USING (
            bucket_id = %L
            AND auth.uid() IS NOT NULL
            AND auth.uid()::text = (storage.foldername(name))[1]
        )', bucket_name, bucket_name);
    
    -- Create admin policy if user_roles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        EXECUTE format('
            CREATE POLICY "Admins can manage all %s images"
            ON storage.objects FOR ALL
            USING (
                bucket_id = %L
                AND EXISTS (
                    SELECT 1 FROM user_roles
                    WHERE user_roles.user_id = auth.uid()
                    AND user_roles.role = ''admin''
                )
            )', bucket_name, bucket_name);
    END IF;
    
    RETURN 'Storage policies recreated successfully for bucket: ' || bucket_name;
END $$;

-- ============================================================================
-- ROLLBACK PROCEDURES
-- ============================================================================

-- UNCOMMENT THE FOLLOWING SECTION TO ROLLBACK ALL CHANGES
-- WARNING: This will remove all storage configuration!

/*
-- Rollback procedure - DANGEROUS! Use with caution
DO $$
BEGIN
    RAISE NOTICE 'WARNING: Starting rollback procedure...';
    
    -- Drop all gym image policies
    DROP POLICY IF EXISTS "Authenticated users can upload gym images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view gym images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own gym images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own gym images" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can manage all gym images" ON storage.objects;
    
    -- Drop utility functions
    DROP FUNCTION IF EXISTS check_storage_bucket_health(TEXT);
    DROP FUNCTION IF EXISTS recreate_storage_policies(TEXT);
    
    -- WARNING: Uncomment the next line to DELETE the bucket and ALL its contents
    -- DELETE FROM storage.buckets WHERE id = 'gym-images';
    
    RAISE NOTICE 'ROLLBACK COMPLETE: Storage policies and functions removed';
    RAISE NOTICE 'NOTE: Bucket was NOT deleted. Uncomment the DELETE statement to remove it completely.';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'ERROR: Rollback failed: %', SQLERRM;
END $$;
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'STORAGE CONFIGURATION COMPLETE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Bucket: gym-images (public access enabled)';
    RAISE NOTICE 'Policies: 5 policies created for comprehensive access control';
    RAISE NOTICE 'Utilities: Health check and policy recreation functions available';
    RAISE NOTICE '';
    RAISE NOTICE 'USAGE:';
    RAISE NOTICE '  - Check health: SELECT * FROM check_storage_bucket_health();';
    RAISE NOTICE '  - Recreate policies: SELECT recreate_storage_policies();';
    RAISE NOTICE '';
    RAISE NOTICE 'For rollback instructions, see the commented section at the end of this script.';
    RAISE NOTICE '============================================================================';
END $$;