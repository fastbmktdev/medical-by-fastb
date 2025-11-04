import { MenuItem } from '@/components/shared';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CubeIcon,
  TagIcon,
  CalendarIcon,
  QrCodeIcon,
  NewspaperIcon,
} from '@heroicons/react/24/outline';

/**
 * Admin Dashboard Menu Items
 * Centralized menu configuration for all admin dashboard pages
 */
export const adminMenuItems: MenuItem[] = [
  { label: 'จัดการผู้ใช้', href: '/admin/dashboard/users', icon: UsersIcon },
  { label: 'จัดการยิม', href: '/admin/dashboard/gyms', icon: BuildingStorefrontIcon },
  { label: 'จัดการสินค้า', href: '/admin/dashboard/products', icon: CubeIcon },
  { label: 'หมวดหมู่สินค้า', href: '/admin/dashboard/products/categories', icon: TagIcon },
  { label: 'จัดการอีเวนต์', href: '/admin/dashboard/events', icon: CalendarIcon },
  { label: 'หมวดหมู่อีเวนต์', href: '/admin/dashboard/events/categories', icon: TagIcon },
  { label: 'เช็คอินตั๋ว', href: '/admin/dashboard/events/check-in', icon: QrCodeIcon },
  { label: 'จัดการบทความ', href: '/admin/dashboard/articles', icon: NewspaperIcon },
  { label: 'อนุมัติยิม', href: '/admin/dashboard/approvals', icon: ClockIcon },
  { label: 'รายงาน', href: '/admin/dashboard/reports', icon: DocumentTextIcon },
  { label: 'สถิติ', href: '/admin/dashboard/analytics', icon: ChartBarIcon },
  { label: 'Audit Logs', href: '/admin/dashboard/audit-logs', icon: ShieldCheckIcon },
  // { label: 'ตั้งค่าระบบ', href: '/admin/dashboard/settings', icon: Cog6ToothIcon },
];
