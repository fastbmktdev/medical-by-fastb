import { MenuItem } from '@/components/shared';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

/**
 * Admin Dashboard Menu Items
 * Centralized menu configuration for all admin dashboard pages
 */
export const adminMenuItems: MenuItem[] = [
  { label: 'จัดการผู้ใช้', href: '/admin/dashboard/users', icon: UsersIcon },
  { label: 'จัดการยิม', href: '/admin/dashboard/gyms', icon: BuildingStorefrontIcon },
  { label: 'อนุมัติยิม', href: '/admin/dashboard/approvals', icon: ClockIcon },
  { label: 'รายงาน', href: '/admin/dashboard/reports', icon: DocumentTextIcon },
  { label: 'สถิติ', href: '/admin/dashboard/analytics', icon: ChartBarIcon },
  // { label: 'ตั้งค่าระบบ', href: '/admin/dashboard/settings', icon: Cog6ToothIcon },
];
