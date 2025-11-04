import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

/**
 * POST /api/tickets/[id]/check-in
 * Check-in ticket (Admin only)
 * Body: {
 *   qr_code?: string (optional - for QR code verification)
 * }
 */
const checkInHandler = withAdminAuth<{ id: string }>(async (
  request,
  context,
  user
) => {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    // Get ticket booking
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket_bookings')
      .select(`
        *,
        orders (
          id,
          status
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if ticket is already checked in
    if (ticket.is_checked_in) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ticket already checked in',
          data: {
            ticket_id: ticket.id,
            booking_reference: ticket.booking_reference,
            checked_in_at: ticket.checked_in_at,
          }
        },
        { status: 400 }
      );
    }

    // Verify order is paid/confirmed
    const order = ticket.orders as any;
    if (!order || (order.status !== 'confirmed' && order.status !== 'completed')) {
      return NextResponse.json(
        { success: false, error: 'Ticket order is not confirmed or paid' },
        { status: 400 }
      );
    }

    // Optional: Verify QR code if provided
    const body = await request.json().catch(() => ({}));
    if (body.qr_code && ticket.qr_code && body.qr_code !== ticket.qr_code) {
      return NextResponse.json(
        { success: false, error: 'Invalid QR code' },
        { status: 400 }
      );
    }

    // Update ticket to checked in
    const { data: updatedTicket, error: updateError } = await supabase
      .from('ticket_bookings')
      .update({
        is_checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Check-in ticket error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to check in ticket', details: updateError.message },
        { status: 500 }
      );
    }

    // Get event details for response
    const { data: event } = await supabase
      .from('events')
      .select('id, name, name_english, event_date, location')
      .eq('id', ticket.event_id)
      .maybeSingle();

    // Log audit event (if audit_logs table exists)
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          user_email: user.email || null,
          action_type: 'check_in',
          resource_type: 'ticket',
          resource_id: ticket.id,
          resource_name: ticket.booking_reference || `Ticket ${ticket.id}`,
          description: `Ticket checked in: ${ticket.booking_reference}`,
          metadata: {
            event_id: ticket.event_id,
            event_name: ticket.event_name,
            ticket_count: ticket.ticket_count,
          },
          severity: 'medium',
          success: true,
        });
    } catch (auditError) {
      // Don't fail if audit logging fails
      console.warn('Audit log error (check-in still successful):', auditError);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedTicket,
        event: event || null,
      },
      message: 'Ticket checked in successfully',
    });

  } catch (error) {
    console.error('Check-in ticket error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export { checkInHandler as POST };

