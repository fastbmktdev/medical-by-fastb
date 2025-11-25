import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * GET /api/tickets/[id]
 * ดู ticket details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdminPromise = checkIsAdmin(supabase, user.id);

    // Build ticket query (optimized - only select needed columns)
    let query = supabase
      .from('ticket_bookings')
      .select(`
        id,
        order_id,
        user_id,
        event_id,
        event_name,
        event_name_en,
        event_date,
        ticket_type,
        ticket_count,
        unit_price,
        total_price,
        booking_reference,
        qr_code,
        created_at,
        updated_at,
        orders (
          id,
          order_number,
          status,
          total_amount,
          currency,
          created_at,
          payments (
            id,
            stripe_payment_intent_id,
            status,
            amount
          )
        )
      `)
      .eq('id', id);

    // Wait for admin check and apply filter
    const isAdmin = await isAdminPromise;
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    // Get ticket first (we need ticket.event_id for event query)
    const { data: ticket, error } = await query.maybeSingle();

    if (error) {
      console.error('Get ticket error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch ticket' },
        { status: 500 }
      );
    }

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket,
    });

  } catch (error) {
    console.error('Get ticket error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check if user is admin
async function checkIsAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data?.role === 'admin';
}

