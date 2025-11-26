/**
 * hospital Management API Endpoint (Admin Only)
 * 
 * GET /api/hospitals/[id] - Get single hospital details
 * PATCH /api/hospitals/[id] - Update hospital information
 * DELETE /api/hospitals/[id] - Delete hospital
 */

import { NextResponse } from 'next/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';
import { getHospitalById, updateHospital, deleteHospital } from '@shared/services';

/**
 * GET /api/hospitals/[id]
 * ดึงข้อมูลโรงพยาบาลเดี่ยว
 */
const getHospitalHandler = withAdminAuth<{ id: string }>(async (
  _request,
  context
) => {
  try {
    const { id } = await context.params;
    const hospital = await getHospitalById(id);

    if (!hospital) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบโรงพยาบาลที่ต้องการ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: hospital,
    });

  } catch (error) {
    console.error('Error fetching hospital:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโรงพยาบาล',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export { getHospitalHandler as GET };


/**
 * PATCH /api/hospitals/[id]
 * แก้ไขข้อมูลโรงพยาบาล
 */
const patchHospitalHandler = withAdminAuth<{ id: string }>(async (
  request,
  context
) => {
  try {
    const { id } = await context.params;
    const body = await request.json() as {
      hospital_name?: string;
      hospital_name_english?: string;
      contact_name?: string;
      phone?: string;
      email?: string;
      website?: string;
      location?: string;
      hospital_details?: string;
      services?: string[];
      status?: string;
    };
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

    const updatedHospital = await updateHospital(id, {
      hospital_name,
      hospital_name_english,
      contact_name,
      phone,
      email,
      website,
      location,
      hospital_details,
      services,
      status: status as 'pending' | 'approved' | 'rejected' | undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'อัพเดทข้อมูลโรงพยาบาลสำเร็จ',
      data: updatedHospital,
    });

  } catch (error) {
    console.error('Error updating hospital:', error);
    
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

    // Handle not found error
    if (error instanceof Error && error.message === 'ไม่พบโรงพยาบาลที่ต้องการ') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลโรงพยาบาล',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export { patchHospitalHandler as PATCH };

/**
 * DELETE /api/hospitals/[id]
 * ลบโรงพยาบาล
 */
const deleteHospitalHandler = withAdminAuth<{ id: string }>(async (
  _request,
  context
) => {
  try {
    const { id } = await context.params;
    await deleteHospital(id);

    return NextResponse.json({
      success: true,
      message: 'ลบโรงพยาบาลสำเร็จ',
    });

  } catch (error) {
    console.error('Error deleting hospital:', error);
    
    // Handle not found error
    if (error instanceof Error && error.message === 'ไม่พบโรงพยาบาลที่ต้องการ') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการลบโรงพยาบาล',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export { deleteHospitalHandler as DELETE };
