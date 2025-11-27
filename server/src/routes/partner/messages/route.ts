/**
 * Partner Messages API
 * 
 * POST /api/partner/messages - สร้าง/ส่งข้อความใหม่
 * GET /api/partner/messages - ดูข้อความทั้งหมด (รองรับ conversation_id filter)
 * PATCH /api/partner/messages - Mark messages as read
 * 
 * Partners can send messages to customers who have appointments at their hospital
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

interface MessageInsert {
  conversation_id: string;
  sender_id: string;
  sender_role: 'partner' | 'customer' | 'admin';
  message_text: string;
  message_type?: 'text' | 'image' | 'file' | 'system';
  attachments?: Array<{ url: string; name: string; size: number; type: string }>;
  reply_to_message_id?: string;
}

/**
 * POST /api/partner/messages
 * สร้าง/ส่งข้อความใหม่
 * 
 * Body:
 * - customer_id: UUID (required) - ID ของลูกค้า
 * - message: string (required) - เนื้อหาข้อความ
 * - booking_id?: UUID (optional) - Link to appointment
 * - conversation_id?: UUID (optional) - ถ้ามี conversation อยู่แล้ว
 * - subject?: string (optional) - หัวข้อ (สำหรับ conversation ใหม่)
 * - attachments?: Array (optional) - ไฟล์แนบ
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
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
        { success: false, error: 'คุณไม่มีสิทธิ์ส่งข้อความ' },
        { status: 403 }
      );
    }

    // ดึงค่ายของ partner
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id, hospital_name, hospital_name_english')
      .eq('user_id', user.id)
      .maybeSingle();

    if (hospitalError || !hospital) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบโรงพยาบาลของคุณ' },
        { status: 404 }
      );
    }

    const body = await request.json() as {
      customer_id?: string;
      message?: string;
      booking_id?: string;
      conversation_id?: string;
      subject?: string;
      attachments?: unknown[];
    };
    const { 
      customer_id, 
      message, 
      booking_id, 
      conversation_id,
      subject,
      attachments = []
    } = body;

    // Validation
    if (!customer_id) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุผู้รับ' },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุเนื้อหาข้อความ' },
        { status: 400 }
      );
    }

    if (message.trim().length > 5000) {
      return NextResponse.json(
        { success: false, error: 'เนื้อหาต้องไม่เกิน 5000 ตัวอักษร' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าลูกค้ามี appointment ที่ค่ายนี้หรือไม่
    const { data: appointment, error: bookingError } = await supabase
      .from('appointments')
      .select('id')
      .eq('user_id', customer_id)
      .eq('hospital_id', hospital.id)
      .limit(1)
      .maybeSingle();

    if (bookingError || !appointment) {
      return NextResponse.json(
        { success: false, error: 'ลูกค้านี้ยังไม่มีการจองกับค่ายของคุณ' },
        { status: 404 }
      );
    }

    let finalConversationId = conversation_id;

    // ถ้าไม่มี conversation_id ให้ค้นหา หรือสร้างใหม่
    if (!finalConversationId) {
      // ค้นหา conversation ที่มีอยู่แล้ว
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('partner_id', user.id)
        .eq('customer_id', customer_id)
        .eq('hospital_id', hospital.id)
        .eq('conversation_type', 'partner_customer')
        .eq('status', 'active')
        .maybeSingle();

      if (existingConv) {
        finalConversationId = existingConv.id;
      } else {
        // สร้าง conversation ใหม่
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            partner_id: user.id,
            customer_id,
            hospital_id: hospital.id,
            conversation_type: 'partner_customer',
            subject: subject || `ข้อความจาก ${hospital.hospital_name || hospital.hospital_name_english}`,
            booking_id: booking_id || appointment.id,
            status: 'active',
          })
          .select('id')
          .single();

        if (convError || !newConv) {
          console.error('Error creating conversation:', convError);
          return NextResponse.json(
            { success: false, error: 'ไม่สามารถสร้างการสนทนาได้' },
            { status: 500 }
          );
        }

        finalConversationId = newConv.id;

        // สร้าง conversation participants
        await supabase.from('conversation_participants').insert([
          {
            conversation_id: finalConversationId,
            user_id: user.id,
            role: 'partner',
            is_active: true,
          },
          {
            conversation_id: finalConversationId,
            user_id: customer_id,
            role: 'customer',
            is_active: true,
          },
        ]);
      }
    }

    // สร้างข้อความใหม่
    const messageData: MessageInsert = {
      conversation_id: finalConversationId as string,
      sender_id: user.id,
      sender_role: 'partner',
      message_text: message?.trim() || '',
      message_type: attachments && attachments.length > 0 ? 'file' : 'text',
      attachments: attachments && attachments.length > 0 ? (attachments as Array<{ url: string; name: string; size: number; type: string }>) : undefined,
    };

    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert(messageData)
      .select('*')
      .single();

    if (messageError || !newMessage) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถส่งข้อความได้' },
        { status: 500 }
      );
    }

    // ส่ง notification ให้ลูกค้า
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: customer_id,
          type: 'partner_message',
          title: `ข้อความจาก ${hospital.hospital_name || hospital.hospital_name_english}`,
          message: message.trim().substring(0, 100) + (message.length > 100 ? '...' : ''),
          link_url: `/dashboard/messages/${finalConversationId}`,
          metadata: {
            conversation_id: finalConversationId,
            message_id: newMessage.id,
            hospital_id: hospital.id,
            partner_id: user.id,
          },
        });
    } catch (notifError) {
      console.warn('Failed to send notification:', notifError);
    }

    // Log audit event
    try {
      await supabase.rpc('log_audit_event', {
        p_user_id: user.id,
        p_action_type: 'create',
        p_resource_type: 'message',
        p_resource_id: newMessage.id,
        p_resource_name: `Message to customer`,
        p_description: `Partner sent message in conversation ${finalConversationId}`,
        p_new_values: {
          conversation_id: finalConversationId,
          customer_id,
          hospital_id: hospital.id,
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
        message: newMessage,
        conversation_id: finalConversationId,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/partner/messages:', error);
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
 * ดูข้อความในแต่ละ conversation
 * 
 * Query params:
 * - conversation_id: UUID (required) - ID ของ conversation
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
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
        { success: false, error: 'คุณไม่มีสิทธิ์ดูข้อความ' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ conversation_id' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า partner เป็นเจ้าของ conversation นี้
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('partner_id', user.id)
      .maybeSingle();

    if (convError || !conversation) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบการสนทนานี้' },
        { status: 404 }
      );
    }

    // ดึงข้อความ
    const { data: messages, error: messagesError, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      throw messagesError;
    }

    // Mark messages as read (ที่เป็นฝั่งลูกค้าส่งมา)
    try {
      await supabase.rpc('mark_conversation_as_read', {
        p_conversation_id: conversationId,
        p_user_id: user.id,
        p_user_role: 'partner',
      });
    } catch (readError) {
      console.warn('Failed to mark as read:', readError);
    }

    return NextResponse.json({
      success: true,
      data: {
        messages: messages || [],
        conversation,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      },
    });

  } catch (error) {
    console.error('Error in GET /api/partner/messages:', error);
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

/**
 * PATCH /api/partner/messages
 * Mark conversation as read
 * 
 * Body:
 * - conversation_id: UUID (required)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
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

    const body = await request.json() as {
      conversation_id?: string;
    };
    const { conversation_id } = body;

    if (!conversation_id) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ conversation_id' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าเป็นเจ้าของ conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversation_id)
      .eq('partner_id', user.id)
      .maybeSingle();

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบการสนทนานี้' },
        { status: 404 }
      );
    }

    // Mark as read
    await supabase.rpc('mark_conversation_as_read', {
      p_conversation_id: conversation_id,
      p_user_id: user.id,
      p_user_role: 'partner',
    });

    return NextResponse.json({
      success: true,
      message: 'อัปเดตสถานะสำเร็จ',
    });

  } catch (error) {
    console.error('Error in PATCH /api/partner/messages:', error);
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
