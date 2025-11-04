import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { validateFile, sanitizeFilename } from '@/lib/utils/file-validation';

/**
 * Profile Picture Upload API
 * POST /api/users/profile/picture
 * 
 * FormData:
 * - file: File
 * 
 * Security Features:
 * - Comprehensive file validation with magic bytes verification
 * - Virus/malware pattern detection
 * - Filename sanitization
 * - MIME type and extension validation
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Comprehensive file validation with security checks
    const validation = await validateFile(file, ['image_jpeg', 'image_png', 'image_webp']);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File validation failed',
          details: validation.errors,
          warnings: validation.warnings
        },
        { status: 400 }
      );
    }

    // Log warnings if any (for monitoring)
    if (validation.warnings.length > 0) {
      console.warn('File upload warnings:', {
        filename: file.name,
        warnings: validation.warnings
      });
    }

    // Sanitize filename and generate unique name
    const sanitized = sanitizeFilename(file.name);
    const fileExt = sanitized.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Delete old avatar if exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .single();

    if (profile?.avatar_url) {
      // Extract path from URL
      const urlParts = profile.avatar_url.split('/');
      const fileIndex = urlParts.findIndex((part: string) => part === 'avatars');
      if (fileIndex !== -1 && fileIndex < urlParts.length - 1) {
        const oldPath = urlParts.slice(fileIndex + 1).join('/');
        await supabase.storage
          .from('avatars')
          .remove([oldPath]);
      }
    }

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        avatar_url: publicUrl,
        message: 'Profile picture uploaded successfully'
      }
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete Profile Picture API
 * DELETE /api/users/profile/picture
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current avatar URL
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .single();

    if (profile?.avatar_url) {
      // Extract path from URL
      const urlParts = profile.avatar_url.split('/');
      const fileIndex = urlParts.findIndex((part: string) => part === 'avatars');
      if (fileIndex !== -1 && fileIndex < urlParts.length - 1) {
        const oldPath = urlParts.slice(fileIndex + 1).join('/');

        // Delete from storage
        await supabase.storage
          .from('avatars')
          .remove([oldPath]);
      }
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove profile picture' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile picture removed successfully'
    });

  } catch (error) {
    console.error('Delete profile picture error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

