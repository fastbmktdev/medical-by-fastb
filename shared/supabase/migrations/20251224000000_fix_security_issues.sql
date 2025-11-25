-- =============================================
-- Security Fixes Migration
-- =============================================
-- This migration fixes security issues identified by Supabase linter:
-- 1. Enable RLS on article_versions table
-- 2. Fix views with SECURITY DEFINER to use SECURITY INVOKER

-- ---
-- FIX 1: Enable RLS on article_versions table
-- ---
-- The article_versions table has RLS policies but RLS was not enabled
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;

-- ---
-- FIX 2: Set SECURITY INVOKER on views
-- ---
-- Views should use SECURITY INVOKER to enforce permissions of the querying user
-- rather than the view creator

-- Fix gallery_analytics_with_images view
ALTER VIEW gallery_analytics_with_images SET (security_invoker = true);

-- Fix funnel_analytics view
ALTER VIEW funnel_analytics SET (security_invoker = true);

-- Fix error_aggregation view
ALTER VIEW error_aggregation SET (security_invoker = true);

-- Fix hospital_gallery_with_hospital view (and backward compatibility alias)
ALTER VIEW hospital_gallery_with_hospital SET (security_invoker = true);
ALTER VIEW hospital_gallery_with_gym SET (security_invoker = true);

-- Add comments explaining the security model
COMMENT ON VIEW gallery_analytics_with_images IS 'Gallery analytics with image info - uses security_invoker to enforce RLS';
COMMENT ON VIEW funnel_analytics IS 'Conversion funnel analytics - uses security_invoker to enforce RLS';
COMMENT ON VIEW error_aggregation IS 'Error aggregation by type and date - uses security_invoker to enforce RLS';
COMMENT ON VIEW hospital_gallery_with_hospital IS 'hospital gallery with hospital info - uses security_invoker to enforce RLS';
COMMENT ON VIEW hospital_gallery_with_gym IS 'Deprecated: Use hospital_gallery_with_hospital instead. Backward compatibility alias.';

