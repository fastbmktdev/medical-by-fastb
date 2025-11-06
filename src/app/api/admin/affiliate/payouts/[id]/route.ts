import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * PATCH /api/admin/affiliate/payouts/[id]
 * Update payout status (approve, reject, process, complete) - admin only
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, transaction_id, payment_reference, rejection_reason, notes } = body;

    // Get existing payout
    const { data: existingPayout, error: fetchError } = await supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPayout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      );
    }

    const updates: Record<string, string | Date | null | undefined> = {};

    switch (action) {
      case 'approve':
        if (existingPayout.status !== 'pending') {
          return NextResponse.json(
            { error: 'Only pending payouts can be approved' },
            { status: 400 }
          );
        }
        updates.status = 'processing';
        updates.processed_at = new Date().toISOString();
        if (notes) updates.notes = notes;
        break;

      case 'reject':
        if (existingPayout.status !== 'pending' && existingPayout.status !== 'processing') {
          return NextResponse.json(
            { error: 'Only pending or processing payouts can be rejected' },
            { status: 400 }
          );
        }
        if (!rejection_reason) {
          return NextResponse.json(
            { error: 'rejection_reason is required when rejecting a payout' },
            { status: 400 }
          );
        }
        updates.status = 'cancelled';
        updates.rejection_reason = rejection_reason;
        if (notes) updates.notes = notes;
        break;

      case 'complete':
        if (existingPayout.status !== 'processing') {
          return NextResponse.json(
            { error: 'Only processing payouts can be completed' },
            { status: 400 }
          );
        }
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
        if (transaction_id) updates.transaction_id = transaction_id;
        if (payment_reference) updates.payment_reference = payment_reference;
        if (notes) updates.notes = notes;

        // Mark related conversions as paid
        if (existingPayout.related_conversion_ids && existingPayout.related_conversion_ids.length > 0) {
          const { error: conversionUpdateError } = await supabase
            .from('affiliate_conversions')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .in('id', existingPayout.related_conversion_ids);

          if (conversionUpdateError) {
            console.warn('Failed to update conversion statuses:', conversionUpdateError);
            // Don't fail the payout completion, just log the warning
          }
        }
        break;

      case 'fail':
        if (existingPayout.status !== 'processing') {
          return NextResponse.json(
            { error: 'Only processing payouts can be marked as failed' },
            { status: 400 }
          );
        }
        updates.status = 'failed';
        if (rejection_reason) updates.rejection_reason = rejection_reason;
        if (notes) updates.notes = notes;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: approve, reject, complete, or fail' },
          { status: 400 }
        );
    }

    const { data: payout, error: updateError } = await supabase
      .from('affiliate_payouts')
      .update(updates)
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
      message: `Payout ${action}ed successfully`,
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/affiliate/payouts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

