/**
 * Product Orders API Endpoint
 * 
 * GET /api/orders/products - Get all product orders (Admin can see all, Users see their own)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

async function checkIsAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data?.role === 'admin';
}

/**
 * GET /api/orders/products
 * Get product orders
 * Query params:
 * - status: filter by order status
 * - shipping_status: filter by shipping status
 * - user_id: filter by user (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isAdmin = await checkIsAdmin(supabase, user.id);
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const shippingStatusFilter = searchParams.get('shipping_status');
    const userIdFilter = searchParams.get('user_id');

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
      .order('created_at', { ascending: false });

    // If not admin, only show user's own orders
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    } else if (userIdFilter) {
      query = query.eq('user_id', userIdFilter);
    }

    // Apply status filter
    if (statusFilter) {
      query = query.eq('orders.status', statusFilter);
    }

    // Apply shipping status filter
    if (shippingStatusFilter) {
      query = query.eq('shipping_status', shippingStatusFilter);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Get product orders error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: orders?.map(order => ({
        id: order.id || "",
        orderId: order.order_id || "",
        userId: order.user_id || "",
        productId: order.product_id || "",
        productName: order.product_name || "",
        productNameEn: order.product_name_en || "",
        quantity: order.quantity ?? 0,
        unitPrice: order.unit_price ? parseFloat(order.unit_price) || 0 : 0,
        totalPrice: order.total_price ? parseFloat(order.total_price) || 0 : 0,
        shippingAddress: order.shipping_address || "",
        trackingNumber: order.tracking_number || "",
        shippingStatus: order.shipping_status || 'pending',
        shippingCost: order.shipping_cost ? parseFloat(order.shipping_cost) || 0 : 0,
        shippingMethodId: order.shipping_method_id || null,
        shippingMethod: order.shipping_methods ? {
          id: order.shipping_methods.id || "",
          nameThai: order.shipping_methods.name_thai || "",
          nameEnglish: order.shipping_methods.name_english || "",
          basePrice: order.shipping_methods.base_price ? parseFloat(order.shipping_methods.base_price) || 0 : 0,
          pricePerKg: order.shipping_methods.price_per_kg ? parseFloat(order.shipping_methods.price_per_kg) || 0 : 0,
        } : null,
        shippedAt: order.shipped_at || null,
        deliveredAt: order.delivered_at || null,
        carrierName: order.carrier_name || "",
        carrierPhone: order.carrier_phone || "",
        carrierWebsite: order.carrier_website || "",
        order: order.orders ? {
          id: order.orders.id || "",
          orderNumber: order.orders.order_number || "",
          status: order.orders.status || "",
          totalAmount: order.orders.total_amount ? parseFloat(order.orders.total_amount) || 0 : 0,
          createdAt: order.orders.created_at || "",
          customerName: order.orders.customer_name || "",
          customerEmail: order.orders.customer_email || "",
          customerPhone: order.orders.customer_phone || "",
        } : null,
        createdAt: order.created_at || "",
        updatedAt: order.updated_at || "",
      })) || [],
    });

  } catch (error) {
    console.error('Get product orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

