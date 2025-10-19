import type { StatusConfig } from './types';

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: { label: 'รอการตรวจสอบ', color: 'warning' },
  approved: { label: 'อนุมัติแล้ว', color: 'success' },
  rejected: { label: 'ไม่อนุมัติ', color: 'danger' },
};

export const STATS_CARDS = [
  {
    title: 'ยิมทั้งหมด',
    color: 'default',
    bgColor: 'bg-default-100/50',
    textColor: 'text-white',
  },
  {
    title: 'อนุมัติแล้ว',
    color: 'success',
    bgColor: 'bg-success/10',
    textColor: 'text-success',
  },
  {
    title: 'รออนุมัติ',
    color: 'warning',
    bgColor: 'bg-warning/10',
    textColor: 'text-warning',
  },
  {
    title: 'ไม่อนุมัติ',
    color: 'danger',
    bgColor: 'bg-danger/10',
    textColor: 'text-danger',
  },
] as const;

export const SEARCH_DEBOUNCE_MS = 300;

export const TOAST_MESSAGES = {
  APPROVE_SUCCESS: 'อนุมัติยิมสำเร็จ',
  REJECT_SUCCESS: 'ปฏิเสธยิมสำเร็จ',
  EDIT_SUCCESS: 'แก้ไขข้อมูลยิมสำเร็จ',
  DELETE_SUCCESS: 'ลบยิมสำเร็จ',
  GENERIC_ERROR: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
} as const;

// Utility function for formatting dates
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
