/**
 * Gyms API Endpoint (Admin Only)
 * 
 * GET /api/gyms - List all gyms
 * POST /api/gyms - Create new gym
 */

import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';
import { getGyms, createGym } from '@/services';

const getGymsHandler = withAdminAuth(async () => {
  try {
    const gyms = await getGyms();

    return NextResponse.json({
      success: true,
      count: gyms.length,
      gyms,
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export { getGymsHandler as GET };

/**
 * POST /api/gyms
 * สร้างยิมใหม่ (Admin only)
 */
const postGymHandler = withAdminAuth(async (
    request, 
    _context, 
    user
) => {
  try {
    const body = await request.json();
    const {
      gym_name,
      gym_name_english,
      contact_name,
      phone,
      email,
      website,
      location,
      gym_details,
      services,
      status,
    } = body;

    const createdGym = await createGym({
      user_id: user.id,
      gym_name,
      gym_name_english,
      contact_name,
      phone,
      email,
      website,
      location,
      gym_details,
      services,
      status: status || 'approved', // Default เป็น approved เพราะ admin สร้างเอง
    });

    return NextResponse.json({
      success: true,
      message: 'สร้างยิมใหม่สำเร็จ',
      data: createdGym,
    });

  } catch (error) {
    console.error('Error creating gym:', error);
    
    // Handle validation errors
    if (error instanceof Error && 'errors' in error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: (error as Error & { errors: Record<string, string> }).errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสร้างยิม',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export { postGymHandler as POST };

