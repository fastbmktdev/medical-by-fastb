import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * Check if item is in favorites API
 * GET /api/favorites/check?item_type=gym&item_id=item_id
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

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get('item_type');
    const itemId = searchParams.get('item_id');

    if (!itemType || !itemId) {
      return NextResponse.json(
        { success: false, error: 'Missing item_type or item_id' },
        { status: 400 }
      );
    }

    if (!['gym', 'product', 'event'].includes(itemType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid item_type. Must be gym, product, or event' },
        { status: 400 }
      );
    }

    // Check if favorite exists
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .maybeSingle();

    if (error) {
      console.error('Check favorite error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to check favorite' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isFavorite: !!data,
    });

  } catch (error) {
    console.error('Check favorite error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

