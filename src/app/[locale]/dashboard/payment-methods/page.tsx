"use client";

import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, dashboardMenuItems } from '@/components/shared';
import SavedPaymentMethods from '@/components/features/payments/SavedPaymentMethods';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { User } from '@supabase/supabase-js';
import { Loading } from '@/components/design-system/primitives/Loading';

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

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={dashboardMenuItems}
        headerTitle="จัดการบัตรเครดิต"
        headerSubtitle="จัดการบัตรเครดิตที่บันทึกไว้"
        roleLabel="ผู้ใช้ทั่วไป"
        roleColor="primary"
        userEmail={user?.email}
        showPartnerButton={true}
      >
        <div className="flex justify-center items-center py-20">
          <Loading centered size="xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={dashboardMenuItems}
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

