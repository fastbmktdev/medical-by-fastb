import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { getAllBadges, getUserBadges, getBadgeProgress } from '@shared/services/gamification.service';

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
    const type = searchParams.get('type'); // 'all', 'earned', 'progress'

    let data;

    switch (type) {
      case 'earned':
        data = await getUserBadges(user.id);
        break;
      case 'progress':
        data = await getBadgeProgress(user.id);
        break;
      case 'all':
      default:
        data = await getAllBadges();
        break;
    }

    return NextResponse.json({
      data,
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error getting badges:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
