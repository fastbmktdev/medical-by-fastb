import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { getGamificationDashboard } from '@/services/gamification.service';

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

    // Get complete gamification dashboard
    const dashboard = await getGamificationDashboard(user.id);

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Failed to get gamification dashboard' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: dashboard,
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error getting gamification dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
