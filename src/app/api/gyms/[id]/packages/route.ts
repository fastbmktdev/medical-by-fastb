/**
 * Gym Packages API Endpoint
 * 
 * GET /api/gyms/[id]/packages - Get all packages for a gym
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { NextRequest } from 'next/server';

/**
 * GET /api/gyms/[id]/packages
 * ดึงแพ็คเกจทั้งหมดของค่าย
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    // ตรวจสอบว่ายิมมีอยู่และ approved
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, gym_name, status')
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle();

    if (gymError || !gym) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบค่ายมวยที่ต้องการ' },
        { status: 404 }
      );
    }

    // ดึงแพ็คเกจที่ active
    const { data: packages, error: packagesError } = await supabase
      .from('gym_packages')
      .select('*')
      .eq('gym_id', id)
      .eq('is_active', true)
      .order('package_type', { ascending: true })
      .order('duration_months', { ascending: true });

    if (packagesError) {
      throw packagesError;
    }

    // แยกประเภทแพ็คเกจ
    const oneTimePackages = packages?.filter(p => p.package_type === 'one_time') || [];
    const subscriptionPackages = packages?.filter(p => p.package_type === 'package') || [];

    return NextResponse.json({
      success: true,
      data: {
        gym: {
          id: gym.id,
          name: gym.gym_name,
        },
        packages: packages || [],
        oneTimePackages,
        subscriptionPackages,
      },
    });

  } catch (error) {
    console.error('Error fetching gym packages:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแพ็คเกจ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

