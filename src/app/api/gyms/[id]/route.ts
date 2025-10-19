/**
 * Gym Management API Endpoint (Admin Only)
 * 
 * GET /api/gyms/[id] - Get single gym details
 * PATCH /api/gyms/[id] - Update gym information
 * DELETE /api/gyms/[id] - Delete gym
 */

import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';
import { getGymById, updateGym, deleteGym } from '@/services';

/**
 * GET /api/gyms/[id]
 * ดึงข้อมูลยิมเดี่ยว
 */
const getGymHandler = withAdminAuth<{ id: string }>(async (
  _request,
  context
) => {
  try {
    const { id } = context.params;
    const gym = await getGymById(id);

    if (!gym) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบยิมที่ต้องการ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: gym,
    });

  } catch (error) {
    console.error('Error fetching gym:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลยิม',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export { getGymHandler as GET };


/**
 * PATCH /api/gyms/[id]
 * แก้ไขข้อมูลยิม
 */
const patchGymHandler = withAdminAuth<{ id: string }>(async (
  request,
  context
) => {
  try {
    const { id } = context.params;
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

    const updatedGym = await updateGym(id, {
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
    });

    return NextResponse.json({
      success: true,
      message: 'อัพเดทข้อมูลยิมสำเร็จ',
      data: updatedGym,
    });

  } catch (error) {
    console.error('Error updating gym:', error);
    
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
    if (error instanceof Error && error.message === 'ไม่พบยิมที่ต้องการ') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลยิม',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export { patchGymHandler as PATCH };

/**
 * DELETE /api/gyms/[id]
 * ลบยิม
 */
const deleteGymHandler = withAdminAuth<{ id: string }>(async (
  _request,
  context
) => {
  try {
    const { id } = context.params;
    await deleteGym(id);

    return NextResponse.json({
      success: true,
      message: 'ลบยิมสำเร็จ',
    });

  } catch (error) {
    console.error('Error deleting gym:', error);
    
    // Handle not found error
    if (error instanceof Error && error.message === 'ไม่พบยิมที่ต้องการ') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการลบยิม',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export { deleteGymHandler as DELETE };
