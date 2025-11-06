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
  promotion_id?: string | null;
  discount_amount?: number | null;
  price_paid?: number; // If provided, use this instead of calculating from package price
}

export interface BookingFilters {
  user_id?: string;
  gym_id?: string;
  status?: string;
}

// Validation constants
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

/**
 * Validate booking data with enhanced validation
 */
export function validateBookingData(data: CreateBookingInput): string[] {
  const errors: string[] = [];

  // Required field validation
  if (!data.gym_id) errors.push('กรุณาเลือกค่ายมวย');
  if (!data.package_id) errors.push('กรุณาเลือกแพ็คเกจ');
  if (!data.customer_name?.trim()) errors.push('กรุณากรอกชื่อผู้จอง');
  if (!data.customer_email?.trim()) errors.push('กรุณากรอกอีเมล');
  if (!data.customer_phone?.trim()) errors.push('กรุณากรอกเบอร์โทรศัพท์');
  if (!data.start_date) errors.push('กรุณาเลือกวันที่เริ่มต้น');

  // Format validation
  if (data.customer_email && !EMAIL_REGEX.test(data.customer_email.trim())) {
    errors.push('รูปแบบอีเมลไม่ถูกต้อง');
  }

  if (data.customer_phone && !PHONE_REGEX.test(data.customer_phone.replace(/\s/g, ''))) {
    errors.push('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
  }

  // Date validation
  if (data.start_date) {
    const startDate = new Date(data.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      errors.push('วันที่เริ่มต้นต้องไม่เป็นวันที่ผ่านมาแล้ว');
    }
  }

  return errors;
}

/**
 * Generate booking number with better uniqueness
 */
export function generateBookingNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-4);
  return `BK${year}${month}${day}${timestamp}`;
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
 * Create new booking with optimized validation
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

  // Verify gym and package in a single optimized query
  const { data: gymWithPackage, error: verificationError } = await supabase
    .from('gyms')
    .select(`
      id,
      gym_name,
      status,
      gym_packages!inner(
        id,
        name,
        price,
        package_type,
        duration_months,
        is_active
      )
    `)
    .eq('id', data.gym_id)
    .eq('status', 'approved')
    .eq('gym_packages.id', data.package_id)
    .eq('gym_packages.is_active', true)
    .maybeSingle();

  if (verificationError || !gymWithPackage || !gymWithPackage.gym_packages?.length) {
    throw new Error('ไม่พบค่ายมวยหรือแพ็คเกจที่ต้องการ');
  }

  const gymPackage = gymWithPackage.gym_packages[0];
  
  // Calculate end date and generate booking number
  const end_date = calculateEndDate(data.start_date, gymPackage.duration_months);
  const bookingNumber = generateBookingNumber();

  // Calculate final price (use provided price_paid or calculate from package price)
  const finalPrice = data.price_paid !== undefined 
    ? data.price_paid 
    : (gymPackage.price || 0) - (data.discount_amount || 0);

  // If promotion_id is provided, verify it exists and increment current_uses
  if (data.promotion_id) {
    const { data: promotion, error: promoError } = await supabase
      .from('promotions')
      .select('id, max_uses, current_uses')
      .eq('id', data.promotion_id)
      .eq('gym_id', data.gym_id)
      .maybeSingle();

    if (promoError || !promotion) {
      throw new Error('โปรโมชั่นไม่พบหรือไม่สามารถใช้ได้');
    }

    // Check if promotion has reached max uses
    if (promotion.max_uses !== null && promotion.current_uses !== null) {
      if (promotion.current_uses >= promotion.max_uses) {
        throw new Error('โปรโมชั่นถูกใช้ครบแล้ว');
      }
    }

    // Increment current_uses (this will be done in a transaction ideally, but for now we'll do it here)
    await supabase
      .from('promotions')
      .update({ current_uses: (promotion.current_uses || 0) + 1 })
      .eq('id', data.promotion_id);
  }

  // Create booking with sanitized data
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: data.user_id,
      gym_id: data.gym_id,
      package_id: data.package_id,
      booking_number: bookingNumber,
      customer_name: data.customer_name.trim(),
      customer_email: data.customer_email.trim().toLowerCase(),
      customer_phone: data.customer_phone.trim(),
      start_date: data.start_date,
      end_date,
      price_paid: finalPrice,
      package_name: gymPackage.name,
      package_type: gymPackage.package_type,
      duration_months: gymPackage.duration_months,
      special_requests: data.special_requests?.trim() || null,
      payment_method: data.payment_method || null,
      promotion_id: data.promotion_id || null,
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
 * Update booking status and/or payment status
 */
export async function updateBookingStatus(
  id: string,
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
) {
  const supabase = await createClient();

  const updateData: Record<string, string> = {
    updated_at: new Date().toISOString()
  };

  if (status) updateData.status = status;
  if (paymentStatus) updateData.payment_status = paymentStatus;

  const { data: booking, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update booking: ${error.message}`);
  }

  return booking;
}

/**
 * Update booking payment status (convenience function)
 */
export async function updateBookingPaymentStatus(
  id: string,
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
) {
  return updateBookingStatus(id, undefined, paymentStatus);
}

/**
 * Cancel booking (convenience function)
 */
export async function cancelBooking(id: string) {
  return updateBookingStatus(id, 'cancelled');
}
