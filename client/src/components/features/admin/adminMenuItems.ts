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
  MegaphoneIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

/**
 * Admin Dashboard Menu Items
 * Centralized menu configuration for all admin dashboard pages
 */
export const adminMenuItems: MenuItem[] = [
  { label: 'จัดการผู้ใช้', href: '/admin/dashboard/users', icon: UsersIcon },
  { label: 'จัดการโรงพยาบาล', href: '/admin/dashboard/hospitals', icon: BuildingStorefrontIcon },
  { label: 'จัดการสินค้า', href: '/admin/dashboard/products', icon: CubeIcon },
  { label: 'หมวดหมู่สินค้า', href: '/admin/dashboard/products/categories', icon: TagIcon },
  { label: 'จัดการบทความ', href: '/admin/dashboard/articles', icon: NewspaperIcon },
  { label: 'จัดการโปรโมชั่น', href: '/admin/dashboard/promotions', icon: MegaphoneIcon },
  { label: 'จัดการการจอง', href: '/admin/dashboard/appointments', icon: CalendarIcon },
  { label: 'อนุมัติโรงพยาบาล', href: '/admin/dashboard/approvals', icon: ClockIcon },
  { label: 'รายงาน', href: '/admin/dashboard/reports', icon: DocumentTextIcon },
  { label: 'สถิติ', href: '/admin/dashboard/analytics', icon: ChartBarIcon },
  { label: 'Audit Logs', href: '/admin/dashboard/audit-logs', icon: ShieldCheckIcon },
  { label: 'จัดการข้อพิพาท', href: '/admin/dashboard/disputes', icon: ExclamationTriangleIcon },
  { label: 'Error Tracking', href: '/admin/dashboard/error-tracking', icon: ExclamationTriangleIcon },
  // { label: 'ตั้งค่าระบบ', href: '/admin/dashboard/settings', icon: Cog6ToothIcon },
];