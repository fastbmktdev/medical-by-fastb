/**
 * Partner Promotions API
 * 
 * GET /api/partner/promotions - ดึง promotions ของค่ายตัวเอง
 * POST /api/partner/promotions - สร้าง promotion ใหม่สำหรับค่ายตัวเอง
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * GET /api/partner/promotions
 * ดึง promotions ทั้งหมดของค่ายตัวเอง
 * Query params:
 * - isActive: filter by active status (optional)
 * - showInMarquee: filter by marquee display (optional)
 */
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
      .select('id, gym_name, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gymError || !gym) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบค่ายมวยของคุณ กรุณาสมัครเป็นพาร์ทเนอร์ก่อน' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่า gym ได้รับการอนุมัติแล้ว
    if (gym.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'ค่ายมวยของคุณยังไม่ได้รับการอนุมัติ' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get('isActive');
    const showInMarqueeParam = searchParams.get('showInMarquee');
    
    // Build query - ดึงเฉพาะ promotions ของ gym นี้
    let query = supabase
      .from('promotions')
      .select('*')
      .eq('gym_id', gym.id)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (isActiveParam !== null) {
      query = query.eq('is_active', isActiveParam === 'true');
    }
    
    if (showInMarqueeParam !== null) {
      query = query.eq('show_in_marquee', showInMarqueeParam === 'true');
    }
    
    const { data: promotions, error } = await query;
    
    if (error) {
      console.error('Error fetching partner promotions:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch promotions' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: promotions || [],
      count: promotions?.length || 0,
    });
    
  } catch (error) {
    console.error('Get partner promotions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/partner/promotions
 * สร้าง promotion ใหม่สำหรับค่ายตัวเอง
 * Body:
 * - title: string (required)
 * - titleEnglish?: string
 * - description?: string
 * - isActive?: boolean (default: true)
 * - priority?: number (default: 0)
 * - showInMarquee?: boolean (default: true)
 * - startDate?: ISO string
 * - endDate?: ISO string
 * - linkUrl?: string
 * - linkText?: string
 */
export async function POST(request: NextRequest) {
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
      .select('id, gym_name, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gymError || !gym) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบค่ายมวยของคุณ' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่า gym ได้รับการอนุมัติแล้ว
    if (gym.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'ค่ายมวยของคุณยังไม่ได้รับการอนุมัติ ไม่สามารถสร้างโปรโมชั่นได้' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    const {
      title,
      titleEnglish,
      description,
      isActive = true,
      priority = 0,
      showInMarquee = true,
      startDate,
      endDate,
      linkUrl,
      linkText,
    } = body;
    
    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }
    
    // Validate dates if provided
    if (startDate && isNaN(new Date(startDate).getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid start date format' },
        { status: 400 }
      );
    }
    
    if (endDate && isNaN(new Date(endDate).getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid end date format' },
        { status: 400 }
      );
    }
    
    // Validate date range
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }
    
    // Validate priority
    if (priority !== undefined && (typeof priority !== 'number' || priority < 0)) {
      return NextResponse.json(
        { success: false, error: 'Priority must be a non-negative number' },
        { status: 400 }
      );
    }
    
    // Build insert data
    const insertData: Record<string, unknown> = {
      title: title.trim(),
      gym_id: gym.id, // Associate with partner's gym
      is_active: isActive,
      priority: parseInt(priority.toString()) || 0,
      show_in_marquee: showInMarquee,
      created_by: user.id,
    };
    
    if (titleEnglish !== undefined) {
      insertData.title_english = titleEnglish?.trim() || null;
    }
    
    if (description !== undefined) {
      insertData.description = description?.trim() || null;
    }
    
    if (startDate) {
      insertData.start_date = new Date(startDate).toISOString();
    }
    
    if (endDate) {
      insertData.end_date = new Date(endDate).toISOString();
    }
    
    if (linkUrl !== undefined) {
      insertData.link_url = linkUrl?.trim() || null;
    }
    
    if (linkText !== undefined) {
      insertData.link_text = linkText?.trim() || null;
    }
    
    // Insert promotion
    const { data: promotion, error: insertError } = await supabase
      .from('promotions')
      .insert(insertData)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating partner promotion:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create promotion', details: insertError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: promotion,
      message: 'Promotion created successfully',
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create partner promotion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
