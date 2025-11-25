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
import { createClient } from '@shared/lib/database/supabase/server';
import { fetchPlaceReviews } from '@shared/lib/utils/googlePlaces';

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
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id, hospital_name, location, status, google_place_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (hospitalError || !hospital) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบโรงพยาบาลของคุณ กรุณาสมัครเป็นพาร์ทเนอร์ก่อน' },
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

    // 1. Query จำนวนลูกค้าทั้งหมด (unique customers from appointments)
    const { data: allBookings } = await supabase
      .from('appointments')
      .select('user_id, customer_email')
      .eq('hospital_id', hospital.id);
    
    const uniqueCustomers = new Set<string>();
    if (allBookings) {
      for (const appointment of allBookings) {
        if (appointment.user_id) {
          uniqueCustomers.add(appointment.user_id);
        } else if (appointment.customer_email) {
          uniqueCustomers.add(appointment.customer_email);
        }
      }
    }
    const totalCustomers = uniqueCustomers.size;

    // 2. Query จำนวนการจองเดือนนี้
    const { count: monthlyBookingsCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospital.id)
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO);

    // Query จำนวนการจองทั้งหมด
    const { count: totalBookingsCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospital.id);

    // 3. Query คะแนนเฉลี่ย (from Google Places API if available)
    let averageRating: number | null = null;
    let totalRatings = 0;
    
    if (hospital.google_place_id) {
      try {
        const googleReviews = await fetchPlaceReviews({ 
          placeId: hospital.google_place_id 
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

    // 4. Query อันดับในพื้นที่ (compare with other hospitals in same location)
    // Get all hospitals in the same location
    const { data: hospitalsInArea } = await supabase
      .from('hospitals')
      .select('id, hospital_name, location')
      .eq('location', hospital.location)
      .eq('status', 'approved');

    // Get appointments count for all hospitals in area for comparison
    const hospitalRankings: Array<{ hospital_id: string; hospital_name: string; bookings_count: number }> = [];
    
    if (hospitalsInArea && hospitalsInArea.length > 0) {
      for (const areaHospital of hospitalsInArea) {
        const { count } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('hospital_id', areaHospital.id);
        
        hospitalRankings.push({
          hospital_id: areaHospital.id,
          hospital_name: areaHospital.hospital_name || 'Unknown',
          bookings_count: count || 0,
        });
      }
    }

    // Sort by appointments count descending
    hospitalRankings.sort((a, b) => b.bookings_count - a.bookings_count);
    
    // Find current hospital's rank
    const currentHospitalRank = hospitalRankings.findIndex(h => h.hospital_id === hospital.id) + 1;
    const totalHospitalsInArea = hospitalRankings.length;

    // 5. Query รายได้เดือนนี้ (from paid appointments)
    const { data: monthlyBookings } = await supabase
      .from('appointments')
      .select('price_paid, payment_status')
      .eq('hospital_id', hospital.id)
      .eq('payment_status', 'paid')
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO);

    const monthlyRevenue = monthlyBookings?.reduce((sum, appointment) => {
      return sum + (parseFloat(appointment.price_paid?.toString() || '0') || 0);
    }, 0) || 0;

    // Query รายได้ทั้งหมด
    const { data: allPaidBookings } = await supabase
      .from('appointments')
      .select('price_paid, payment_status, created_at')
      .eq('hospital_id', hospital.id)
      .eq('payment_status', 'paid');

    const totalRevenue = allPaidBookings?.reduce((sum, appointment) => {
      return sum + (parseFloat(appointment.price_paid?.toString() || '0') || 0);
    }, 0) || 0;

    // 6. Query กราฟรายได้ (รายเดือน/รายสัปดาห์)
    const revenueByDate: Record<string, number> = {};
    const revenueByMonth: Record<string, number> = {};
    const revenueByWeek: Record<string, number> = {};

    if (allPaidBookings) {
      for (const appointment of allPaidBookings) {
        const bookingDate = new Date(appointment.created_at);
        const amount = parseFloat(appointment.price_paid?.toString() || '0') || 0;

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
      .from('appointments')
      .select('package_id, package_name, package_type, price_paid')
      .eq('hospital_id', hospital.id)
      .eq('payment_status', 'paid');

    // Count appointments per package
    const packageStats: Record<string, {
      package_id: string | null;
      package_name: string;
      package_type: string;
      bookings_count: number;
      revenue: number;
    }> = {};

    if (packageBookings) {
      for (const appointment of packageBookings) {
        const packageKey = appointment.package_id || appointment.package_name || 'unknown';
        
        if (!packageStats[packageKey]) {
          packageStats[packageKey] = {
            package_id: appointment.package_id || null,
            package_name: appointment.package_name || 'Unknown',
            package_type: appointment.package_type || 'unknown',
            bookings_count: 0,
            revenue: 0,
          };
        }
        
        packageStats[packageKey].bookings_count += 1;
        packageStats[packageKey].revenue += parseFloat(appointment.price_paid?.toString() || '0') || 0;
      }
    }

    // Convert to array and sort by appointments count
    const popularServices = Object.values(packageStats)
      .sort((a, b) => b.bookings_count - a.bookings_count)
      .slice(0, 10); // Top 10

    return NextResponse.json({
      success: true,
      data: {
        hospital: {
          id: hospital.id,
          name: hospital.hospital_name,
          location: hospital.location,
        },
        period: {
          startDate: startDateISO,
          endDate: endDateISO,
        },
        // 1. จำนวนลูกค้าทั้งหมด
        totalCustomers,
        // 2. จำนวนการจอง
        appointments: {
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
          rank: currentHospitalRank || null,
          totalHospitals: totalHospitalsInArea,
          position: currentHospitalRank ? `${currentHospitalRank} / ${totalHospitalsInArea}` : 'N/A',
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

