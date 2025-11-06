import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

/**
 * GET /api/media/list
 * List uploaded media files (Admin only)
 * Query params:
 * - limit: number of files to return (default: 50)
 * - offset: offset for pagination (default: 0)
 * - folder: filter by folder (default: 'articles')
 */
export const GET = withAdminAuth(async (
  request: NextRequest,
) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const folder = searchParams.get('folder') || 'articles';

    // Get user ID from auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // List files from Supabase Storage
    // Note: Supabase Storage API doesn't have a direct list endpoint, so we'll use a workaround
    // For now, we'll return a simple response and suggest implementing a proper media table
    // In a production system, you'd want to store media metadata in a database table
    
    // List files from the bucket
    const { data: files, error } = await supabase.storage
      .from('gym-images')
      .list(`${folder}/${user.id}`, {
        limit,
        offset,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('List files error:', error);
      // If listing fails, return empty array (folder might not exist yet)
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Build public URLs for each file
    const mediaFiles = (files || []).map((file) => {
      const filePath = `${folder}/${user.id}/${file.name}`;
      const { data: { publicUrl } } = supabase.storage
        .from('gym-images')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        filename: file.name,
        path: filePath,
        size: file.metadata?.size || 0,
        createdAt: file.created_at,
        updatedAt: file.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: mediaFiles,
      total: mediaFiles.length,
    });
  } catch (error) {
    console.error('List media error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
});

