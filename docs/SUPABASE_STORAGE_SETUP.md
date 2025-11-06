# Supabase Storage Setup Guide

## 📋 Required Storage Buckets

The application requires the following Supabase Storage buckets to be created:

### 1. `gym-images` Bucket
**Purpose**: Store gym images uploaded during partner application

**Settings**:
- **Bucket Name**: `gym-images`
- **Public**: `true` (images need to be publicly accessible)
- **File Size Limit**: 5MB per file
- **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`

**RLS Policies**:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload gym images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gym-images');

-- Allow authenticated users to read own images
CREATE POLICY "Users can read own gym images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'gym-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access (for displaying images)
CREATE POLICY "Public can read gym images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gym-images');

-- Allow users to delete own images
CREATE POLICY "Users can delete own gym images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gym-images' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## 🚀 Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   - Go to **Storage** section

2. **Create `gym-images` Bucket**
   - Click **New bucket**
   - Bucket name: `gym-images`
   - Public bucket: **ON** (checked)
   - Click **Create bucket**

3. **Configure RLS Policies**
   - Click on the `gym-images` bucket
   - Go to **Policies** tab
   - Click **New policy** and add the policies from above

4. **Set File Size Limit (Optional)**
   - In bucket settings, set maximum file size: 5MB

---

### Option 2: Using SQL (Advanced)

Run this SQL in Supabase SQL Editor:

```sql
-- Create gym-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-images', 'gym-images', true);

-- RLS Policies for gym-images
CREATE POLICY "Authenticated users can upload gym images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gym-images');

CREATE POLICY "Users can read own gym images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'gym-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can read gym images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gym-images');

CREATE POLICY "Users can delete own gym images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gym-images' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## ✅ Verification

### Test Upload Functionality

1. **Login to your application** as an authenticated user

2. **Navigate to Partner Application**
   - Go to `/partner/apply`

3. **Try to upload an image**
   - Should succeed without errors
   - Check Supabase Storage dashboard to verify file was uploaded

4. **Check Storage Bucket**
   - Go to Supabase Dashboard → Storage → gym-images
   - You should see uploaded files organized by user ID

---

## 🐛 Troubleshooting

### Error: "Bucket not found"
**Solution**: Create the `gym-images` bucket using Option 1 or 2 above

### Error: "Permission denied"
**Solution**: Check RLS policies are properly configured

### Error: "File too large"
**Solution**:
- Check file size in client-side validation
- Increase bucket size limit in Supabase dashboard

### Error: "Invalid file type"
**Solution**:
- Only upload `image/jpeg`, `image/png`, or `image/webp`
- Check file validation in `src/lib/utils/file-validation.ts`

---

## 📚 Related Files

- `/src/app/partner/apply/utils/fileUpload.ts` - File upload implementation
- `/src/lib/utils/file-validation.ts` - File validation utilities
- `/src/app/partner/apply/hooks/useFormSubmission.ts` - Form submission with file upload

---

## 🔐 Security Notes

1. **File Validation**: Always validate files on both client and server side
2. **Size Limits**: Enforce maximum file size to prevent abuse
3. **MIME Type Checks**: Only allow specific image formats
4. **RLS Policies**: Ensure users can only access their own files
5. **Filename Sanitization**: Always sanitize filenames to prevent directory traversal attacks

---

## 📝 Testing Checklist

- [ ] Bucket `gym-images` is created
- [ ] Bucket is set to public
- [ ] RLS policies are configured
- [ ] File upload works in partner application
- [ ] Images are publicly accessible via URL
- [ ] Users can only delete their own images
- [ ] File size limits are enforced
- [ ] Invalid file types are rejected
