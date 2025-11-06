/**
 * Admin Promotions API - Single Promotion
 * PUT /api/admin/promotions/[id] - แก้ไขโปรโมชั่น
 * DELETE /api/admin/promotions/[id] - ลบโปรโมชั่น
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

/**
 * PUT /api/admin/promotions/[id]
 * แก้ไขโปรโมชั่น (Admin only)
 * Body (all optional):
 * - title?: string
 * - titleEnglish?: string
 * - description?: string
 * - isActive?: boolean
 * - priority?: number
 * - showInMarquee?: boolean
 * - startDate?: ISO string
 * - endDate?: ISO string
 * - linkUrl?: string
 * - linkText?: string
 */
const updatePromotionHandler = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  _user
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    
    // Check if promotion exists
    const { data: existingPromotion, error: checkError } = await supabase
      .from('promotions')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    
    if (checkError || !existingPromotion) {
      return NextResponse.json(
        { success: false, error: 'Promotion not found' },
        { status: 404 }
      );
    }
    
    const {
      title,
      titleEnglish,
      description,
      isActive,
      priority,
      showInMarquee,
      startDate,
      endDate,
      linkUrl,
      linkText,
      couponCode,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      maxUses,
    } = body;
    
    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    // Validate and set fields
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Title cannot be empty' },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }
    
    if (titleEnglish !== undefined) {
      updateData.title_english = titleEnglish?.trim() || null;
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    
    if (isActive !== undefined) {
      updateData.is_active = Boolean(isActive);
    }
    
    if (priority !== undefined) {
      if (typeof priority !== 'number' || priority < 0) {
        return NextResponse.json(
          { success: false, error: 'Priority must be a non-negative number' },
          { status: 400 }
        );
      }
      updateData.priority = parseInt(priority.toString()) || 0;
    }
    
    if (showInMarquee !== undefined) {
      updateData.show_in_marquee = Boolean(showInMarquee);
    }
    
    if (startDate !== undefined) {
      if (startDate === null) {
        updateData.start_date = null;
      } else {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return NextResponse.json(
            { success: false, error: 'Invalid start date format' },
            { status: 400 }
          );
        }
        updateData.start_date = start.toISOString();
      }
    }
    
    if (endDate !== undefined) {
      if (endDate === null) {
        updateData.end_date = null;
      } else {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return NextResponse.json(
            { success: false, error: 'Invalid end date format' },
            { status: 400 }
          );
        }
        updateData.end_date = end.toISOString();
      }
    }
    
    // Validate date range if both dates are provided
    const finalStartDate = updateData.start_date !== undefined 
      ? (updateData.start_date ? new Date(updateData.start_date as string) : null)
      : (startDate ? new Date(startDate) : null);
    
    const finalEndDate = updateData.end_date !== undefined
      ? (updateData.end_date ? new Date(updateData.end_date as string) : null)
      : (endDate ? new Date(endDate) : null);
    
    if (finalStartDate && finalEndDate && finalStartDate >= finalEndDate) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }
    
    if (linkUrl !== undefined) {
      updateData.link_url = linkUrl?.trim() || null;
    }
    
    if (linkText !== undefined) {
      updateData.link_text = linkText?.trim() || null;
    }
    
    // Add coupon code
    if (couponCode !== undefined) {
      updateData.coupon_code = couponCode?.trim() ? couponCode.trim().toUpperCase() : null;
    }
    
    // Add discount fields
    if (discountType !== undefined) {
      updateData.discount_type = discountType || null;
      if (discountValue !== undefined) {
        updateData.discount_value = discountValue ? Number(discountValue) : null;
      } else {
        updateData.discount_value = null;
      }
    }
    
    if (minPurchaseAmount !== undefined) {
      updateData.min_purchase_amount = minPurchaseAmount ? Number(minPurchaseAmount) : null;
    }
    
    if (maxDiscountAmount !== undefined) {
      updateData.max_discount_amount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
    }
    
    if (maxUses !== undefined) {
      updateData.max_uses = maxUses ? parseInt(maxUses) : null;
    }
    
    // Get current promotion to check if is_active is being changed to true
    const { data: currentPromotion } = await supabase
      .from('promotions')
      .select('is_active, title, description, link_url, link_text')
      .eq('id', id)
      .single();
    
    const wasInactive = currentPromotion && !currentPromotion.is_active;
    const isBeingActivated = updateData.is_active === true && wasInactive;
    
    // Update promotion
    const { data: updatedPromotion, error } = await supabase
      .from('promotions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating promotion:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update promotion', details: error.message },
        { status: 500 }
      );
    }
    
    // Send notifications if promotion is being activated
    if (isBeingActivated && updatedPromotion) {
      try {
        // Get all users who have opted in for promotion notifications
        const { data: usersWithPrefs, error: usersError } = await supabase
          .from('user_notification_preferences')
          .select('user_id, promotions_news')
          .eq('promotions_news', true);
        
        // Get all active newsletter subscribers who want promotions
        const { data: newsletterSubscribers, error: newsletterError } = await supabase
          .from('newsletter_subscriptions')
          .select('email, user_id, preferences')
          .eq('is_active', true);

        if (!usersError && usersWithPrefs && usersWithPrefs.length > 0) {
          const promotionTitle = updatedPromotion.title || currentPromotion?.title || 'โปรโมชั่นใหม่';
          const promotionDescription = updatedPromotion.description || currentPromotion?.description || '';
          const promotionLink = updatedPromotion.link_url || currentPromotion?.link_url || '/';
          
          // Create in-app notifications in batch
          const notifications = usersWithPrefs.map((user) => ({
            user_id: user.user_id,
            type: 'promotion',
            title: '🎉 โปรโมชั่นใหม่!',
            message: promotionTitle,
            link_url: promotionLink,
            metadata: {
              promotion_id: updatedPromotion.id,
              title: promotionTitle,
              description: promotionDescription,
              link_url: promotionLink,
            },
          }));
          
          // Insert notifications (batch insert)
          await supabase
            .from('notifications')
            .insert(notifications);
          
          console.log(`Sent promotion notifications to ${usersWithPrefs.length} users`);
        }

        // Send promotional emails
        if (!newsletterError && newsletterSubscribers && newsletterSubscribers.length > 0) {
          const { addEmailToQueue } = await import('@/lib/email/queue');
          const { generatePromotionalEmailHtml } = await import('@/lib/email/templates');
          
          const promotionTitle = updatedPromotion.title || currentPromotion?.title || 'โปรโมชั่นใหม่';
          const promotionDescription = updatedPromotion.description || currentPromotion?.description || '';
          const promotionLink = updatedPromotion.link_url || currentPromotion?.link_url || '/';
          const promotionLinkText = updatedPromotion.link_text || currentPromotion?.link_text || 'ดูรายละเอียด';
          
          const promotionalEmails = newsletterSubscribers
            .filter(sub => {
              // Check newsletter preferences
              const prefs = sub.preferences as { promotions?: boolean };
              if (prefs && prefs.promotions === false) {
                return false;
              }
              // Check if user preferences allow promotional emails
              const userPref = usersWithPrefs?.find(u => u.user_id === sub.user_id);
              return !sub.user_id || userPref?.promotions_news !== false;
            })
            .map(sub => ({
              to: sub.email,
              subject: `🎉 ${promotionTitle} - โปรโมชั่นพิเศษจาก MUAYTHAI`,
              htmlContent: generatePromotionalEmailHtml({
                title: promotionTitle,
                description: promotionDescription,
                linkUrl: promotionLink,
                linkText: promotionLinkText,
              }),
              emailType: 'promotional' as const,
              priority: 'normal' as const,
              userId: sub.user_id || undefined,
              metadata: {
                promotion_id: updatedPromotion.id,
              },
            }));

          // Add emails to queue in batches
          const batchSize = 50;
          for (let i = 0; i < promotionalEmails.length; i += batchSize) {
            const batch = promotionalEmails.slice(i, i + batchSize);
            await Promise.all(batch.map(email => addEmailToQueue(email)));
          }
          
          console.log(`Queued promotional emails to ${promotionalEmails.length} subscribers`);
        }
      } catch (notificationError) {
        // Don't fail promotion update if notification fails
        console.warn('Failed to send promotion notifications:', notificationError);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: updatedPromotion,
      message: 'Promotion updated successfully',
    });
    
  } catch (error) {
    console.error('Update promotion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/promotions/[id]
 * ลบโปรโมชั่น (Admin only)
 */
const deletePromotionHandler = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  _user
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Check if promotion exists
    const { data: promotion, error: checkError } = await supabase
      .from('promotions')
      .select('id, title')
      .eq('id', id)
      .maybeSingle();
    
    if (checkError || !promotion) {
      return NextResponse.json(
        { success: false, error: 'Promotion not found' },
        { status: 404 }
      );
    }
    
    // Delete promotion
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting promotion:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete promotion', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Promotion deleted successfully',
    });
    
  } catch (error) {
    console.error('Delete promotion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export { updatePromotionHandler as PUT, deletePromotionHandler as DELETE };

