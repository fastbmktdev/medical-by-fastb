import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { 
  getActiveChallenges, 
  joinChallenge, 
  getUserChallengeProgress,
  updateChallengeProgress 
} from '@shared/services/gamification.service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(request);

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'active', 'user_progress'

    let data;

    switch (type) {
      case 'user_progress':
        data = await getUserChallengeProgress(user.id);
        break;
      case 'active':
      default:
        data = await getActiveChallenges();
        break;
    }

    return NextResponse.json({
      data,
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error getting challenges:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient(request);

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      action?: string;
      challenge_id?: string;
      user_challenge_id?: string;
      progress?: number;
    };
    const { action, challenge_id, user_challenge_id, progress } = body;

    let result;

    switch (action) {
      case 'join':
        if (!challenge_id) {
          return NextResponse.json(
            { error: 'Missing required field: challenge_id' },
            { status: 400 }
          );
        }
        result = await joinChallenge({
          user_id: user.id,
          challenge_id,
        });
        break;

      case 'update_progress':
        if (!user_challenge_id || !progress) {
          return NextResponse.json(
            { error: 'Missing required fields: user_challenge_id and progress' },
            { status: 400 }
          );
        }
        result = await updateChallengeProgress({
          user_challenge_id,
          progress: typeof progress === 'object' && progress !== null ? progress as Record<string, unknown> : {},
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: join, update_progress' },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to perform action' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: result,
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error handling challenge action:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
