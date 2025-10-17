-- Simple bucket creation (no policies)
-- Run this if you get "policy already exists" error

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-images', 'gym-images', true)
ON CONFLICT (id) DO UPDATE 
SET public = true;

-- Verify it was created
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'gym-images';

