/**
 * Partner Messages API
 * 
 * POST /api/partner/messages - Partner ส่งข้อความถึงลูกค้า
 * GET /api/partner/messages - ดูข้อความที่ส่งไป
 * 
 * Partners can send messages to users who have bookings at their gym
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * POST /api/partner/messages
 * Partner ส่งข้อความถึงลูกค้า
 * Body:
 * - user_id: UUID (required) - ID ของลูกค้าที่จะส่งข้อความ
 * - subject: string (required) - หัวข้อข้อความ
 * - message: string (required) - เนื้อหาข้อความ
 * - booking_id?: UUID (optional) - ID ของการจองที่เกี่ยวข้อง (ถ้ามี)
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
        { success: false, error: 'คุณไม่มีสิทธิ์ส่งข้อความ' },
        { status: 403 }
      );
    }

    // ดึงค่ายของ partner
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, gym_name, gym_name_english, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gymError || !gym) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบค่ายมวยของคุณ' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { user_id, subject, message, booking_id } = body;

    // Validation
    const errors: Record<string, string> = {};

    if (!user_id) {
      errors.user_id = 'กรุณาระบุผู้รับ';
    }

    if (!subject || subject.trim().length === 0) {
      errors.subject = 'กรุณาระบุหัวข้อ';
    } else if (subject.trim().length > 200) {
      errors.subject = 'หัวข้อต้องไม่เกิน 200 ตัวอักษร';
    }

    if (!message || message.trim().length === 0) {
      errors.message = 'กรุณาระบุเนื้อหา';
    } else if (message.trim().length > 5000) {
      errors.message = 'เนื้อหาต้องไม่เกิน 5000 ตัวอักษร';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', errors },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าผู้ใช้มี booking ที่ค่ายนี้หรือไม่ (ถ้าไม่ใช่ admin)
    if (roleData.role === 'partner') {
      let bookingQuery = supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user_id)
        .eq('gym_id', gym.id)
        .limit(1);

      if (booking_id) {
        bookingQuery = bookingQuery.eq('id', booking_id);
      }

      const { data: booking, error: bookingError } = await bookingQuery.maybeSingle();

      if (bookingError || !booking) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบการจองที่เกี่ยวข้องกับผู้ใช้รายนี้' },
          { status: 404 }
        );
      }
    }

    // ดึงข้อมูลผู้รับ
    const { data: recipient } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('user_id', user_id)
      .maybeSingle();

    const recipientName = recipient?.full_name || recipient?.username || 'ลูกค้า';

    // สร้างข้อความในระบบ (ถ้ามี messages table) หรือใช้ metadata
    // สำหรับตอนนี้ เราจะส่ง notification โดยตรง

    // ส่ง notification ถึงผู้ใช้
    try {
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user_id,
          type: 'partner_message',
          title: `ข้อความจาก ${gym.gym_name || gym.gym_name_english || 'ค่ายมวย'}`,
          message: subject,
          link_url: booking_id ? `/dashboard/bookings` : '/dashboard',
          metadata: {
            partner_id: user.id,
            partner_name: gym.gym_name || gym.gym_name_english || 'ค่ายมวย',
            gym_id: gym.id,
            subject: subject.trim(),
            message: message.trim(),
            booking_id: booking_id || null,
            sent_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        throw notificationError;
      }

      // Log audit event
      try {
        await supabase.rpc('log_audit_event', {
          p_user_id: user.id,
          p_action_type: 'create',
          p_resource_type: 'notification',
          p_resource_id: notification.id,
          p_resource_name: `Message to ${recipientName}`,
          p_description: `Partner sent message to user: ${subject}`,
          p_new_values: {
            recipient_id: user_id,
            subject: subject.trim(),
            gym_id: gym.id,
          },
          p_severity: 'low',
        });
      } catch (auditError) {
        console.warn('Failed to log audit event:', auditError);
      }

      return NextResponse.json({
        success: true,
        message: 'ส่งข้อความสำเร็จ',
        data: {
          notification_id: notification.id,
          sent_at: notification.created_at,
        },
      }, { status: 201 });

    } catch (error) {
      console.error('Error sending partner message:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'เกิดข้อผิดพลาดในการส่งข้อความ',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in partner messages API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการส่งข้อความ',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/partner/messages
 * ดูข้อความที่ส่งไป (notification history)
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - user_id: filter by recipient user_id (optional)
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
        { success: false, error: 'คุณไม่มีสิทธิ์ดูข้อความ' },
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
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const filterUserId = searchParams.get('user_id');

    // ดึง notifications ที่เป็น partner_message และมี gym_id ใน metadata
    // Note: เนื่องจาก notifications table ไม่มี field สำหรับ partner_id โดยตรง
    // เราจะใช้ metadata เพื่อ filter
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('type', 'partner_message')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by user_id if provided
    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    }

    const { data: notifications, error: notificationsError } = await query;

    if (notificationsError) {
      throw notificationsError;
    }

    // Filter notifications where gym_id in metadata matches current gym
    // (Only if user is partner, not admin)
    let filteredNotifications = notifications || [];
    if (roleData.role === 'partner') {
      filteredNotifications = filteredNotifications.filter((notification) => {
        const metadata = notification.metadata as Record<string, unknown> | null;
        return metadata?.gym_id === gym.id && metadata?.partner_id === user.id;
      });
    }

    // Get total count
    let countQuery = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'partner_message');

    if (filterUserId) {
      countQuery = countQuery.eq('user_id', filterUserId);
    }

    const { count } = await countQuery;
    const totalCount = roleData.role === 'partner' 
      ? filteredNotifications.length 
      : (count || 0);

    return NextResponse.json({
      success: true,
      data: {
        messages: filteredNotifications,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: totalCount > offset + limit,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching partner messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลข้อความ',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

