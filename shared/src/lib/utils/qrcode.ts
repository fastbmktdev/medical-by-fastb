export async function generateQRCodeDataURL(
  ticketId: string,
  bookingReference: string
): Promise<string> {
  console.error('QR Code generation is not available because qrcode is not installed.');
  return Promise.resolve('');
}

export async function generateQRCodeBuffer(
  ticketId: string,
  bookingReference: string
): Promise<Buffer> {
  console.error('QR Code generation is not available because qrcode is not installed.');
  return Promise.resolve(Buffer.from(''));
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

