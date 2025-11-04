/**
 * Product Order API Endpoint
 * 
 * GET, PUT /api/orders/products/[id] - Get and update product order (Admin only for PUT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

async function checkIsAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data?.role === 'admin';
}

/**
 * GET /api/orders/products/[id]
 * Get single product order
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

    let query = supabase
      .from('product_orders')
      .select(`
        *,
        orders (
          id,
          order_number,
          status,
          total_amount,
          created_at,
          customer_name,
          customer_email,
          customer_phone
        ),
        shipping_methods (
          id,
          name_thai,
          name_english,
          base_price,
          price_per_kg
        )
      `)
      .eq('id', id);

    // If not admin, only show user's own order
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data: order, error } = await query.maybeSingle();

    if (error) {
      console.error('Get product order error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch order' },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        orderId: order.order_id,
        userId: order.user_id,
        productId: order.product_id,
        productName: order.product_name,
        productNameEn: order.product_name_en,
        quantity: order.quantity,
        unitPrice: parseFloat(order.unit_price),
        totalPrice: parseFloat(order.total_price),
        shippingAddress: order.shipping_address,
        trackingNumber: order.tracking_number,
        shippingStatus: order.shipping_status || 'pending',
        shippingCost: order.shipping_cost ? parseFloat(order.shipping_cost) : 0,
        shippingMethodId: order.shipping_method_id,
        shippingMethod: order.shipping_methods ? {
          id: order.shipping_methods.id,
          nameThai: order.shipping_methods.name_thai,
          nameEnglish: order.shipping_methods.name_english,
          basePrice: parseFloat(order.shipping_methods.base_price),
          pricePerKg: parseFloat(order.shipping_methods.price_per_kg || 0),
        } : null,
        shippedAt: order.shipped_at,
        deliveredAt: order.delivered_at,
        carrierName: order.carrier_name,
        carrierPhone: order.carrier_phone,
        carrierWebsite: order.carrier_website,
        order: order.orders ? {
          id: order.orders.id,
          orderNumber: order.orders.order_number,
          status: order.orders.status,
          totalAmount: parseFloat(order.orders.total_amount),
          createdAt: order.orders.created_at,
          customerName: order.orders.customer_name,
          customerEmail: order.orders.customer_email,
          customerPhone: order.orders.customer_phone,
        } : null,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
    });

  } catch (error) {
    console.error('Get product order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/orders/products/[id]
 * Update product order shipping information (Admin only)
 */
export const PUT = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // Check if order exists
    const { data: existingOrder, error: checkError } = await supabase
      .from('product_orders')
      .select('id, shipping_status, shipped_at, delivered_at')
      .eq('id', id)
      .maybeSingle();

    if (checkError || !existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.shippingStatus !== undefined) {
      updateData.shipping_status = body.shippingStatus;
      
      // Update timestamps based on status
      if (body.shippingStatus === 'shipped' && !existingOrder.shipped_at) {
        updateData.shipped_at = new Date().toISOString();
      }
      if (body.shippingStatus === 'delivered' && !existingOrder.delivered_at) {
        updateData.delivered_at = new Date().toISOString();
      }
    }
    if (body.trackingNumber !== undefined) updateData.tracking_number = body.trackingNumber || null;
    if (body.shippingMethodId !== undefined) updateData.shipping_method_id = body.shippingMethodId || null;
    if (body.shippingCost !== undefined) updateData.shipping_cost = parseFloat(body.shippingCost);
    if (body.carrierName !== undefined) updateData.carrier_name = body.carrierName || null;
    if (body.carrierPhone !== undefined) updateData.carrier_phone = body.carrierPhone || null;
    if (body.carrierWebsite !== undefined) updateData.carrier_website = body.carrierWebsite || null;
    if (body.shippingAddress !== undefined) updateData.shipping_address = body.shippingAddress || null;

    // Update order
    const { data: order, error } = await supabase
      .from('product_orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        orders (
          id,
          order_number,
          status,
          total_amount
        ),
        shipping_methods (
          id,
          name_thai,
          name_english
        )
      `)
      .single();

    if (error) {
      console.error('Update product order error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update order' },
        { status: 500 }
      );
    }

    // Log shipping history if status changed
    if (body.shippingStatus && body.shippingStatus !== existingOrder.shipping_status) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('shipping_history')
        .insert({
          product_order_id: order.order_id,
          status: body.shippingStatus,
          location: body.location || null,
          description: body.description || `Status changed to ${body.shippingStatus}`,
          updated_by: user?.id || null,
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        orderId: order.order_id,
        trackingNumber: order.tracking_number,
        shippingStatus: order.shipping_status,
        shippingCost: order.shipping_cost ? parseFloat(order.shipping_cost) : 0,
        shippingMethodId: order.shipping_method_id,
        shippedAt: order.shipped_at,
        deliveredAt: order.delivered_at,
        carrierName: order.carrier_name,
        carrierPhone: order.carrier_phone,
        carrierWebsite: order.carrier_website,
      },
    });

  } catch (error) {
    console.error('Update product order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

