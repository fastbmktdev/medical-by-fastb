import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referralCode = searchParams.get('code');

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Validate referral code format (MT + 8 characters)
    if (!referralCode.match(/^MT[A-Z0-9]{8}$/)) {
      return NextResponse.json(
        { error: 'Invalid referral code format' },
        { status: 400 }
      );
    }

    // Extract user ID from referral code
    const userIdSuffix = referralCode.slice(2); // Remove 'MT' prefix
    
    // Find user by ID suffix
    const supabase = await createServerClient();
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .like('id', `%${userIdSuffix}`)
      .limit(1);

    if (error || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'Referral code not found' },
        { status: 404 }
      );
    }

    const referrer = users[0];

    return NextResponse.json({
      valid: true,
      referrer: {
        id: referrer.id,
        name: referrer.full_name,
        email: referrer.email
      },
      message: `คุณถูกแนะนำโดย ${referrer.full_name || referrer.email}`
    });

  } catch (error) {
    console.error('Error validating referral code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      code?: string;
    };
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Validate referral code format (MT + 8 characters)
    if (!code.match(/^MT[A-Z0-9]{8}$/)) {
      return NextResponse.json(
        { error: 'Invalid referral code format' },
        { status: 400 }
      );
    }

    // Extract user ID from referral code
    const userIdSuffix = code.slice(2); // Remove 'MT' prefix
    
    // Find user by ID suffix
    const supabase = await createServerClient();
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .like('id', `%${userIdSuffix}`)
      .limit(1);

    if (error || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'Referral code not found' },
        { status: 404 }
      );
    }

    const referrer = users[0];

    return NextResponse.json({
      valid: true,
      referrer: {
        id: referrer.id,
        name: referrer.full_name,
        email: referrer.email
      },
      message: `คุณถูกแนะนำโดย ${referrer.full_name || referrer.email}`
    });

  } catch (error) {
    console.error('Error validating referral code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
