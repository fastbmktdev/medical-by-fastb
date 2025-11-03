/**
 * Shared utility functions for admin components
 * Provides common functionality and helpers
 */

import { showSuccessToast, showErrorToast } from '@/lib/utils';

// Common toast messages
export const ADMIN_TOAST_MESSAGES = {
  SAVE_SUCCESS: 'บันทึกข้อมูลสำเร็จ',
  DELETE_SUCCESS: 'ลบข้อมูลสำเร็จ',
  APPROVE_SUCCESS: 'อนุมัติสำเร็จ',
  REJECT_SUCCESS: 'ปฏิเสธสำเร็จ',
  GENERIC_ERROR: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
  NETWORK_ERROR: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
  PERMISSION_ERROR: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้',
} as const;

// Status configurations for common admin entities
export const ADMIN_STATUS_CONFIG = {
  pending: { label: 'รอการตรวจสอบ', color: 'warning' as const },
  approved: { label: 'อนุมัติแล้ว', color: 'success' as const },
  rejected: { label: 'ไม่อนุมัติ', color: 'danger' as const },
  active: { label: 'ใช้งาน', color: 'success' as const },
  inactive: { label: 'ไม่ใช้งาน', color: 'default' as const },
  draft: { label: 'ร่าง', color: 'default' as const },
  published: { label: 'เผยแพร่แล้ว', color: 'success' as const },
} as const;

type DateFormatOptions = Intl.DateTimeFormatOptions;

const formatDate = (
  dateString: string | null | undefined,
  options: DateFormatOptions
): string => dateString ? new Date(dateString).toLocaleDateString('th-TH', options) : '-';

export const formatThaiDate = (dateString: string | null | undefined): string =>
  formatDate(dateString, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatShortDate = (dateString: string | null | undefined): string =>
  formatDate(dateString, { year: '2-digit', month: 'short', day: 'numeric' });

/**
 * Handle API response with consistent error handling
 */
export async function handleApiResponse<T>(
  response: Response,
  successMessage?: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const result = await response.json();
    
    if (result.success) {
      if (successMessage) {
        showSuccessToast(successMessage);
      }
      return { success: true, data: result.data };
    } else {
      const errorMessage = result.error || ADMIN_TOAST_MESSAGES.GENERIC_ERROR;
      showErrorToast(errorMessage);
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error('API Response Error:', error);
    showErrorToast(ADMIN_TOAST_MESSAGES.NETWORK_ERROR);
    return { success: false, error: ADMIN_TOAST_MESSAGES.NETWORK_ERROR };
  }
}

/**
 * Generic API call wrapper with error handling
 */
export async function makeApiCall<T>(
  url: string,
  options: RequestInit,
  successMessage?: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    return await handleApiResponse<T>(response, successMessage);
  } catch (error) {
    console.error('API Call Error:', error);
    showErrorToast(ADMIN_TOAST_MESSAGES.NETWORK_ERROR);
    return { success: false, error: ADMIN_TOAST_MESSAGES.NETWORK_ERROR };
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const filterBySearch = <T>(items: T[], query: string, searchFields: (keyof T)[]): T[] => {
  if (!query.trim()) return items;
  const lowerQuery = query.toLowerCase();
  return items.filter((item) =>
    searchFields.some((field) =>
      typeof item[field] === 'string' && (item[field] as string).toLowerCase().includes(lowerQuery)
    )
  );
};

export const filterByStatus = <T extends { status?: string }>(items: T[], status: string): T[] =>
  status === 'all' ? items : items.filter((item) => item.status === status);

export const getItemStats = <T extends { status?: string }>(items: T[]) => ({
  total: items.length,
  approved: items.filter((item) => item.status === 'approved').length,
  pending: items.filter((item) => item.status === 'pending').length,
  rejected: items.filter((item) => item.status === 'rejected').length,
});

export const generateSlug = (text: string): string =>
  text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const truncateText = (text: string, maxLength: number): string =>
  text.length <= maxLength ? text : text.substring(0, maxLength).trim() + '...';

export const hasPermission = (userRole: string, requiredRoles: string[]): boolean =>
  requiredRoles.includes(userRole);

export const sortBy = <T>(items: T[], field: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] =>
  [...items].sort((a, b) => {
    const [aValue, bValue] = [a[field], b[field]];
    return aValue < bValue ? (direction === 'asc' ? -1 : 1) : aValue > bValue ? (direction === 'asc' ? 1 : -1) : 0;
  });

export const paginate = <T>(items: T[], page: number, pageSize: number): T[] =>
  items.slice((page - 1) * pageSize, page * pageSize);

export const getPaginationInfo = (totalItems: number, page: number, pageSize: number) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  return {
    totalPages,
    currentPage: page,
    startIndex: (page - 1) * pageSize + 1,
    endIndex: Math.min(page * pageSize, totalItems),
    totalItems,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};