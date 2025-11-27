import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { generateReceiptPDF, type ReceiptData } from '@shared/lib/utils/pdf-generator';
import { getPaymentById } from '@shared/services/payment.service';

/**
 * Helper function to check if user is admin
 */
async function checkIsAdmin(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
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
 * GET /api/payments/[id]/receipt
 * Generate and download receipt PDF for a payment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
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

    // Only generate receipt for succeeded payments
    if (payment.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Receipt can only be generated for successful payments' },
        { status: 400 }
      );
    }

    // Get order data if available
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
    customerEmail = order?.customer_email || (payment.metadata as Record<string, unknown>)?.userEmail as string || '';

    // Get appointment information if this is a hospital appointment
    let bookingNumber: string | undefined;
    let bookingDescription = '';

    if (payment.payment_type === 'hospital_booking') {
      const bookingId = (payment.metadata as Record<string, unknown>)?.bookingId as string;
      if (bookingId) {
        const { data: appointment } = await supabase
          .from('appointments')
          .select('booking_number, package_name, price_paid, customer_name, customer_email, customer_phone')
          .eq('id', bookingId)
          .maybeSingle();

        if (appointment) {
          bookingNumber = appointment.booking_number;
          customerName = appointment.customer_name || customerName;
          customerEmail = appointment.customer_email || customerEmail;
          customerPhone = appointment.customer_phone || '';
          bookingDescription = `hospital appointment - ${appointment.package_name}`;
        }
      }
    }

    // Get ticket information if this is a ticket purchase
    if (payment.payment_type === 'ticket' && order) {
      const { data: ticketBooking } = await supabase
        .from('ticket_bookings')
        .select('event_name, ticket_count, booking_reference')
        .eq('order_id', order.id)
        .maybeSingle();

      if (ticketBooking) {
        bookingDescription = `Event Ticket - ${ticketBooking.event_name} (${ticketBooking.ticket_count} tickets)`;
      }
    }

    // Get product information if this is a product purchase
    if (payment.payment_type === 'product' && order) {
      const { data: productOrders } = await supabase
        .from('product_orders')
        .select('product_name, quantity')
        .eq('order_id', order.id);

      if (productOrders && productOrders.length > 0) {
        bookingDescription = `Product Purchase - ${productOrders.map(p => p.product_name).join(', ')}`;
      }
    }

    // Prepare receipt data
    const receiptData: ReceiptData = {
      receiptNumber: `REC-${payment.id.slice(0, 8).toUpperCase()}`,
      paymentId: payment.id,
      paymentDate: payment.updated_at || payment.created_at,
      amount: Number(payment.amount),
      currency: payment.currency || 'thb',
      paymentMethod: 'Credit Card / Stripe',
      transactionId: payment.stripe_payment_intent_id,
      customerName,
      customerEmail,
      customerPhone: customerPhone || undefined,
      paymentType: payment.payment_type,
      description: bookingDescription || order?.items?.[0]?.name || 'Payment',
      bookingNumber,
      orderNumber: order?.order_number,
      items: order?.items
        ? (order.items as Array<{ name: string; quantity?: number; price: number }>).map((item) => ({
            name: item.name,
            quantity: item.quantity || 1,
            price: item.price,
          }))
        : [
            {
              name: bookingDescription || 'Payment',
              quantity: 1,
              price: Number(payment.amount),
            },
          ],
    };

    // Generate PDF
    const pdf = generateReceiptPDF(receiptData);
    const pdfBlob = pdf.output('blob');

    // Return PDF as response
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${receiptData.receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

