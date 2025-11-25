import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * POST /api/partner/gallery/reorder
 * Reorder gallery images
 * Body: { hospital_id, image_orders: [{ id, display_order }] }
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
    const { hospital_id, image_orders } = body;

    if (!hospital_id || !Array.isArray(image_orders)) {
      return NextResponse.json(
        { success: false, error: 'hospital_id and image_orders array are required' },
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

    // Update each image's display_order
    const updatePromises = image_orders.map(({ id, display_order }) =>
      supabase
        .from('hospital_gallery')
        .update({ display_order })
        .eq('id', id)
        .eq('hospital_id', hospital_id)
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Error reordering images:', errors);
      return NextResponse.json(
        { success: false, error: 'Failed to reorder some images' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Images reordered successfully',
    });
  } catch (error) {
    console.error('Gallery reorder error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

