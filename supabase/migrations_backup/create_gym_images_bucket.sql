-- Create storage bucket for gym images
-- Run this in Supabase SQL Editor if the gym-images bucket is missing

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-images', 'gym-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for gym-images bucket
CREATE POLICY "Authenticated users can upload gym images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gym-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view gym images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gym-images');

CREATE POLICY "Users can update their own gym images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'gym-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own gym images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gym-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

