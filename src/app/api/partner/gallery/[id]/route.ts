import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * PATCH /api/partner/gallery/[id]
 * Update a gallery image
 * Body: { title?, description?, alt_text?, is_featured?, display_order? }
 */
export async function PATCH(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await segmentData.params;
    const imageId = params.id;
    const body = await request.json();
    const { title, description, alt_text, is_featured, display_order } = body;

    // Get the image to verify ownership
    const { data: image, error: fetchError } = await supabase
      .from('gym_gallery')
      .select('*, gyms!inner(user_id)')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    const gym = image.gyms as { user_id: string };
    if (gym.user_id !== user.id) {
      // Check if admin
      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (role?.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have access to this image' },
          { status: 403 }
        );
      }
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (alt_text !== undefined) updates.alt_text = alt_text;
    if (is_featured !== undefined) updates.is_featured = is_featured;
    if (display_order !== undefined) updates.display_order = display_order;

    // Update image
    const { data: updatedImage, error: updateError } = await supabase
      .from('gym_gallery')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating gallery image:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedImage,
      message: 'Image updated successfully',
    });
  } catch (error) {
    console.error('Gallery PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/partner/gallery/[id]
 * Delete a gallery image
 */
export async function DELETE(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await segmentData.params;
    const imageId = params.id;

    // Get the image to verify ownership and get storage path
    const { data: image, error: fetchError } = await supabase
      .from('gym_gallery')
      .select('*, gyms!inner(user_id)')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    const gym = image.gyms as { user_id: string };
    if (gym.user_id !== user.id) {
      // Check if admin
      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (role?.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have access to this image' },
          { status: 403 }
        );
      }
    }

    // Delete from storage
    const storagePath = image.storage_path;
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('gym-images')
        .remove([storagePath]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('gym_gallery')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      console.error('Error deleting gallery image:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Gallery DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

