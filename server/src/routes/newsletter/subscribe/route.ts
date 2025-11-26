import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { addEmailToQueue } from '@shared/lib/email/queue';
import { generateUnsubscribeToken } from '@shared/lib/utils/crypto';

/**
 * POST /api/newsletter/subscribe
 * Subscribe to newsletter
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await request.json() as {
      email?: string;
      preferences?: Record<string, unknown>;
      source?: string;
    };
    const { email, preferences, source = 'manual' } = body;

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Generate unsubscribe token
    const unsubscribeToken = await generateUnsubscribeToken();

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('newsletter_subscriptions')
      .select('id, is_active, user_id, preferences')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      // Reactivate if unsubscribed
      if (!existing.is_active) {
        const { data: updated, error: updateError } = await supabase
          .from('newsletter_subscriptions')
          .update({
            is_active: true,
            unsubscribed_at: null,
            unsubscribe_token: unsubscribeToken,
            user_id: user?.id || existing.user_id,
            preferences: preferences || existing.preferences,
            source: source,
            ip_address: ipAddress,
            user_agent: userAgent,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        // Send welcome back email
        await addEmailToQueue({
          to: email,
          subject: 'ยินดีต้อนรับกลับสู่จดหมายข่าว medical! 🥊',
          htmlContent: generateWelcomeBackEmailHtml(email),
          emailType: 'newsletter',
          priority: 'normal',
          userId: user?.id,
        });

        return NextResponse.json({
          success: true,
          message: 'Subscribed successfully',
          data: updated,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Already subscribed',
        data: existing,
      });
    }

    // Create new subscription
    const { data: subscription, error } = await supabase
      .from('newsletter_subscriptions')
      .insert({
        email: email.toLowerCase(),
        user_id: user?.id || null,
        is_active: true,
        unsubscribe_token: unsubscribeToken,
        preferences: preferences || {
          weekly_digest: true,
          promotions: true,
          events: true,
          articles: true,
          tips: true,
        },
        source: source,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (error) {
      console.error('Subscribe error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to subscribe' },
        { status: 500 }
      );
    }

    // Send welcome email
    await addEmailToQueue({
      to: email,
      subject: 'ยินดีต้อนรับสู่จดหมายข่าว medical! 🥊',
      htmlContent: generateWelcomeNewsletterEmailHtml(email, unsubscribeToken),
      emailType: 'newsletter',
      priority: 'normal',
      userId: user?.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscribed successfully',
      data: subscription,
    });

  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateWelcomeNewsletterEmailHtml(email: string, token: string): string {
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/newsletter/unsubscribe?token=${token}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        a { color: #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🥊 ยินดีต้อนรับสู่ medical Platform!</h1>
        </div>
        <div class="content">
          <p>สวัสดี!</p>
          <p>ขอบคุณที่สมัครรับจดหมายข่าวจากเรา คุณจะได้รับ:</p>
          <ul>
            <li>📰 ข่าวสารและอัปเดตล่าสุด</li>
            <li>🎯 โปรโมชั่นพิเศษ</li>
            <li>🥊 อีเว้นท์และการแข่งขัน</li>
            <li>💡 เทคนิคและเคล็ดลับ</li>
          </ul>
          <p>เราจะส่งข่าวสารที่มีประโยชน์ให้คุณอย่างสม่ำเสมอ</p>
        </div>
        <div class="footer">
          <p><a href="${unsubscribeUrl}">ยกเลิกการสมัครสมาชิก</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateWelcomeBackEmailHtml(_email: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🥊 ยินดีต้อนรับกลับ!</h1>
        </div>
        <div class="content">
          <p>ยินดีต้อนรับกลับสู่จดหมายข่าว medical!</p>
          <p>เราดีใจที่คุณกลับมาสมัครรับจดหมายข่าวอีกครั้ง เราจะส่งข่าวสารที่มีประโยชน์ให้คุณอย่างสม่ำเสมอ</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
