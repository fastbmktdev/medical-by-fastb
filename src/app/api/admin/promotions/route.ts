/**
 * Admin Promotions API
 * GET /api/admin/promotions - ดูโปรโมชั่นทั้งหมด
 * POST /api/admin/promotions - สร้างโปรโมชั่นใหม่
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

/**
 * GET /api/admin/promotions
 * ดึงรายการโปรโมชั่นทั้งหมด (Admin only)
 * Query params:
 * - isActive: filter by active status (optional)
 * - showInMarquee: filter by marquee display (optional)
 */
const getPromotionsHandler = withAdminAuth(async (
  request: NextRequest,
  _context,
  _user
) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Get filters
    const isActiveParam = searchParams.get('isActive');
    const showInMarqueeParam = searchParams.get('showInMarquee');
    
    // Build query
    let query = supabase
      .from('promotions')
      .select('*')
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
      console.error('Error fetching promotions:', error);
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
    console.error('Get promotions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/promotions
 * สร้างโปรโมชั่นใหม่ (Admin only)
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
const createPromotionHandler = withAdminAuth(async (
  request: NextRequest,
  _context,
  user
) => {
  try {
    const supabase = await createClient();
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
    const { data: promotion, error } = await supabase
      .from('promotions')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating promotion:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create promotion', details: error.message },
        { status: 500 }
      );
    }
    
    // Send notifications to all users if promotion is active
    if (isActive && promotion) {
      try {
        // Get all users who have opted in for promotion notifications
        const { data: users, error: usersError } = await supabase
          .from('notification_preferences')
          .select('user_id')
          .eq('promotions', true);
        
        if (!usersError && users && users.length > 0) {
          // Create notifications in batch
          const notifications = users.map((user) => ({
            user_id: user.user_id,
            type: 'promotion',
            title: '🎉 โปรโมชั่นใหม่!',
            message: title,
            link_url: linkUrl || '/',
            metadata: {
              promotion_id: promotion.id,
              title: title,
              description: description,
              link_url: linkUrl,
            },
          }));
          
          // Insert notifications (batch insert)
          await supabase
            .from('notifications')
            .insert(notifications);
          
          console.log(`Sent promotion notifications to ${users.length} users`);
        }
      } catch (notificationError) {
        // Don't fail promotion creation if notification fails
        console.warn('Failed to send promotion notifications:', notificationError);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: promotion,
      message: 'Promotion created successfully',
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create promotion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export { getPromotionsHandler as GET, createPromotionHandler as POST };

