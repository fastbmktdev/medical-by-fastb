import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * GET /api/partner/gallery
 * Get all gallery images for a hospital
 * Query params: hospital_id (required)
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
    const hospitalId = searchParams.get('hospital_id');

    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: 'hospital_id is required' },
        { status: 400 }
      );
    }

    // Verify hospital ownership
    const { data: hospital } = await supabase
      .from('hospitals')
      .select('id, user_id')
      .eq('id', hospitalId)
      .single();

    if (!hospital) {
      return NextResponse.json(
        { success: false, error: 'hospital not found' },
        { status: 404 }
      );
    }

    // Check if user owns the hospital or is admin
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = role?.role === 'admin';
    const isOwner = hospital.user_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have access to this hospital' },
        { status: 403 }
      );
    }

    // Fetch gallery images
    const { data: images, error: fetchError } = await supabase
      .from('hospital_gallery')
      .select('*')
      .eq('hospital_id', hospitalId)
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
 * Body: { hospital_id, image_url, storage_path, title?, description?, alt_text?, is_featured?, file_size?, width?, height?, mime_type? }
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
      hospital_id,
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
    if (!hospital_id || !image_url || !storage_path) {
      return NextResponse.json(
        { success: false, error: 'hospital_id, image_url, and storage_path are required' },
        { status: 400 }
      );
    }

    // Verify hospital ownership
    const { data: hospital } = await supabase
      .from('hospitals')
      .select('id, user_id')
      .eq('id', hospital_id)
      .single();

    if (!hospital) {
      return NextResponse.json(
        { success: false, error: 'hospital not found' },
        { status: 404 }
      );
    }

    if (hospital.user_id !== user.id) {
      // Check if admin
      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (role?.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not own this hospital' },
          { status: 403 }
        );
      }
    }

    // Insert gallery image
    const { data: newImage, error: insertError } = await supabase
      .from('hospital_gallery')
      .insert({
        hospital_id,
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

