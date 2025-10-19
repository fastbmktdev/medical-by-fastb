import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      orderId,
      gymId,
      startDate,
      endDate,
      durationDays,
      packageType,
      packageName,
      packageNameEn,
      unitPrice,
      totalPrice,
      notes,
      specialRequests,
    } = body;

    // Validate required fields
    if (
      !orderId ||
      !gymId ||
      !startDate ||
      !endDate ||
      !durationDays ||
      !packageType ||
      !packageName ||
      !unitPrice ||
      !totalPrice
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create gym booking
    const { data: booking, error: bookingError } = await supabase
      .from('gym_bookings')
      .insert({
        order_id: orderId,
        user_id: user.id,
        gym_id: gymId,
        start_date: startDate,
        end_date: endDate,
        duration_days: durationDays,
        package_type: packageType,
        package_name: packageName,
        package_name_en: packageNameEn,
        unit_price: unitPrice,
        total_price: totalPrice,
        notes,
        special_requests: specialRequests,
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating gym booking:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create gym booking' },
        { status: 500 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error in gym booking API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get user's gym bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('gym_bookings')
      .select(
        `
        *,
        gyms (
          id,
          name,
          name_en,
          location,
          province,
          image_url
        ),
        orders (
          id,
          order_number,
          status,
          total_amount
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching gym bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to fetch gym bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error in gym bookings API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
