/**
 * Product Image API Endpoint
 * 
 * DELETE /api/products/[id]/images/[imageId] - Delete an image (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

/**
 * DELETE /api/products/[id]/images/[imageId]
 * Delete an image (Admin only)
 */
export const DELETE = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id, imageId } = await params;

    // Check if image exists and belongs to product
    const { data: image, error: checkError } = await supabase
      .from('product_images')
      .select('id')
      .eq('id', imageId)
      .eq('product_id', id)
      .maybeSingle();

    if (checkError || !image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete image
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('Delete image error:', error);
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
    console.error('Delete image error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});