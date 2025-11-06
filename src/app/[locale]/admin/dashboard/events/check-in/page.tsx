"use client";

import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import { CheckInScanner } from '@/components/features/admin/check-in';
import { createClient } from '@/lib/database/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

function CheckInPageContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    loadUser();
  }, [supabase]);

  return (
    <DashboardLayout
      menuItems={adminMenuItems}
      headerTitle="ระบบเช็คอินตั๋ว"
      headerSubtitle="เช็คอินตั๋วอีเวนต์ด้วย QR Code หรือ Ticket ID"
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
      userEmail={user?.email}
    >
      <CheckInScanner />
    </DashboardLayout>
  );
}

export default function CheckInPage() {
  return (
    <RoleGuard allowedRole="admin">
      <CheckInPageContent />
    </RoleGuard>
  );
}

