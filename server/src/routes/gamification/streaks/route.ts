import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { updateUserStreak, getUserStreaks } from '@shared/services/gamification.service';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { streak_type, activity_date } = body;

    // Validate required fields
    if (!streak_type) {
      return NextResponse.json(
        { error: 'Missing required field: streak_type' },
        { status: 400 }
      );
    }

    // Update user streak
    const result = await updateUserStreak({
      user_id: user.id,
      streak_type,
      activity_date,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to update streak' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: result,
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

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

    // Get user's streaks
    const streaks = await getUserStreaks(user.id);

    return NextResponse.json({
      data: streaks,
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error getting streaks:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
