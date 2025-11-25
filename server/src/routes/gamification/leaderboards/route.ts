import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { getLeaderboardData, getAllLeaderboards, getLeaderboardDataPaginated } from '@shared/services/gamification.service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leaderboardId = searchParams.get('id');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    let data;

    if (leaderboardId) {
      // Check if pagination is requested
      if (limitParam || offsetParam) {
        const limit = limitParam ? parseInt(limitParam, 10) : 50;
        const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
        
        // Get paginated leaderboard data
        data = await getLeaderboardDataPaginated(leaderboardId, user.id, limit, offset);
      } else {
        // Get specific leaderboard data (default, limited to 100)
        data = await getLeaderboardData(leaderboardId, user.id);
      }
      
      // If leaderboard not found, return 404 instead of 500
      if (!data) {
        return NextResponse.json(
          { error: 'Leaderboard not found', success: false },
          { status: 404 }
        );
      }
    } else {
      // Get all leaderboards
      data = await getAllLeaderboards();
      
      // Return empty array if no leaderboards (not an error)
      if (!data) {
        data = [];
      }
    }

    return NextResponse.json({
      data,
      error: null,
      success: true,
    });
  } catch (error: unknown) {
    console.error('Error getting leaderboards:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        success: false 
      },
      { status: 500 }
    );
  }
}
