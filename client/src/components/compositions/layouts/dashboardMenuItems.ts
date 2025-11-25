import type { MenuItem } from './DashboardLayout';
import {
  HomeIcon,
  CalendarIcon,
  HeartIcon,
  BanknotesIcon,
  SparklesIcon,
  UserGroupIcon,
  CreditCardIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

/**
 * Shared menu configuration for the user dashboard sidebar.
 * Keeps navigation consistent across all dashboard pages.
 */
export const dashboardMenuItems: MenuItem[] = [
  {
    label: 'แดชบอร์ด',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    label: 'การจองของฉัน',
    href: '/dashboard/appointments',
    icon: CalendarIcon,
  },
  {
    label: 'รายการโปรด',
    href: '/dashboard/favorites',
    icon: HeartIcon,
  },
  {
    label: 'ประวัติการเงิน',
    href: '/dashboard/transactions',
    icon: BanknotesIcon,
  },
  {
    label: 'Gamification',
    href: '/dashboard/gamification',
    icon: SparklesIcon,
  },
  {
    label: 'Affiliate',
    href: '/dashboard/affiliate',
    icon: UserGroupIcon,
  },
  {
    label: 'วิธีชำระเงิน',
    href: '/dashboard/payment-methods',
    icon: CreditCardIcon,
  },
  {
    label: 'โปรไฟล์',
    href: '/dashboard/profile',
    icon: UserIcon,
  },
];

