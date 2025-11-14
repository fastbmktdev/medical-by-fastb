/**
 * Partner Conversations API
 * 
 * GET /api/partner/conversations - ดูรายการ conversations ทั้งหมดของ partner
 * 
 * Returns list of conversations with last message preview and unread count
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * GET /api/partner/conversations
 * ดูรายการ conversations ทั้งหมด
 * 
 * Query params:
 * - status: string (optional) - 'active', 'archived', 'closed'
 * - limit: number (default: 20)
 * - offset: number (default: 0)
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

    // ตรวจสอบว่าเป็น partner
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleData || roleData.role !== 'partner') {
      return NextResponse.json(
        { success: false, error: 'คุณไม่มีสิทธิ์ดูข้อมูล' },
        { status: 403 }
      );
    }

    // ดึงค่ายของ partner
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gymError || !gym) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบค่ายมวยของคุณ' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // ดึง conversations พร้อมข้อมูลลูกค้า
    let query = supabase
      .from('conversations')
      .select(`
        *,
        customer:customer_id (
          id,
          email,
          raw_user_meta_data
        ),
        gym:gym_id (
          id,
          gym_name,
          gym_name_english
        ),
        booking:booking_id (
          id,
          booking_id,
          start_date
        )
      `, { count: 'exact' })
      .eq('partner_id', user.id)
      .eq('gym_id', gym.id);

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: conversations, error: convError, count } = await query
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (convError) {
      throw convError;
    }

    // เติมข้อมูล profile ของลูกค้า
    const conversationsWithProfiles = await Promise.all(
      (conversations || []).map(async (conv) => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('user_id', conv.customer_id)
            .maybeSingle();

          return {
            ...conv,
            customer_profile: profile || {
              full_name: conv.customer?.raw_user_meta_data?.full_name || null,
              username: null,
              avatar_url: null,
            },
            customer_email: conv.customer?.email || null,
          };
        } catch (error) {
          console.warn('Error fetching profile:', error);
          return {
            ...conv,
            customer_profile: {
              full_name: conv.customer?.raw_user_meta_data?.full_name || null,
              username: null,
              avatar_url: null,
            },
            customer_email: conv.customer?.email || null,
          };
        }
      })
    );

    // นับ unread conversations
    const { count: unreadCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', user.id)
      .eq('gym_id', gym.id)
      .eq('status', 'active')
      .gt('unread_count_partner', 0);

    return NextResponse.json({
      success: true,
      data: {
        conversations: conversationsWithProfiles,
        unread_count: unreadCount || 0,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      },
    });

  } catch (error) {
    console.error('Error in GET /api/partner/conversations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/partner/conversations
 * สร้าง conversation ใหม่
 * 
 * Body:
 * - customer_id: UUID (required)
 * - subject?: string (optional)
 * - booking_id?: UUID (optional)
 * - initial_message: string (required) - ข้อความแรก
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleData || roleData.role !== 'partner') {
      return NextResponse.json(
        { success: false, error: 'คุณไม่มีสิทธิ์' },
        { status: 403 }
      );
    }

    const { data: gym } = await supabase
      .from('gyms')
      .select('id, gym_name, gym_name_english')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!gym) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบค่ายมวยของคุณ' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { customer_id, subject, booking_id, initial_message } = body;

    if (!customer_id || !initial_message) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามี conversation อยู่แล้วหรือไม่
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('partner_id', user.id)
      .eq('customer_id', customer_id)
      .eq('gym_id', gym.id)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'มีการสนทนากับลูกค้านี้อยู่แล้ว',
          data: { conversation_id: existing.id }
        },
        { status: 409 }
      );
    }

    // สร้าง conversation ใหม่
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        partner_id: user.id,
        customer_id,
        gym_id: gym.id,
        conversation_type: 'partner_customer',
        subject: subject || `ข้อความจาก ${gym.gym_name || gym.gym_name_english}`,
        booking_id: booking_id || null,
        status: 'active',
      })
      .select()
      .single();

    if (convError || !newConv) {
      throw convError;
    }

    // สร้าง participants
    await supabase.from('conversation_participants').insert([
      { conversation_id: newConv.id, user_id: user.id, role: 'partner' },
      { conversation_id: newConv.id, user_id: customer_id, role: 'customer' },
    ]);

    // สร้างข้อความแรก
    const { data: firstMessage } = await supabase
      .from('messages')
      .insert({
        conversation_id: newConv.id,
        sender_id: user.id,
        sender_role: 'partner',
        message_text: initial_message.trim(),
        message_type: 'text',
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      message: 'สร้างการสนทนาสำเร็จ',
      data: {
        conversation: newConv,
        first_message: firstMessage,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/partner/conversations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาด',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

