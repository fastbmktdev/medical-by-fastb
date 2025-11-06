import { SupabaseClient } from "@supabase/supabase-js";
import { validateFileClient, sanitizeFilename } from "@/lib/utils/file-validation";

/**
 * Validate file before upload (client-side lightweight validation)
 * For comprehensive server-side validation, see /api routes
 */
export const validateFile = (file: File): string | null => {
  const validation = validateFileClient(file, ['image_jpeg', 'image_png']);
  
  if (!validation.isValid && validation.errors.length > 0) {
    return `${file.name}: ${validation.errors[0]}`;
  }
  
  return null;
};

/**
 * Upload gym images to Supabase Storage
 * Returns array of public URLs for uploaded images
 */
export const uploadImages = async (
  supabase: SupabaseClient,
  files: File[],
  userId: string
): Promise<string[]> => {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    try {
      // Sanitize filename for security
      const sanitized = sanitizeFilename(file.name);
      const fileExt = sanitized.split(".").pop() || 'jpg';
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Upload to Supabase Storage bucket 'gym-images'
      const { error } = await supabase.storage
        .from("gym-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from("gym-images")
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    } catch (error) {
      console.error('Image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : "การอัปโหลดรูปภาพล้มเหลว";
      throw new Error(errorMessage);
    }
  }

  return uploadedUrls;
};

