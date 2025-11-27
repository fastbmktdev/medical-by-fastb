import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { sanitizeFilename } from '@shared/lib/utils/file-validation';

/**
 * POST /api/partner/id-card
 * Upload ID card with automatic watermark generation
 * Stores both watermarked (for display) and original (for records) versions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const originalFile = formData.get('file') as File | null;
    const watermarkedFile = formData.get('watermarkedFile') as File | null;

    if (!originalFile || !watermarkedFile) {
      return NextResponse.json(
        { success: false, error: 'Both original and watermarked files are required' },
        { status: 400 }
      );
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(originalFile.type) || !validTypes.includes(watermarkedFile.type)) {
      return NextResponse.json(
        { success: false, error: 'Only JPG and PNG files are allowed' },
        { status: 400 }
      );
    }

    // Validate file sizes (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (originalFile.size > maxSize || watermarkedFile.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must not exceed 10MB' },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitized = sanitizeFilename(originalFile.name);
    const fileExt = sanitized.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);

    // Generate unique filenames
    const originalFileName = `id-cards/${user.id}/original_${timestamp}_${random}.${fileExt}`;
    const watermarkedFileName = `id-cards/${user.id}/watermarked_${timestamp}_${random}.${fileExt}`;

    // Convert files to buffers
    const originalBuffer = Buffer.from(await originalFile.arrayBuffer());
    const watermarkedBuffer = Buffer.from(await watermarkedFile.arrayBuffer());

    // Upload original file (restricted access)
    const { error: originalUploadError } = await supabase.storage
      .from('hospital-images')
      .upload(originalFileName, originalBuffer, {
        contentType: originalFile.type,
        upsert: false,
      });

    if (originalUploadError) {
      console.error('Original file upload error:', originalUploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload original ID card' },
        { status: 500 }
      );
    }

    // Upload watermarked file (public access)
    const { error: watermarkedUploadError } = await supabase.storage
      .from('hospital-images')
      .upload(watermarkedFileName, watermarkedBuffer, {
        contentType: watermarkedFile.type,
        upsert: false,
      });

    if (watermarkedUploadError) {
      console.error('Watermarked file upload error:', watermarkedUploadError);
      
      // Clean up original file if watermarked upload fails
      await supabase.storage.from('hospital-images').remove([originalFileName]);
      
      return NextResponse.json(
        { success: false, error: 'Failed to upload watermarked ID card' },
        { status: 500 }
      );
    }

    // Get public URLs
    const { data: { publicUrl: originalUrl } } = supabase.storage
      .from('hospital-images')
      .getPublicUrl(originalFileName);

    const { data: { publicUrl: watermarkedUrl } } = supabase.storage
      .from('hospital-images')
      .getPublicUrl(watermarkedFileName);

    return NextResponse.json({
      success: true,
      data: {
        originalUrl,
        watermarkedUrl,
        originalPath: originalFileName,
        watermarkedPath: watermarkedFileName,
      },
    });

  } catch (error) {
    console.error('ID card upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/partner/id-card
 * Delete ID card files (both versions)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      originalPath?: string;
      watermarkedPath?: string;
    };
    const { originalPath, watermarkedPath } = body;

    if (!originalPath || !watermarkedPath) {
      return NextResponse.json(
        { success: false, error: 'File paths are required' },
        { status: 400 }
      );
    }

    // Verify that paths belong to this user
    if (!originalPath.includes(user.id) || !watermarkedPath.includes(user.id)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete these files' },
        { status: 403 }
      );
    }

    // Delete both files
    const { error: deleteError } = await supabase.storage
      .from('hospital-images')
      .remove([originalPath, watermarkedPath]);

    if (deleteError) {
      console.error('File deletion error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete ID card files' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('ID card deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

