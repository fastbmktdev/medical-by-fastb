/**
 * Supabase Error Handler Utilities
 * 
 * Provides utilities for handling Supabase connection errors and empty states
 */

/**
 * Check if error is a connection error
 */
export function isConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const message = error.message.toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('econnrefused') ||
    message.includes('network error') ||
    message.includes('connection refused') ||
    message.includes('timeout') ||
    message.includes('networkerror')
  );
}

/**
 * Check if Supabase error is a connection error
 */
export function isSupabaseConnectionError(error: any): boolean {
  if (!error) return false;
  
  // Check error message
  if (error.message && isConnectionError(new Error(error.message))) {
    return true;
  }
  
  // Check error code
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // Check if it's a fetch error
  if (error.message?.includes('Failed to fetch')) {
    return true;
  }
  
  return false;
}

/**
 * Get user-friendly error message for Supabase errors
 */
export function getSupabaseErrorMessage(error: unknown, defaultMessage: string = 'เกิดข้อผิดพลาดในการเชื่อมต่อ'): string {
  if (isConnectionError(error)) {
    return 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
  }
  
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  
  return defaultMessage;
}

/**
 * Safe Supabase query wrapper that handles connection errors
 */
export async function safeSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallbackValue: T | null = null
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await queryFn();
    
    if (result.error) {
      if (isSupabaseConnectionError(result.error)) {
        console.error('Supabase connection error:', result.error);
        return { data: fallbackValue, error: new Error('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้') };
      }
      return { data: fallbackValue, error: new Error(result.error.message || 'เกิดข้อผิดพลาด') };
    }
    
    return { data: result.data, error: null };
  } catch (error) {
    if (isConnectionError(error)) {
      console.error('Connection error:', error);
      return { data: fallbackValue, error: new Error('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้') };
    }
    return { data: fallbackValue, error: error instanceof Error ? error : new Error('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ') };
  }
}

