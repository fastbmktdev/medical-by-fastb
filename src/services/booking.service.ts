/**
 * Booking Service
 * Business logic for booking operations
 */

import { createClient } from '@/lib/database/supabase/server';

export interface CreateBookingInput {
  user_id: string;
  gym_id: string;
  package_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string;
  special_requests?: string;
  payment_method?: string;
}

export interface BookingFilters {
  user_id?: string;
  gym_id?: string;
  status?: string;
}

/**
 * Validate booking data
 */
export function validateBookingData(data: CreateBookingInput): string[] {
  const errors: string[] = [];

  if (!data.gym_id) errors.push('กรุณาเลือกค่ายมวย');
  if (!data.package_id) errors.push('กรุณาเลือกแพ็คเกจ');
  if (!data.customer_name) errors.push('กรุณากรอกชื่อผู้จอง');
  if (!data.customer_email) errors.push('กรุณากรอกอีเมล');
  if (!data.customer_phone) errors.push('กรุณากรอกเบอร์โทรศัพท์');
  if (!data.start_date) errors.push('กรุณาเลือกวันที่เริ่มต้น');

  // Validate email format
  if (data.customer_email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.customer_email)) {
      errors.push('รูปแบบอีเมลไม่ถูกต้อง');
    }
  }

  return errors;
}

/**
 * Generate booking number
 */
export function generateBookingNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `BK${year}${month}${random}`;
}

/**
 * Calculate end date based on package duration
 */
export function calculateEndDate(startDate: string, durationMonths: number | null): string | null {
  if (!durationMonths) return null;

  const startDateObj = new Date(startDate);
  const endDateObj = new Date(startDateObj);
  endDateObj.setMonth(endDateObj.getMonth() + durationMonths);
  return endDateObj.toISOString().split('T')[0];
}

/**
 * Get bookings with optional filters
 */
export async function getBookings(filters?: BookingFilters) {
  const supabase = await createClient();

  let query = supabase
    .from('bookings')
    .select(`
      *,
      gyms:gym_id (
        id,
        gym_name,
        gym_name_english,
        slug
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters?.gym_id) {
    query = query.eq('gym_id', filters.gym_id);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data: bookings, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch bookings: ${error.message}`);
  }

  return bookings || [];
}

/**
 * Get booking by ID
 */
export async function getBookingById(id: string) {
  const supabase = await createClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      gyms:gym_id (
        id,
        gym_name,
        gym_name_english,
        slug
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch booking: ${error.message}`);
  }

  return booking;
}

/**
 * Create new booking
 */
export async function createBooking(data: CreateBookingInput) {
  // Validate data
  const validationErrors = validateBookingData(data);
  if (validationErrors.length > 0) {
    const error = new Error('ข้อมูลไม่ครบถ้วน') as Error & { errors: string[] };
    error.errors = validationErrors;
    throw error;
  }

  const supabase = await createClient();

  // Verify gym exists and is approved
  const { data: gym, error: gymError } = await supabase
    .from('gyms')
    .select('id, gym_name, status')
    .eq('id', data.gym_id)
    .eq('status', 'approved')
    .maybeSingle();

  if (gymError || !gym) {
    throw new Error('ไม่พบค่ายมวยที่ต้องการ');
  }

  // Verify package exists and is active
  const { data: gymPackage, error: packageError } = await supabase
    .from('gym_packages')
    .select('*')
    .eq('id', data.package_id)
    .eq('gym_id', data.gym_id)
    .eq('is_active', true)
    .maybeSingle();

  if (packageError || !gymPackage) {
    throw new Error('ไม่พบแพ็คเกจที่ต้องการ');
  }

  // Calculate end date
  const end_date = calculateEndDate(data.start_date, gymPackage.duration_months);

  // Generate booking number
  const bookingNumber = generateBookingNumber();

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: data.user_id,
      gym_id: data.gym_id,
      package_id: data.package_id,
      booking_number: bookingNumber,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      start_date: data.start_date,
      end_date,
      price_paid: gymPackage.price,
      package_name: gymPackage.name,
      package_type: gymPackage.package_type,
      duration_months: gymPackage.duration_months,
      special_requests: data.special_requests || null,
      payment_method: data.payment_method || null,
      payment_status: 'pending',
      status: 'pending',
    })
    .select()
    .single();

  if (bookingError) {
    throw new Error(`Failed to create booking: ${bookingError.message}`);
  }

  return booking;
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
) {
  const supabase = await createClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update booking status: ${error.message}`);
  }

  return booking;
}

/**
 * Update booking payment status
 */
export async function updateBookingPaymentStatus(
  id: string,
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
) {
  const supabase = await createClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update booking payment status: ${error.message}`);
  }

  return booking;
}

/**
 * Cancel booking
 */
export async function cancelBooking(id: string) {
  return updateBookingStatus(id, 'cancelled');
}
