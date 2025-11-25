import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { generateInvoicePDF, type InvoiceData } from '@shared/lib/utils/pdf-generator';
import { getPaymentById } from '@shared/services/payment.service';

/**
 * Helper function to check if user is admin
 */
async function checkIsAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  return data?.role === 'admin';
}

/**
 * GET /api/payments/[id]/invoice
 * Generate and download invoice PDF for a payment/order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get payment data
    const payment = await getPaymentById(id);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if user owns the payment or is admin
    const isAdmin = await checkIsAdmin(supabase, user.id);
    if (payment.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get order data
    let order = null;
    if (payment.id) {
      try {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('payment_id', payment.id)
          .maybeSingle();
        order = orderData;
      } catch (error) {
        console.error('Error fetching order:', error);
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get user profile for customer information
    let customerName = 'Customer';
    let customerEmail = '';
    let customerPhone = '';

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('user_id', payment.user_id)
      .maybeSingle();

    if (profile) {
      customerName = profile.full_name || profile.username || 'Customer';
    }

    // Try to get email from order or payment metadata
    customerEmail = order.customer_email || (payment.metadata as Record<string, unknown>)?.userEmail as string || '';
    customerPhone = order.customer_phone || '';

    // Get items for invoice
    let items: Array<{
      name: string;
      description?: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }> = [];

    // Get appointment information if this is a hospital appointment
    let relatedEntity:
      | { name: string; address?: string; contact?: string }
      | undefined;

    if (payment.payment_type === 'hospital_booking') {
      const bookingId = (payment.metadata as Record<string, unknown>)?.bookingId as string;
      if (bookingId) {
        const { data: appointment } = await supabase
          .from('appointments')
          .select(
            'booking_number, package_name, price_paid, customer_name, customer_email, customer_phone, hospital_id'
          )
          .eq('id', bookingId)
          .maybeSingle();

        if (appointment) {
          // Get hospital information
          const { data: hospital } = await supabase
            .from('hospitals')
            .select('hospital_name, address, phone, email')
            .eq('id', appointment.hospital_id)
            .maybeSingle();

          if (hospital) {
            relatedEntity = {
              name: hospital.hospital_name,
              address: hospital.address || '',
              contact: hospital.phone || hospital.email || '',
            };
          }

          items = [
            {
              name: appointment.package_name,
              description: `appointment Number: ${appointment.booking_number}`,
              quantity: 1,
              unitPrice: Number(appointment.price_paid),
              total: Number(appointment.price_paid),
            },
          ];
        }
      }
    }

    // Get ticket information if this is a ticket purchase
    if (payment.payment_type === 'ticket' && order) {
      const { data: ticketBooking } = await supabase
        .from('ticket_bookings')
        .select('event_name, event_name_en, ticket_count, unit_price, total_price, booking_reference, event_id')
        .eq('order_id', order.id)
        .maybeSingle();

      if (ticketBooking) {
        relatedEntity = {
          name: 'Ticket Organizer',
          address: '',
          contact: '',
        };

        items = [
          {
            name: ticketBooking.event_name || ticketBooking.event_name_en || 'Ticket',
            description: `appointment Reference: ${ticketBooking.booking_reference || 'N/A'}`,
            quantity: ticketBooking.ticket_count || 1,
            unitPrice: Number(ticketBooking.unit_price),
            total: Number(ticketBooking.total_price),
          },
        ];
      }
    }

    // Get product information if this is a product purchase
    if (payment.payment_type === 'product' && order) {
      const { data: productOrders } = await supabase
        .from('product_orders')
        .select('product_name, product_name_en, quantity, unit_price, total_price')
        .eq('order_id', order.id);

      if (productOrders && productOrders.length > 0) {
        items = productOrders.map((po) => ({
          name: po.product_name_en || po.product_name,
          quantity: po.quantity,
          unitPrice: Number(po.unit_price),
          total: Number(po.total_price),
        }));
      }
    }

    // Fallback to order items if no specific items found
    if (items.length === 0 && order.items && Array.isArray(order.items)) {
      items = (order.items as Array<{ name: string; quantity?: number; price: number }>).map(
        (item) => ({
          name: item.name,
          quantity: item.quantity || 1,
          unitPrice: item.price,
          total: item.price * (item.quantity || 1),
        })
      );
    }

    // If still no items, create a default item
    if (items.length === 0) {
      items = [
        {
          name: 'Payment',
          quantity: 1,
          unitPrice: Number(payment.amount),
          total: Number(payment.amount),
        },
      ];
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = Number(payment.amount);
    const discount = subtotal > total ? subtotal - total : 0;

    // Determine invoice status
    let invoiceStatus: 'pending' | 'paid' | 'overdue' | 'cancelled' = 'pending';
    if (payment.status === 'succeeded') {
      invoiceStatus = 'paid';
    } else if (payment.status === 'failed' || payment.status === 'canceled') {
      invoiceStatus = 'cancelled';
    } else if (payment.status === 'pending') {
      // Check if due date has passed (if we had due dates)
      invoiceStatus = 'pending';
    }

    // Prepare invoice data
    const invoiceData: InvoiceData = {
      invoiceNumber: `INV-${order.order_number}`,
      invoiceDate: order.created_at,
      dueDate: payment.status === 'succeeded' ? payment.updated_at : undefined,
      orderNumber: order.order_number,
      paymentId: payment.status === 'succeeded' ? payment.id : undefined,
      paymentDate: payment.status === 'succeeded' ? payment.updated_at : undefined,
      amount: Number(payment.amount),
      currency: payment.currency || 'thb',
      status: invoiceStatus,
      customerName,
      customerEmail,
      customerPhone: customerPhone || undefined,
      items,
      subtotal,
      discount: discount > 0 ? discount : undefined,
      total,
      notes: order.notes || undefined,
      terms: 'Payment due within 30 days of invoice date.',
      relatedEntity,
    };

    // Generate PDF
    const pdf = generateInvoicePDF(invoiceData);
    const pdfBlob = pdf.output('blob');

    // Return PDF as response
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

