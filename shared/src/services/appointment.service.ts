/**
 * appointment Service
 * Business logic for appointment operations
 */

import { 
  getServiceClient, 
  handleQueryError, 
  ServiceValidationError,
  ServiceNotFoundError,
  handleQueryResult
} from './service-utils';
import { generateNumberWithPrefix, sanitizePrice } from '@shared/lib/utils/number-utils';

/**
 * Input fields required to create a new booking (appointment)
 */
export interface CreateBookingInput {
  user_id: string;
  hospital_id: string;
  package_id: string;
  payment_id?: string | null;
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

/**
 * Filters for retrieving bookings
 */
export interface BookingFilters {
  user_id?: string;
  hospital_id?: string;
  status?: string;
}

// Validation constants
import { VALIDATION_PATTERNS } from '@shared/lib/utils/validation';

/**
 * Validate appointment data.
 * Returns an array of error messages if any, or an empty array if valid.
 */
export function validateBookingData(data: CreateBookingInput): string[] {
  const errors: string[] = [];

  // Required fields
  if (!data.hospital_id) errors.push('กรุณาเลือกโรงพยาบาล');
  if (!data.package_id) errors.push('กรุณาเลือกแพ็คเกจ');
  if (!data.customer_name?.trim()) errors.push('กรุณากรอกชื่อผู้จอง');
  if (!data.customer_email?.trim()) errors.push('กรุณากรอกอีเมล');
  if (!data.customer_phone?.trim()) errors.push('กรุณากรอกเบอร์โทรศัพท์');
  if (!data.start_date) errors.push('กรุณาเลือกวันที่เริ่มต้น');

  // Format validations
  if (data.customer_email && !VALIDATION_PATTERNS.EMAIL.test(data.customer_email.trim())) {
    errors.push('รูปแบบอีเมลไม่ถูกต้อง');
  }
  if (data.customer_phone && !VALIDATION_PATTERNS.PHONE_THAI.test(data.customer_phone.replace(/\s/g, ''))) {
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
 * Generate a unique booking (appointment) number.
 */
export function generateBookingNumber(): string {
  return generateNumberWithPrefix('BK', {
    includeDate: true,
    timestampLength: 4,
  });
}

/**
 * Calculate end date based on the start date and package duration (in months).
 */
export function calculateEndDate(startDate: string, durationMonths: number | null): string | null {
  if (!durationMonths) return null;
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(startDateObj);
  endDateObj.setMonth(endDateObj.getMonth() + durationMonths);
  return endDateObj.toISOString().split('T')[0];
}

/**
 * Get all (or filtered) bookings. Optimized: only select needed columns.
 */
export async function getAppointments(filters?: BookingFilters) {
  const supabase = await getServiceClient();

  let query = supabase
    .from('appointments')
    .select(`
      id,
      user_id,
      hospital_id,
      package_id,
      payment_id,
      booking_number,
      customer_name,
      customer_email,
      customer_phone,
      start_date,
      end_date,
      price_paid,
      package_name,
      package_type,
      duration_months,
      special_requests,
      payment_method,
      promotion_id,
      discount_amount,
      payment_status,
      status,
      created_at,
      updated_at,
      hospitals:hospital_id (
        id,
        hospital_name,
        hospital_name_english,
        slug
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }
  if (filters?.hospital_id) {
    query = query.eq('hospital_id', filters.hospital_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data: appointments, error } = await query;

  handleQueryError(error, 'Failed to fetch appointments');

  return appointments || [];
}

/**
 * Get appointment by ID (optimized: only select needed columns).
 */
export async function getAppointmentById(id: string) {
  const supabase = await getServiceClient();

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      id,
      user_id,
      hospital_id,
      package_id,
      payment_id,
      booking_number,
      customer_name,
      customer_email,
      customer_phone,
      start_date,
      end_date,
      price_paid,
      package_name,
      package_type,
      duration_months,
      special_requests,
      payment_method,
      promotion_id,
      discount_amount,
      payment_status,
      status,
      created_at,
      updated_at,
      hospitals:hospital_id (
        id,
        hospital_name,
        hospital_name_english,
        slug
      )
    `)
    .eq('id', id)
    .maybeSingle();

  handleQueryError(error, 'Failed to fetch appointment');

  return appointment;
}

/**
 * Create a new booking (appointment) with validation and promotion usage.
 */
export async function createAppointment(data: CreateBookingInput) {
  // Validate input data
  const validationErrors = validateBookingData(data);
  if (validationErrors.length > 0) {
    // Convert string[] to Record<string, string[]> format
    throw new ServiceValidationError('ข้อมูลไม่ครบถ้วน', { 
      general: validationErrors 
    });
  }

  const supabase = await getServiceClient();

  // Run verification queries in parallel
  const [hospitalResult, promotionResult] = await Promise.all([
    supabase
      .from('hospitals')
      .select(`
        id,
        hospital_name,
        status,
        hospital_packages!inner(
          id,
          name,
          price,
          package_type,
          duration_months,
          is_active
        )
      `)
      .eq('id', data.hospital_id)
      .eq('status', 'approved')
      .eq('hospital_packages.id', data.package_id)
      .eq('hospital_packages.is_active', true)
      .maybeSingle(),
    data.promotion_id
      ? supabase
          .from('promotions')
          .select('id, max_uses, current_uses')
          .eq('id', data.promotion_id)
          .eq('hospital_id', data.hospital_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null })
  ]);

  const { data: hospitalWithPackage, error: verificationError } = hospitalResult;
  handleQueryError(verificationError, 'Failed to verify hospital or package');
  if (!hospitalWithPackage || !hospitalWithPackage.hospital_packages?.length) {
    throw new ServiceNotFoundError('ไม่พบโรงพยาบาลหรือแพ็คเกจที่ต้องการ');
  }

  // Handle promotion usage if provided
  const { data: promotion, error: promoError } = promotionResult;
  handleQueryError(promoError, 'Failed to fetch promotion');
  if (data.promotion_id && promotion) {
    if (promotion.max_uses !== null && promotion.current_uses !== null && promotion.current_uses >= promotion.max_uses) {
      throw new ServiceValidationError('โปรโมชั่นถูกใช้ครบแล้ว');
    }
  }

  const pkg = hospitalWithPackage.hospital_packages[0];
  const end_date = calculateEndDate(data.start_date, pkg.duration_months);
  const bookingNumber = generateBookingNumber();

  const sanitizedDiscountAmount = data.discount_amount && data.discount_amount > 0
    ? sanitizePrice(data.discount_amount)
    : null;

  const finalPrice = data.price_paid !== undefined && !Number.isNaN(data.price_paid)
    ? sanitizePrice(data.price_paid)
    : sanitizePrice((pkg.price || 0) - (sanitizedDiscountAmount ?? 0));

  if (data.promotion_id && promotion) {
    // Increment current_uses atomically using RPC if possible, fallback to update
    const { error: incrementError } = await supabase.rpc('increment_promotion_uses', {
      promotion_id: data.promotion_id,
    });
    if (incrementError) {
      await supabase
        .from('promotions')
        .update({ current_uses: (promotion.current_uses || 0) + 1 })
        .eq('id', data.promotion_id);
    }
  }

  // Insert the new appointment
  const { data: appointment, error: bookingError } = await supabase
    .from('appointments')
    .insert({
      user_id: data.user_id,
      hospital_id: data.hospital_id,
      payment_id: data.payment_id || null,
      package_id: data.package_id,
      booking_number: bookingNumber,
      customer_name: data.customer_name.trim(),
      customer_email: data.customer_email.trim().toLowerCase(),
      customer_phone: data.customer_phone.trim(),
      start_date: data.start_date,
      end_date,
      price_paid: finalPrice,
      package_name: pkg.name,
      package_type: pkg.package_type,
      duration_months: pkg.duration_months,
      special_requests: data.special_requests?.trim() || null,
      payment_method: data.payment_method || null,
      promotion_id: data.promotion_id || null,
      discount_amount: sanitizedDiscountAmount,
      payment_status: 'pending',
      status: 'pending',
    })
    .select()
    .single();

  return handleQueryResult(appointment, bookingError, 'Failed to create appointment');
}

/**
 * Update appointment status and/or payment status
 */
export async function updateAppointmentStatus(
  id: string,
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
) {
  const supabase = await getServiceClient();

  const updateData: Record<string, string> = {
    updated_at: new Date().toISOString(),
  };
  if (status) updateData.status = status;
  if (paymentStatus) updateData.payment_status = paymentStatus;

  const { data: appointment, error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  return handleQueryResult(appointment, error, 'Failed to update appointment');
}

/**
 * Update the appointment's payment status (convenience function)
 */
export async function updateBookingPaymentStatus(
  id: string,
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
) {
  return updateAppointmentStatus(id, undefined, paymentStatus);
}

/**
 * Cancel appointment (convenience function)
 */
export async function cancelBooking(id: string) {
  return updateAppointmentStatus(id, 'cancelled');
}
