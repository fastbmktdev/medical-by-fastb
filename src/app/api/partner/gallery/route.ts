import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * GET /api/partner/gallery
 * Get all gallery images for a gym
 * Query params: gym_id (required)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const gymId = searchParams.get('gym_id');

    if (!gymId) {
      return NextResponse.json(
        { success: false, error: 'gym_id is required' },
        { status: 400 }
      );
    }

    // Verify gym ownership
    const { data: gym } = await supabase
      .from('gyms')
      .select('id, user_id')
      .eq('id', gymId)
      .single();

    if (!gym) {
      return NextResponse.json(
        { success: false, error: 'Gym not found' },
        { status: 404 }
      );
    }

    // Check if user owns the gym or is admin
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = role?.role === 'admin';
    const isOwner = gym.user_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have access to this gym' },
        { status: 403 }
      );
    }

    // Fetch gallery images
    const { data: images, error: fetchError } = await supabase
      .from('gym_gallery')
      .select('*')
      .eq('gym_id', gymId)
      .order('display_order', { ascending: true });

    if (fetchError) {
      console.error('Error fetching gallery images:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch gallery images' },
        { status: 500 }
      );
    }

    // Get stats
    const totalSize = images?.reduce((sum, img) => sum + (img.file_size || 0), 0) || 0;
    const featuredImage = images?.find(img => img.is_featured);

    return NextResponse.json({
      success: true,
      data: {
        images: images || [],
        stats: {
          total_images: images?.length || 0,
          featured_image: featuredImage,
          total_size: totalSize,
          latest_upload: images?.[0]?.created_at,
        },
      },
    });
  } catch (error) {
    console.error('Gallery GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/partner/gallery
 * Upload a new gallery image
 * Body: { gym_id, image_url, storage_path, title?, description?, alt_text?, is_featured?, file_size?, width?, height?, mime_type? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      gym_id,
      image_url,
      storage_path,
      title,
      description,
      alt_text,
      is_featured = false,
      file_size,
      width,
      height,
      mime_type,
    } = body;

    // Validate required fields
    if (!gym_id || !image_url || !storage_path) {
      return NextResponse.json(
        { success: false, error: 'gym_id, image_url, and storage_path are required' },
        { status: 400 }
      );
    }

    // Verify gym ownership
    const { data: gym } = await supabase
      .from('gyms')
      .select('id, user_id')
      .eq('id', gym_id)
      .single();

    if (!gym) {
      return NextResponse.json(
        { success: false, error: 'Gym not found' },
        { status: 404 }
      );
    }

    if (gym.user_id !== user.id) {
      // Check if admin
      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (role?.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not own this gym' },
          { status: 403 }
        );
      }
    }

    // Insert gallery image
    const { data: newImage, error: insertError } = await supabase
      .from('gym_gallery')
      .insert({
        gym_id,
        image_url,
        storage_path,
        title,
        description,
        alt_text,
        is_featured,
        file_size,
        width,
        height,
        mime_type,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting gallery image:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to save image to gallery' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newImage,
      message: 'Image added to gallery successfully',
    });
  } catch (error) {
    console.error('Gallery POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

