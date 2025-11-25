/**
 * hospitals API Endpoint (Admin Only)
 * 
 * GET /api/hospitals - List all hospitals
 * POST /api/hospitals - Create new hospital
 */

import { NextResponse } from 'next/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';
import { getHospitals, createHospital } from '@shared/services';

const getHospitalsHandler = withAdminAuth(async () => {
  try {
    const hospitals = await getHospitals();

    return NextResponse.json({
      success: true,
      count: hospitals.length,
      hospitals,
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export { getHospitalsHandler as GET };

/**
 * POST /api/hospitals
 * สร้างโรงพยาบาลใหม่ (Admin only)
 */
const postHospitalHandler = withAdminAuth(async (
    request, 
    _context, 
    user
) => {
  try {
    const body = await request.json();
    const {
      hospital_name,
      hospital_name_english,
      contact_name,
      phone,
      email,
      website,
      location,
      hospital_details,
      services,
      status,
    } = body;

    const createdHospital = await createHospital({
      user_id: user.id,
      hospital_name,
      hospital_name_english,
      contact_name,
      phone,
      email,
      website,
      location,
      hospital_details,
      services,
      status: status || 'approved', // Default เป็น approved เพราะ admin สร้างเอง
    });

    return NextResponse.json({
      success: true,
      message: 'สร้างโรงพยาบาลใหม่สำเร็จ',
      data: createdHospital,
    });

  } catch (error) {
    console.error('Error creating hospital:', error);
    
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
        error: 'เกิดข้อผิดพลาดในการสร้างโรงพยาบาล',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export { postHospitalHandler as POST };

