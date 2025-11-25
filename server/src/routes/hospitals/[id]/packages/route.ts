/**
 * hospital Packages API Endpoint
 * 
 * GET /api/hospitals/[id]/packages - Get all packages for a hospital
 */

import { NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { NextRequest } from 'next/server';

/**
 * GET /api/hospitals/[id]/packages
 * ดึงแพ็คเกจทั้งหมดของค่าย
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    // ตรวจสอบว่าโรงพยาบาลมีอยู่และ approved
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id, hospital_name, status')
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle();

    if (hospitalError || !hospital) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบโรงพยาบาลที่ต้องการ' },
        { status: 404 }
      );
    }

    // ดึงแพ็คเกจที่ active
    const { data: packages, error: packagesError } = await supabase
      .from('hospital_packages')
      .select('*')
      .eq('hospital_id', id)
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
        hospital: {
          id: hospital.id,
          name: hospital.hospital_name,
        },
        packages: packages || [],
        oneTimePackages,
        subscriptionPackages,
      },
    });

  } catch (error) {
    console.error('Error fetching hospital packages:', error);
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

