import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { getSavedPaymentMethods, savePaymentMethod, deleteSavedPaymentMethod, setDefaultPaymentMethod } from '@shared/services';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const methods = await getSavedPaymentMethods(user.id);

    return NextResponse.json({ methods });
  } catch (error) {
    console.error('Error fetching saved payment methods:', error);

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      setup_intent_id?: string;
    };
    const { setup_intent_id } = body;

    if (!setup_intent_id) {
      return NextResponse.json(
        { error: 'Missing required field: setup_intent_id' },
        { status: 400 }
      );
    }

    const savedMethod = await savePaymentMethod(user.id, setup_intent_id);

    return NextResponse.json({ method: savedMethod });
  } catch (error) {
    console.error('Error saving payment method:', error);

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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const methodId = searchParams.get('method_id');

    if (!methodId) {
      return NextResponse.json(
        { error: 'Missing required parameter: method_id' },
        { status: 400 }
      );
    }

    await deleteSavedPaymentMethod(user.id, methodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);

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

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      method_id?: string;
      is_default?: boolean;
    };
    const { method_id, is_default } = body;

    if (!method_id) {
      return NextResponse.json(
        { error: 'Missing required field: method_id' },
        { status: 400 }
      );
    }

    if (is_default) {
      await setDefaultPaymentMethod(user.id, method_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating payment method:', error);

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

