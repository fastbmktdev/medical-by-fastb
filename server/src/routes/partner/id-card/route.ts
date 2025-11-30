import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { getUserRole } from '@shared/lib/auth/server';
import { sanitizeFilename, validateStoragePath } from '@shared/lib/utils/file-validation';

/**
 * POST /api/partner/id-card
 * Upload ID card with automatic watermark generation
 * Stores both watermarked (for display) and original (for records) versions
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[ID Card Upload] Starting upload request');
    
    const supabase = await createServerClient(request);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[ID Card Upload] Auth error:', {
        error: authError,
        hasUser: !!user,
      });
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[ID Card Upload] User authenticated: ${user.id}`);

    // Check if user is a partner
    const userRole = await getUserRole(user.id);
    if (userRole !== 'partner') {
      console.warn(`[ID Card Upload] Access denied for user ${user.id} with role ${userRole}`);
      return NextResponse.json(
        { success: false, error: 'Forbidden - Partner access required' },
        { status: 403 }
      );
    }

    let formData: FormData;
    try {
      console.log('[ID Card Upload] Parsing FormData...');
      formData = await request.formData();
      console.log('[ID Card Upload] FormData parsed successfully');
    } catch (formDataError) {
      console.error('[ID Card Upload] Failed to parse formData:', {
        error: formDataError instanceof Error ? formDataError.message : String(formDataError),
        contentType: request.headers.get('content-type'),
        hasBody: !!request.body,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to parse form data',
          details: process.env.NODE_ENV === 'development' 
            ? (formDataError instanceof Error ? formDataError.message : String(formDataError))
            : undefined
        },
        { status: 400 }
      );
    }

    const originalFile = formData.get('file') as File | null;
    const watermarkedFile = formData.get('watermarkedFile') as File | null;

    if (!originalFile || !watermarkedFile) {
      console.error('[ID Card Upload] Missing files:', {
        hasOriginal: !!originalFile,
        hasWatermarked: !!watermarkedFile,
      });
      return NextResponse.json(
        { success: false, error: 'Both original and watermarked files are required' },
        { status: 400 }
      );
    }

    console.log('[ID Card Upload] Files received:', {
      originalSize: originalFile.size,
      originalType: originalFile.type,
      watermarkedSize: watermarkedFile.size,
      watermarkedType: watermarkedFile.type,
    });

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(originalFile.type) || !validTypes.includes(watermarkedFile.type)) {
      console.error('[ID Card Upload] Invalid file type:', {
        originalType: originalFile.type,
        watermarkedType: watermarkedFile.type,
      });
      return NextResponse.json(
        { success: false, error: 'Only JPG and PNG files are allowed' },
        { status: 400 }
      );
    }

    // Validate file sizes (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (originalFile.size > maxSize || watermarkedFile.size > maxSize) {
      console.error('[ID Card Upload] File size exceeded:', {
        originalSize: originalFile.size,
        watermarkedSize: watermarkedFile.size,
        maxSize,
      });
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

    console.log('[ID Card Upload] Generated filenames:', {
      originalFileName,
      watermarkedFileName,
    });

    // Convert files to buffers
    console.log('[ID Card Upload] Converting files to buffers...');
    const originalBuffer = Buffer.from(await originalFile.arrayBuffer());
    const watermarkedBuffer = Buffer.from(await watermarkedFile.arrayBuffer());
    console.log('[ID Card Upload] Buffers created:', {
      originalBufferSize: originalBuffer.length,
      watermarkedBufferSize: watermarkedBuffer.length,
    });

    // Upload original file (restricted access)
    console.log('[ID Card Upload] Uploading original file to storage...');
    const { error: originalUploadError } = await supabase.storage
      .from('hospital-images')
      .upload(originalFileName, originalBuffer, {
        contentType: originalFile.type,
        upsert: false,
      });

    if (originalUploadError) {
      console.error('[ID Card Upload] Original file upload error:', {
        error: originalUploadError,
        fileName: originalFileName,
        fileSize: originalBuffer.length,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to upload original ID card',
          details: process.env.NODE_ENV === 'development' 
            ? originalUploadError.message 
            : undefined,
        },
        { status: 500 }
      );
    }

    console.log('[ID Card Upload] Original file uploaded successfully');

    // Upload watermarked file (public access)
    console.log('[ID Card Upload] Uploading watermarked file to storage...');
    const { error: watermarkedUploadError } = await supabase.storage
      .from('hospital-images')
      .upload(watermarkedFileName, watermarkedBuffer, {
        contentType: watermarkedFile.type,
        upsert: false,
      });

    if (watermarkedUploadError) {
      console.error('[ID Card Upload] Watermarked file upload error:', {
        error: watermarkedUploadError,
        fileName: watermarkedFileName,
        fileSize: watermarkedBuffer.length,
      });
      
      // Clean up original file if watermarked upload fails
      console.log('[ID Card Upload] Cleaning up original file...');
      const { error: cleanupError } = await supabase.storage
        .from('hospital-images')
        .remove([originalFileName]);
      
      if (cleanupError) {
        console.error('[ID Card Upload] Failed to cleanup original file:', cleanupError);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to upload watermarked ID card',
          details: process.env.NODE_ENV === 'development' 
            ? watermarkedUploadError.message 
            : undefined,
        },
        { status: 500 }
      );
    }

    console.log('[ID Card Upload] Watermarked file uploaded successfully');

    // Get public URLs
    const { data: { publicUrl: originalUrl } } = supabase.storage
      .from('hospital-images')
      .getPublicUrl(originalFileName);

    const { data: { publicUrl: watermarkedUrl } } = supabase.storage
      .from('hospital-images')
      .getPublicUrl(watermarkedFileName);

    const duration = Date.now() - startTime;
    console.log(`[ID Card Upload] Upload completed successfully in ${duration}ms`);

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
    const duration = Date.now() - startTime;
    console.error('[ID Card Upload] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Internal server error')
          : undefined,
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
    const supabase = await createServerClient(request);

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

    // Check if user is a partner
    const userRole = await getUserRole(user.id);
    if (userRole !== 'partner') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Partner access required' },
        { status: 403 }
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

    // Verify that paths belong to this user - strict validation to prevent path traversal
    // Paths must start with "id-cards/{user.id}/" to ensure they belong to this user
    const expectedPrefix = `id-cards/${user.id}/`;
    
    if (!validateStoragePath(originalPath, expectedPrefix) || 
        !validateStoragePath(watermarkedPath, expectedPrefix)) {
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
        error: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Internal server error')
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

