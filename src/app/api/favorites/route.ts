import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * Get User Favorites API
 * GET /api/favorites?type=gym
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
    const itemType = searchParams.get('type'); // 'gym', 'product', 'event', or null for all

    let query = supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (itemType) {
      query = query.eq('item_type', itemType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get favorites error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get favorites' },
        { status: 500 }
      );
    }

    // If getting gym favorites, fetch gym details
    if (!itemType || itemType === 'gym') {
      const gymIds = data
        ?.filter(fav => fav.item_type === 'gym')
        .map(fav => fav.item_id) || [];

      if (gymIds.length > 0) {
        const { data: gyms, error: gymsError } = await supabase
          .from('gyms')
          .select('id, gym_name, gym_name_english, location, images, slug')
          .in('id', gymIds)
          .eq('status', 'approved');

        if (!gymsError && gyms) {
          // Merge gym details with favorites
          const favoritesWithDetails = data?.map(fav => {
            if (fav.item_type === 'gym') {
              const gym = gyms.find(g => g.id === fav.item_id);
              return {
                ...fav,
                gym: gym || null,
              };
            }
            return fav;
          });

          return NextResponse.json({
            success: true,
            data: favoritesWithDetails || [],
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Add Favorite API
 * POST /api/favorites
 * Body: { item_type: 'gym' | 'product' | 'event', item_id: string }
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
    const { item_type, item_id } = body;

    if (!item_type || !item_id) {
      return NextResponse.json(
        { success: false, error: 'Missing item_type or item_id' },
        { status: 400 }
      );
    }

    if (!['gym', 'product', 'event'].includes(item_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid item_type. Must be gym, product, or event' },
        { status: 400 }
      );
    }

    // Check if favorite already exists
    const { data: existing, error: checkError } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', item_type)
      .eq('item_id', item_id)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: 'Already in favorites',
      });
    }

    // Insert new favorite
    const { data, error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        item_type,
        item_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Add favorite error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to add favorite' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Added to favorites',
    });

  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete Favorite API
 * DELETE /api/favorites?id=favorite_id
 * or DELETE /api/favorites?item_type=gym&item_id=item_id
 */
export async function DELETE(request: NextRequest) {
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
    const favoriteId = searchParams.get('id');
    const itemType = searchParams.get('item_type');
    const itemId = searchParams.get('item_id');

    let query = supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id);

    if (favoriteId) {
      query = query.eq('id', favoriteId);
    } else if (itemType && itemId) {
      query = query.eq('item_type', itemType).eq('item_id', itemId);
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing id or item_type+item_id' },
        { status: 400 }
      );
    }

    const { error } = await query;

    if (error) {
      console.error('Delete favorite error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete favorite' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from favorites',
    });

  } catch (error) {
    console.error('Delete favorite error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

