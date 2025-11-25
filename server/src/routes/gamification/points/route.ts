import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { awardPoints, getUserPointsHistory } from '@shared/services/gamification.service';

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
    const {
      points,
      action_type,
      action_description,
      reference_id,
      reference_type,
    } = body;

    // Validate required fields
    if (!points || !action_type) {
      return NextResponse.json(
        { error: 'Missing required fields: points and action_type' },
        { status: 400 }
      );
    }

    // Award points to user
    const result = await awardPoints({
      user_id: user.id,
      points,
      action_type,
      action_description,
      reference_id,
      reference_type,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to award points' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: result,
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error awarding points:', error);
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's points history
    const history = await getUserPointsHistory(user.id, limit, offset);

    return NextResponse.json({
      data: history,
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error getting points history:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
