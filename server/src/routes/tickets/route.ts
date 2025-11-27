import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

/**
 * GET /api/tickets
 * ดู user tickets ทั้งหมด
 * Query params:
 * - status: all, upcoming, past, checked_in
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let query = supabase
      .from('ticket_bookings')
      .select(`
        *,
        orders (
          id,
          order_number,
          status,
          total_amount,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (statusFilter === 'upcoming') {
      query = query.gt('event_date', new Date().toISOString());
    } else if (statusFilter === 'past') {
      query = query.lt('event_date', new Date().toISOString());
    } else if (statusFilter === 'checked_in') {
      query = query.eq('is_checked_in', true);
    }


    const { data: tickets, error } = await query;

    if (error) {
      console.error('Get tickets error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tickets' },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      data: tickets || [],
      count: tickets?.length || 0,
    });

  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets
 * สร้าง ticket appointment (ใช้หลังจากจ่ายเงินแล้ว)
 * Body: {
 *   order_id: UUID (required)
 *   ticket_type: string
 *   ticket_count: number (default: 1)
 *   unit_price: number (required)
 *   total_price: number (required)
 *   seat_numbers?: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      order_id?: string;
      event_id?: string;
      ticket_type?: string;
      ticket_count?: number;
      unit_price?: number;
      total_price?: number;
      seat_numbers?: string[];
    };
    const {
      order_id,
      event_id,
      ticket_type,
      ticket_count = 1,
      unit_price,
      total_price,
      seat_numbers = [],
    } = body;

    // Validation
    if (!order_id || !event_id || !unit_price || !total_price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: order_id, event_id, unit_price, total_price' },
        { status: 400 }
      );
    }

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // Generate appointment reference
    const bookingReference = await generateBookingReference(supabase);

    // Create ticket appointment
    const { data: ticketBooking, error: bookingError } = await supabase
      .from('ticket_bookings')
      .insert({
        order_id: order_id,
        user_id: user.id,
        event_id: event_id,
        ticket_type: ticket_type || null,
        ticket_count: ticket_count,
        unit_price: unit_price,
        total_price: total_price,
        booking_reference: bookingReference,
        seat_numbers: seat_numbers.length > 0 ? seat_numbers : null,
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Create ticket appointment error:', bookingError);
      return NextResponse.json(
        { success: false, error: 'Failed to create ticket appointment', details: bookingError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticketBooking,
      message: 'สร้าง ticket appointment สำเร็จ',
    }, { status: 201 });

  } catch (error) {
    console.error('Create ticket appointment error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate appointment reference
async function generateBookingReference(supabase: Awaited<ReturnType<typeof createServerClient>>): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let reference = '';
  
  for (let i = 0; i < 8; i++) {
    reference += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Check if reference exists
  const { data } = await supabase
    .from('ticket_bookings')
    .select('booking_reference')
    .eq('booking_reference', reference)
    .maybeSingle();

  if (data) {
    // Regenerate if exists
    return generateBookingReference(supabase);
  }

  return reference;
}

