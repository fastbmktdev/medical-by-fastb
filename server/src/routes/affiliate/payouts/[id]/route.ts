import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * GET /api/affiliate/payouts/[id]
 * Get a specific payout by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { data: payout, error } = await supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('id', id)
      .eq('affiliate_user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Payout not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching payout:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payout' },
        { status: 500 }
      );
    }

    return NextResponse.json({ payout });
  } catch (error) {
    console.error('Error in GET /api/affiliate/payouts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/affiliate/payouts/[id]
 * Update a payout (e.g., cancel if pending)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json() as {
      action?: string;
      [key: string]: unknown;
    };
    const { action, ...updates } = body;

    // Check if payout exists and belongs to user
    const { data: existingPayout, error: fetchError } = await supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('id', id)
      .eq('affiliate_user_id', user.id)
      .single();

    if (fetchError || !existingPayout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      );
    }

    // Only allow canceling pending payouts
    if (action === 'cancel') {
      if (existingPayout.status !== 'pending') {
        return NextResponse.json(
          { error: 'Only pending payouts can be cancelled' },
          { status: 400 }
        );
      }

      const { data: payout, error: updateError } = await supabase
        .from('affiliate_payouts')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error cancelling payout:', updateError);
        return NextResponse.json(
          { error: 'Failed to cancel payout' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        payout,
        message: 'Payout cancelled successfully',
      });
    }

    // For other updates, only allow updating certain fields
    const allowedUpdates: Record<string, unknown> = {};
    if (updates.notes !== undefined) allowedUpdates.notes = updates.notes;
    if (updates.bank_account_name !== undefined) allowedUpdates.bank_account_name = updates.bank_account_name;
    if (updates.bank_account_number !== undefined) allowedUpdates.bank_account_number = updates.bank_account_number;
    if (updates.bank_name !== undefined) allowedUpdates.bank_name = updates.bank_name;
    if (updates.bank_branch !== undefined) allowedUpdates.bank_branch = updates.bank_branch;
    if (updates.promptpay_number !== undefined) allowedUpdates.promptpay_number = updates.promptpay_number;

    // Only allow updates if payout is pending
    if (existingPayout.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending payouts can be updated' },
        { status: 400 }
      );
    }

    const { data: payout, error: updateError } = await supabase
      .from('affiliate_payouts')
      .update(allowedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payout:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payout' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payout,
      message: 'Payout updated successfully',
    });
  } catch (error) {
    console.error('Error in PATCH /api/affiliate/payouts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

