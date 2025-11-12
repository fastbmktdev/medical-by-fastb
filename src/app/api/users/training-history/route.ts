import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

interface BookingGym {
  id: string;
  gym_name: string | null;
  location: string | null;
  images: unknown;
}

interface BookingRecord {
  id: string;
  booking_number: string | null;
  gym_id: string | null;
  package_id: string | null;
  package_name: string | null;
  package_type: string | null;
  start_date: string | null;
  end_date: string | null;
  price_paid: number | string | null;
  status: string | null;
  payment_status: string | null;
  created_at: string | null;
  gyms?: BookingGym | BookingGym[] | null;
}

/**
 * Get Training History API
 * GET /api/users/training-history
 * 
 * Query params:
 * - startDate?: string (ISO date)
 * - endDate?: string (ISO date)
 * - gymId?: string
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const gymId = searchParams.get('gymId');

    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        gym_id,
        package_id,
        package_name,
        package_type,
        start_date,
        end_date,
        price_paid,
        status,
        payment_status,
        created_at,
        gyms (
          id,
          gym_name,
          location,
          images
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .order('start_date', { ascending: false });

    if (startDate) {
      query = query.gte('start_date', startDate);
    }

    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    if (gymId) {
      query = query.eq('gym_id', gymId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get training history error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get training history' },
        { status: 500 }
      );
    }

    const bookings: BookingRecord[] = Array.isArray(data) ? (data as BookingRecord[]) : [];

    // Calculate statistics
    const stats = {
      total_bookings: bookings.length,
      unique_gyms: new Set(bookings.map((booking) => booking.gym_id)).size,
      total_spent: bookings.reduce((sum: number, booking) => {
        if (typeof booking.price_paid === 'number') return sum + booking.price_paid;
        if (typeof booking.price_paid === 'string') {
          const parsed = Number(booking.price_paid);
          return Number.isNaN(parsed) ? sum : sum + parsed;
        }
        return sum;
      }, 0),
      by_month: {} as Record<string, number>
    };

    // Group by month
    bookings.forEach((booking) => {
      if (booking.start_date) {
        const month = booking.start_date.substring(0, 7); // YYYY-MM
        stats.by_month[month] = (stats.by_month[month] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        bookings: data || [],
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Get training history error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

