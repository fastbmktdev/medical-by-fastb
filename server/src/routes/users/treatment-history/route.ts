import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

interface BookingHospital {
  id: string;
  hospital_name: string | null;
  location: string | null;
  images: unknown;
}

interface BookingRecord {
  id: string;
  booking_number: string | null;
  hospital_id: string | null;
  package_id: string | null;
  package_name: string | null;
  package_type: string | null;
  start_date: string | null;
  end_date: string | null;
  price_paid: number | string | null;
  status: string | null;
  payment_status: string | null;
  created_at: string | null;
  hospitals?: BookingHospital | BookingHospital[] | null;
}

/**
 * Get treatment History API
 * GET /api/users/treatment-history
 * 
 * Query params:
 * - startDate?: string (ISO date)
 * - endDate?: string (ISO date)
 * - hospitalId?: string
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
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
    const hospitalId = searchParams.get('hospitalId');

    // Build query
    let query = supabase
      .from('appointments')
      .select(`
        id,
        booking_number,
        hospital_id,
        package_id,
        package_name,
        package_type,
        start_date,
        end_date,
        price_paid,
        status,
        payment_status,
        created_at,
        hospitals (
          id,
          hospital_name,
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

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get treatment history error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get treatment history' },
        { status: 500 }
      );
    }

    const appointments: BookingRecord[] = Array.isArray(data) ? (data as BookingRecord[]) : [];

    // Calculate statistics
    const stats = {
      total_bookings: appointments.length,
      unique_hospitals: new Set(appointments.map((appointment) => appointment.hospital_id)).size,
      total_spent: appointments.reduce((sum: number, appointment) => {
        if (typeof appointment.price_paid === 'number') return sum + appointment.price_paid;
        if (typeof appointment.price_paid === 'string') {
          const parsed = Number(appointment.price_paid);
          return Number.isNaN(parsed) ? sum : sum + parsed;
        }
        return sum;
      }, 0),
      by_month: {} as Record<string, number>
    };

    // Group by month
    appointments.forEach((appointment) => {
      if (appointment.start_date) {
        const month = appointment.start_date.substring(0, 7); // YYYY-MM
        stats.by_month[month] = (stats.by_month[month] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        appointments: data || [],
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Get treatment history error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

