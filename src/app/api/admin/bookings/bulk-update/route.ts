import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

type BulkBookingAction = 'confirm' | 'complete' | 'cancel';

interface BulkBookingRequestBody {
  action: BulkBookingAction;
  bookingIds: string[];
}

const ACTION_UPDATE_MAP: Record<BulkBookingAction, { status: string; payment_status?: string | null }> =
  {
    confirm: { status: 'confirmed' },
    complete: { status: 'completed' },
    cancel: { status: 'cancelled', payment_status: 'refunded' },
  };

export const POST = withAdminAuth<Record<string, never>>(async (
  request: NextRequest,
  _context: { params: Promise<Record<string, never>> },
) => {
  try {
    const supabase = await createClient();
    const body = (await request.json()) as BulkBookingRequestBody;

    const { action, bookingIds } = body;

    if (!action || !bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: action, bookingIds',
        },
        { status: 400 },
      );
    }

    if (!(action in ACTION_UPDATE_MAP)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Supported actions: confirm, complete, cancel',
        },
        { status: 400 },
      );
    }

    const updatePayload = {
      ...ACTION_UPDATE_MAP[action],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .in('id', bookingIds)
      .select('id');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        action,
        affectedCount: data?.length ?? 0,
        bookingIds,
      },
    });
  } catch (error) {
    console.error('Bulk update bookings error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
});


