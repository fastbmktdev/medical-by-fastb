import { NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { getUserGamificationStats } from '@shared/services/gamification.service';

export async function GET() {
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

    // Get user's gamification stats
    const stats = await getUserGamificationStats(user.id);

    if (!stats) {
      return NextResponse.json({ error: 'Failed to get gamification stats' }, { status: 500 });
    }

    return NextResponse.json({
      data: stats,
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error getting gamification stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
