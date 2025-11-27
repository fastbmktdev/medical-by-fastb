import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

/**
 * GET /api/search/history
 * Get user's search history
 * Query params:
 * - limit: number of recent searches (default: 20)
 * - offset: offset for pagination (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const { data: history, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching search history:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch search history' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      history: history || [],
      count: history?.length || 0,
    });
    
  } catch (error) {
    console.error('Search history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get search history' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/search/history
 * Delete user's search history
 * Query params:
 * - id: specific history item id to delete (optional, if not provided, deletes all)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Delete specific history item
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own history
      
      if (error) {
        console.error('Error deleting search history item:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to delete search history item' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Search history item deleted',
      });
    } else {
      // Delete all user's search history
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error deleting search history:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to delete search history' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'All search history deleted',
      });
    }
    
  } catch (error) {
    console.error('Delete search history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete search history' },
      { status: 500 }
    );
  }
}

