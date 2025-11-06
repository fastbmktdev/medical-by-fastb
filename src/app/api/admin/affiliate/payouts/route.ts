import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * GET /api/admin/affiliate/payouts
 * Get all payout requests (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const affiliateUserId = searchParams.get('affiliate_user_id');

    let query = supabase
      .from('affiliate_payouts')
      .select(`
        *,
        profiles:affiliate_user_id (
          user_id,
          username,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (affiliateUserId) {
      query = query.eq('affiliate_user_id', affiliateUserId);
    }

    const { data: payouts, error } = await query;

    if (error) {
      console.error('Error fetching payouts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payouts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ payouts: payouts || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/affiliate/payouts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

