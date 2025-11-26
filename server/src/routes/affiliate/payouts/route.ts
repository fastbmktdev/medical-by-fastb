import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * GET /api/affiliate/payouts
 * Get all payout requests for the authenticated affiliate user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payouts, error } = await query;

    if (error) {
      console.error('Error fetching affiliate payouts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payouts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ payouts: payouts || [] });
  } catch (error) {
    console.error('Error in GET /api/affiliate/payouts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/affiliate/payouts
 * Create a new payout request
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      period_start_date?: string;
      period_end_date?: string;
      payout_method?: string;
      bank_account_name?: string;
      bank_account_number?: string;
      bank_name?: string;
      bank_branch?: string;
      promptpay_number?: string;
      notes?: string;
    };
    const {
      period_start_date,
      period_end_date,
      payout_method,
      bank_account_name,
      bank_account_number,
      bank_name,
      bank_branch,
      promptpay_number,
      notes,
    } = body;

    // Validate required fields
    if (!period_start_date || !period_end_date) {
      return NextResponse.json(
        { error: 'Period start and end dates are required' },
        { status: 400 }
      );
    }

    if (!payout_method) {
      return NextResponse.json(
        { error: 'Payout method is required' },
        { status: 400 }
      );
    }

    // Validate payment information based on method
    if (payout_method === 'bank_transfer') {
      if (!bank_account_name || !bank_account_number || !bank_name) {
        return NextResponse.json(
          { error: 'Bank account details are required for bank transfer' },
          { status: 400 }
        );
      }
    } else if (payout_method === 'promptpay') {
      if (!promptpay_number) {
        return NextResponse.json(
          { error: 'PromptPay number is required' },
          { status: 400 }
        );
      }
    }

    // Get pending conversions for this affiliate
    const { data: pendingConversions, error: conversionsError } = await supabase
      .rpc('get_affiliate_pending_commission', { p_affiliate_user_id: user.id });

    if (conversionsError) {
      console.error('Error fetching pending commission:', conversionsError);
      // Fallback: query directly
      const { data: conversions } = await supabase
        .from('affiliate_conversions')
        .select('id, commission_amount')
        .eq('affiliate_user_id', user.id)
        .eq('status', 'confirmed')
        .gte('created_at', period_start_date)
        .lte('created_at', period_end_date);

      if (!conversions || conversions.length === 0) {
        return NextResponse.json(
          { error: 'No pending commissions found for the selected period' },
          { status: 400 }
        );
      }

      const totalCommission = conversions.reduce(
        (sum, conv) => sum + parseFloat(conv.commission_amount.toString()),
        0
      );

      if (totalCommission <= 0) {
        return NextResponse.json(
          { error: 'No commission available for payout' },
          { status: 400 }
        );
      }

      // Calculate platform fee (e.g., 5% of commission)
      const platformFee = totalCommission * 0.05;
      const netAmount = totalCommission - platformFee;

      // Generate payout number
      const { data: payoutNumberData, error: payoutNumberError } = await supabase
        .rpc('generate_affiliate_payout_number');

      if (payoutNumberError) {
        // Fallback: generate manually
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const payoutNumber = `AFF-PAY-${timestamp}-${random}`;

        // Create payout
        const { data: payout, error: payoutError } = await supabase
          .from('affiliate_payouts')
          .insert({
            affiliate_user_id: user.id,
            payout_number: payoutNumber,
            amount: netAmount,
            total_commission: totalCommission,
            platform_fee: platformFee,
            net_amount: netAmount,
            status: 'pending',
            payout_method: payout_method,
            period_start_date: period_start_date,
            period_end_date: period_end_date,
            bank_account_name: bank_account_name || null,
            bank_account_number: bank_account_number || null,
            bank_name: bank_name || null,
            bank_branch: bank_branch || null,
            promptpay_number: promptpay_number || null,
            notes: notes || null,
            related_conversion_ids: conversions.map(c => c.id),
          })
          .select()
          .single();

        if (payoutError) {
          console.error('Error creating payout:', payoutError);
          return NextResponse.json(
            { error: 'Failed to create payout request' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          payout,
          message: 'Payout request created successfully',
        });
      }

      const resolvedPayoutNumber =
        typeof payoutNumberData === 'string'
          ? payoutNumberData
          : payoutNumberData?.payout_number;

      if (!resolvedPayoutNumber) {
        console.warn('generate_affiliate_payout_number returned unexpected payload:', payoutNumberData);
        return NextResponse.json(
          { error: 'Failed to generate payout number' },
          { status: 500 }
        );
      }

      const { data: payout, error: payoutError } = await supabase
        .from('affiliate_payouts')
        .insert({
          affiliate_user_id: user.id,
          payout_number: resolvedPayoutNumber,
          amount: netAmount,
          total_commission: totalCommission,
          platform_fee: platformFee,
          net_amount: netAmount,
          status: 'pending',
          payout_method: payout_method,
          period_start_date: period_start_date,
          period_end_date: period_end_date,
          bank_account_name: bank_account_name || null,
          bank_account_number: bank_account_number || null,
          bank_name: bank_name || null,
          bank_branch: bank_branch || null,
          promptpay_number: promptpay_number || null,
          notes: notes || null,
          related_conversion_ids: conversions.map(c => c.id),
        })
        .select()
        .single();

      if (payoutError) {
        console.error('Error creating payout:', payoutError);
        return NextResponse.json(
          { error: 'Failed to create payout request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        payout,
        message: 'Payout request created successfully',
      });
    }

    // Use the RPC function result if available
    const totalCommission = parseFloat(pendingConversions?.toString() || '0');

    if (totalCommission <= 0) {
      return NextResponse.json(
        { error: 'No pending commission available for payout' },
        { status: 400 }
      );
    }

    // Get the actual conversions
    const { data: conversions } = await supabase
      .from('affiliate_conversions')
      .select('id, commission_amount')
      .eq('affiliate_user_id', user.id)
      .eq('status', 'confirmed')
      .gte('created_at', period_start_date)
      .lte('created_at', period_end_date);

    if (!conversions || conversions.length === 0) {
      return NextResponse.json(
        { error: 'No conversions found for the selected period' },
        { status: 400 }
      );
    }

    // Calculate platform fee (e.g., 5% of commission)
    const platformFee = totalCommission * 0.05;
    const netAmount = totalCommission - platformFee;

    // Generate payout number
    const { data: payoutNumber, error: payoutNumberError } = await supabase
      .rpc('generate_affiliate_payout_number');

    if (payoutNumberError) {
      // Fallback: generate manually
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const generatedPayoutNumber = `AFF-PAY-${timestamp}-${random}`;

      // Create payout
      const { data: payout, error: payoutError } = await supabase
        .from('affiliate_payouts')
        .insert({
          affiliate_user_id: user.id,
          payout_number: generatedPayoutNumber,
          amount: netAmount,
          total_commission: totalCommission,
          platform_fee: platformFee,
          net_amount: netAmount,
          status: 'pending',
          payout_method: payout_method,
          period_start_date: period_start_date,
          period_end_date: period_end_date,
          bank_account_name: bank_account_name || null,
          bank_account_number: bank_account_number || null,
          bank_name: bank_name || null,
          bank_branch: bank_branch || null,
          promptpay_number: promptpay_number || null,
          notes: notes || null,
          related_conversion_ids: conversions.map(c => c.id),
        })
        .select()
        .single();

      if (payoutError) {
        console.error('Error creating payout:', payoutError);
        return NextResponse.json(
          { error: 'Failed to create payout request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        payout,
        message: 'Payout request created successfully',
      });
    }

    // Create payout with generated number
    const { data: payout, error: payoutError } = await supabase
      .from('affiliate_payouts')
      .insert({
        affiliate_user_id: user.id,
        payout_number: payoutNumber,
        amount: netAmount,
        total_commission: totalCommission,
        platform_fee: platformFee,
        net_amount: netAmount,
        status: 'pending',
        payout_method: payout_method,
        period_start_date: period_start_date,
        period_end_date: period_end_date,
        bank_account_name: bank_account_name || null,
        bank_account_number: bank_account_number || null,
        bank_name: bank_name || null,
        bank_branch: bank_branch || null,
        promptpay_number: promptpay_number || null,
        notes: notes || null,
        related_conversion_ids: conversions.map(c => c.id),
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Error creating payout:', payoutError);
      return NextResponse.json(
        { error: 'Failed to create payout request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payout,
      message: 'Payout request created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/affiliate/payouts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

