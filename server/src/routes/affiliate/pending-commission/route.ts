import { NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * GET /api/affiliate/pending-commission
 * Get total pending commission for the authenticated affiliate user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to use the RPC function first
    const { data: pendingCommission, error: rpcError } = await supabase
      .rpc('get_affiliate_pending_commission', { p_affiliate_user_id: user.id });

    if (!rpcError && pendingCommission !== null) {
      const total = parseFloat(pendingCommission.toString());
      const platformFee = total * 0.05; // 5% platform fee
      const netAmount = total - platformFee;

      return NextResponse.json({
        total_commission: total,
        platform_fee: platformFee,
        net_amount: netAmount,
        currency: 'thb',
      });
    }

    // Fallback: calculate manually
    const { data: conversions, error: conversionsError } = await supabase
      .from('affiliate_conversions')
      .select('id, commission_amount')
      .eq('affiliate_user_id', user.id)
      .eq('status', 'confirmed');

    if (conversionsError) {
      console.error('Error fetching pending conversions:', conversionsError);
      return NextResponse.json(
        { error: 'Failed to fetch pending commission' },
        { status: 500 }
      );
    }

    // Get conversion IDs that are already in payouts
    const { data: payouts } = await supabase
      .from('affiliate_payouts')
      .select('related_conversion_ids')
      .eq('affiliate_user_id', user.id)
      .in('status', ['pending', 'processing', 'completed']);

    const paidConversionIds = new Set<string>();
    if (payouts) {
      payouts.forEach((payout) => {
        if (payout.related_conversion_ids) {
          payout.related_conversion_ids.forEach((id: string) => {
            paidConversionIds.add(id);
          });
        }
      });
    }

    // Calculate total from unpaid conversions
    const totalCommission = conversions
      ?.filter((conv) => !paidConversionIds.has(conv.id))
      .reduce((sum, conv) => sum + parseFloat(conv.commission_amount.toString()), 0) || 0;

    const platformFee = totalCommission * 0.05; // 5% platform fee
    const netAmount = totalCommission - platformFee;

    return NextResponse.json({
      total_commission: totalCommission,
      platform_fee: platformFee,
      net_amount: netAmount,
      currency: 'thb',
    });
  } catch (error) {
    console.error('Error in GET /api/affiliate/pending-commission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

