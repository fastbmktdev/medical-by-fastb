import { NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { getUserPayments } from '@shared/services';

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

    // Get user payments
    const payments = await getUserPayments(user.id);

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching user payments:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
