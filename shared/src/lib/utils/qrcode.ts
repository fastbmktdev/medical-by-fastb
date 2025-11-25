/**
 * QR Code Utilities
 * Functions for generating QR codes for tickets
 */

// @ts-ignore - qrcode module types are declared in qrcode.d.ts
import QRCode from 'qrcode';

/**
 * Generate QR code data URL from ticket information
 * @param ticketId - Ticket appointment ID
 * @param bookingReference - appointment reference number
 * @returns Base64 data URL of QR code image
 */
export async function generateQRCodeDataURL(
  ticketId: string,
  bookingReference: string
): Promise<string> {
  // Create QR code content with ticket info
  const qrContent = JSON.stringify({
    ticket_id: ticketId,
    booking_reference: bookingReference,
    timestamp: new Date().toISOString(),
  });

  try {
    // Generate QR code as data URL
    const dataURL = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return dataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code buffer (for server-side use)
 * @param ticketId - Ticket appointment ID
 * @param bookingReference - appointment reference number
 * @returns Buffer containing QR code image
 */
export async function generateQRCodeBuffer(
  ticketId: string,
  bookingReference: string
): Promise<Buffer> {
  const qrContent = JSON.stringify({
    ticket_id: ticketId,
    booking_reference: bookingReference,
    timestamp: new Date().toISOString(),
  });

  try {
    const buffer = await QRCode.toBuffer(qrContent, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return buffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code string (simple text format for storing in database)
 * @param ticketId - Ticket appointment ID
 * @param bookingReference - appointment reference number
 * @returns QR code string identifier
 */
export function generateQRCodeString(
  ticketId: string,
  bookingReference: string
): string {
  // Create a unique QR code string based on ticket ID and appointment reference
  // This can be used for verification
  return `${ticketId}:${bookingReference}:${Date.now()}`;
}

