import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { createSetupIntent } from '@shared/services';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    const result = await createSetupIntent(user.id, user.email);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating setup intent:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

