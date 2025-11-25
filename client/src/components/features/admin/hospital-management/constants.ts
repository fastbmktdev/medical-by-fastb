import type { StatusConfig } from './types';
import { ADMIN_STATUS_CONFIG, formatThaiDate } from '../shared/adminUtils';

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: ADMIN_STATUS_CONFIG.pending,
  approved: ADMIN_STATUS_CONFIG.approved,
  rejected: ADMIN_STATUS_CONFIG.rejected,
};

export const STATS_CARDS = [
  {
    title: 'โรงพยาบาลทั้งหมด',
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
  APPROVE_SUCCESS: 'อนุมัติโรงพยาบาลสำเร็จ',
  REJECT_SUCCESS: 'ปฏิเสธโรงพยาบาลสำเร็จ',
  EDIT_SUCCESS: 'แก้ไขข้อมูลโรงพยาบาลสำเร็จ',
  DELETE_SUCCESS: 'ลบโรงพยาบาลสำเร็จ',
  GENERIC_ERROR: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
} as const;

// Re-export the shared date formatting function
export const formatDate = formatThaiDate;
