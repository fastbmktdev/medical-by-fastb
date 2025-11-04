"use client";

import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import {
  UserIcon,
  CalendarIcon,
  HeartIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import SavedPaymentMethods from '@/components/features/payments/SavedPaymentMethods';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { User } from '@supabase/supabase-js';

function PaymentMethodsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);

  const menuItems: MenuItem[] = [
    { label: 'การจองของฉัน', href: '/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการโปรด', href: '/dashboard/favorites', icon: HeartIcon },
    { label: 'ประวัติการเงิน', href: '/dashboard/transactions', icon: BanknotesIcon },
    { label: 'โปรไฟล์', href: '/dashboard/profile', icon: UserIcon },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="จัดการบัตรเครดิต"
        headerSubtitle="จัดการบัตรเครดิตที่บันทึกไว้"
        roleLabel="ผู้ใช้ทั่วไป"
        roleColor="primary"
        userEmail={user?.email}
        showPartnerButton={true}
      >
        <div className="flex justify-center items-center py-20">
          <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle="จัดการบัตรเครดิต"
      headerSubtitle="จัดการบัตรเครดิตที่บันทึกไว้"
      roleLabel="ผู้ใช้ทั่วไป"
      roleColor="primary"
      userEmail={user?.email}
      showPartnerButton={true}
    >
      <SavedPaymentMethods showAddButton={true} />
    </DashboardLayout>
  );
}

export default function PaymentMethodsPage() {
  return (
    <RoleGuard allowedRole="authenticated">
      <PaymentMethodsContent />
    </RoleGuard>
  );
}

