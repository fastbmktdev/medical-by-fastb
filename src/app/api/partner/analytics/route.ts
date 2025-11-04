/**
 * Partner Analytics API
 * GET /api/partner/analytics
 * 
 * ข้อมูล analytics สำหรับ partner dashboard
 * Query params:
 * - startDate: ISO date string (optional, default: start of current month)
 * - endDate: ISO date string (optional, default: now)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { fetchPlaceReviews } from '@/lib/utils/googlePlaces';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // ตรวจสอบ authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // ตรวจสอบว่าเป็น partner หรือ admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleData || !['partner', 'admin'].includes(roleData.role)) {
      return NextResponse.json(
        { success: false, error: 'คุณไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    // ดึงค่ายของ partner
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, gym_name, location, status, google_place_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gymError || !gym) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบค่ายมวยของคุณ กรุณาสมัครเป็นพาร์ทเนอร์ก่อน' },
        { status: 404 }
      );
    }

    // Get date range from query params or default to current month
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : startOfMonth;
    const endDate = endDateParam 
      ? new Date(endDateParam) 
      : now;
    
    // Ensure dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    // Ensure endDate is after startDate
    if (endDate < startDate) {
      return NextResponse.json(
        { success: false, error: 'endDate must be after startDate' },
        { status: 400 }
      );
    }
    
    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();

    // 1. Query จำนวนลูกค้าทั้งหมด (unique customers from bookings)
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('user_id, customer_email')
      .eq('gym_id', gym.id);
    
    const uniqueCustomers = new Set<string>();
    if (allBookings) {
      for (const booking of allBookings) {
        if (booking.user_id) {
          uniqueCustomers.add(booking.user_id);
        } else if (booking.customer_email) {
          uniqueCustomers.add(booking.customer_email);
        }
      }
    }
    const totalCustomers = uniqueCustomers.size;

    // 2. Query จำนวนการจองเดือนนี้
    const { count: monthlyBookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gym.id)
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO);

    // Query จำนวนการจองทั้งหมด
    const { count: totalBookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gym.id);

    // 3. Query คะแนนเฉลี่ย (from Google Places API if available)
    let averageRating: number | null = null;
    let totalRatings = 0;
    
    if (gym.google_place_id) {
      try {
        const googleReviews = await fetchPlaceReviews({ 
          placeId: gym.google_place_id 
        });
        
        if (googleReviews.rating !== undefined) {
          averageRating = googleReviews.rating;
          totalRatings = googleReviews.user_ratings_total || 0;
        }
      } catch (error) {
        // Silently fail - Google Places API might not be configured or rate limited
        console.warn('Failed to fetch Google Places rating:', error);
      }
    }

    // 4. Query อันดับในพื้นที่ (compare with other gyms in same location)
    // Get all gyms in the same location
    const { data: gymsInArea } = await supabase
      .from('gyms')
      .select('id, gym_name, location')
      .eq('location', gym.location)
      .eq('status', 'approved');

    // Get bookings count for all gyms in area for comparison
    const gymRankings: Array<{ gym_id: string; gym_name: string; bookings_count: number }> = [];
    
    if (gymsInArea && gymsInArea.length > 0) {
      for (const areaGym of gymsInArea) {
        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('gym_id', areaGym.id);
        
        gymRankings.push({
          gym_id: areaGym.id,
          gym_name: areaGym.gym_name || 'Unknown',
          bookings_count: count || 0,
        });
      }
    }

    // Sort by bookings count descending
    gymRankings.sort((a, b) => b.bookings_count - a.bookings_count);
    
    // Find current gym's rank
    const currentGymRank = gymRankings.findIndex(g => g.gym_id === gym.id) + 1;
    const totalGymsInArea = gymRankings.length;

    // 5. Query รายได้เดือนนี้ (from paid bookings)
    const { data: monthlyBookings } = await supabase
      .from('bookings')
      .select('price_paid, payment_status')
      .eq('gym_id', gym.id)
      .eq('payment_status', 'paid')
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO);

    const monthlyRevenue = monthlyBookings?.reduce((sum, booking) => {
      return sum + (parseFloat(booking.price_paid?.toString() || '0') || 0);
    }, 0) || 0;

    // Query รายได้ทั้งหมด
    const { data: allPaidBookings } = await supabase
      .from('bookings')
      .select('price_paid, payment_status, created_at')
      .eq('gym_id', gym.id)
      .eq('payment_status', 'paid');

    const totalRevenue = allPaidBookings?.reduce((sum, booking) => {
      return sum + (parseFloat(booking.price_paid?.toString() || '0') || 0);
    }, 0) || 0;

    // 6. Query กราฟรายได้ (รายเดือน/รายสัปดาห์)
    const revenueByDate: Record<string, number> = {};
    const revenueByMonth: Record<string, number> = {};
    const revenueByWeek: Record<string, number> = {};

    if (allPaidBookings) {
      for (const booking of allPaidBookings) {
        const bookingDate = new Date(booking.created_at);
        const amount = parseFloat(booking.price_paid?.toString() || '0') || 0;

        // By date
        const dateKey = bookingDate.toISOString().split('T')[0];
        revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + amount;

        // By month
        const monthKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + amount;

        // By week (ISO week)
        const weekStart = new Date(bookingDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];
        revenueByWeek[weekKey] = (revenueByWeek[weekKey] || 0) + amount;
      }
    }

    // 7. Query บริการยอดนิยม (popular packages)
    const { data: packageBookings } = await supabase
      .from('bookings')
      .select('package_id, package_name, package_type, price_paid')
      .eq('gym_id', gym.id)
      .eq('payment_status', 'paid');

    // Count bookings per package
    const packageStats: Record<string, {
      package_id: string | null;
      package_name: string;
      package_type: string;
      bookings_count: number;
      revenue: number;
    }> = {};

    if (packageBookings) {
      for (const booking of packageBookings) {
        const packageKey = booking.package_id || booking.package_name || 'unknown';
        
        if (!packageStats[packageKey]) {
          packageStats[packageKey] = {
            package_id: booking.package_id || null,
            package_name: booking.package_name || 'Unknown',
            package_type: booking.package_type || 'unknown',
            bookings_count: 0,
            revenue: 0,
          };
        }
        
        packageStats[packageKey].bookings_count += 1;
        packageStats[packageKey].revenue += parseFloat(booking.price_paid?.toString() || '0') || 0;
      }
    }

    // Convert to array and sort by bookings count
    const popularServices = Object.values(packageStats)
      .sort((a, b) => b.bookings_count - a.bookings_count)
      .slice(0, 10); // Top 10

    return NextResponse.json({
      success: true,
      data: {
        gym: {
          id: gym.id,
          name: gym.gym_name,
          location: gym.location,
        },
        period: {
          startDate: startDateISO,
          endDate: endDateISO,
        },
        // 1. จำนวนลูกค้าทั้งหมด
        totalCustomers,
        // 2. จำนวนการจอง
        bookings: {
          monthly: monthlyBookingsCount || 0,
          total: totalBookingsCount || 0,
        },
        // 3. คะแนนเฉลี่ย
        rating: {
          average: averageRating,
          totalRatings,
        },
        // 4. อันดับในพื้นที่
        areaRanking: {
          rank: currentGymRank || null,
          totalGyms: totalGymsInArea,
          position: currentGymRank ? `${currentGymRank} / ${totalGymsInArea}` : 'N/A',
        },
        // 5. รายได้
        revenue: {
          monthly: monthlyRevenue,
          total: totalRevenue,
        },
        // 6. กราฟรายได้
        charts: {
          byDate: revenueByDate,
          byMonth: revenueByMonth,
          byWeek: revenueByWeek,
        },
        // 7. บริการยอดนิยม
        popularServices,
      },
    });
    
  } catch (error) {
    console.error('Get partner analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

