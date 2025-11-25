/**
 * Product Order Tracking API Endpoint
 * 
 * GET /api/orders/products/[id]/tracking - Get shipping history for an order
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

async function checkIsAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data?.role === 'admin';
}

/**
 * GET /api/orders/products/[id]/tracking
 * Get shipping history for a product order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isAdmin = await checkIsAdmin(supabase, user.id);

    // Check if order exists and user has access
    const { data: order, error: orderError } = await supabase
      .from('product_orders')
      .select('id, order_id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // If not admin, only allow access to own orders
    if (!isAdmin && order.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get shipping history
    const { data: history, error } = await supabase
      .from('shipping_history')
      .select(`
        *,
        user_profiles:updated_by (
          display_name,
          full_name
        )
      `)
      .eq('product_order_id', order.order_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Get tracking history error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tracking history' },
        { status: 500 }
      );
    }

    // Get current order details
    const { data: orderDetails } = await supabase
      .from('product_orders')
      .select(`
        shipping_status,
        tracking_number,
        shipped_at,
        delivered_at,
        carrier_name,
        carrier_phone,
        carrier_website
      `)
      .eq('id', id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        currentStatus: orderDetails?.shipping_status || 'pending',
        trackingNumber: orderDetails?.tracking_number,
        shippedAt: orderDetails?.shipped_at,
        deliveredAt: orderDetails?.delivered_at,
        carrier: orderDetails?.carrier_name ? {
          name: orderDetails.carrier_name,
          phone: orderDetails.carrier_phone,
          website: orderDetails.carrier_website,
        } : null,
        history: history?.map(h => ({
          id: h.id,
          status: h.status,
          location: h.location,
          description: h.description,
          updatedBy: h.user_profiles ? {
            displayName: h.user_profiles.display_name,
            fullName: h.user_profiles.full_name,
          } : null,
          createdAt: h.created_at,
        })) || [],
      },
    });

  } catch (error) {
    console.error('Get tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

