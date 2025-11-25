import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';
import { validateFile } from '@shared/lib/utils/file-validation';

/**
 * POST /api/media/upload
 * Upload image to media library (Admin only)
 * Body: FormData with 'file' field
 */
export const POST = withAdminAuth(async (
  request: NextRequest,
) => {
  try {
    const supabase = await createClient();
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = await validateFile(file, ['image_jpeg', 'image_png', 'image_webp']);

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors[0] || 'Invalid file' },
        { status: 400 }
      );
    }

    // Get user ID from auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Sanitize filename
    const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExt = sanitized.split('.').pop() || 'jpg';
    const fileName = `articles/${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage bucket 'article-media' (or 'hospital-images' if article-media doesn't exist)
    // We'll use 'hospital-images' bucket for now, but organize by folder
    const { error: uploadError } = await supabase.storage
      .from('hospital-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { 
          success: false, 
          error: uploadError.message || 'Failed to upload file' 
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('hospital-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename: fileName,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
});

