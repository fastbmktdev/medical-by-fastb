"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Switch,
} from '@heroui/react';
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  CalendarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';
import { Loading } from '@/components/design-system/primitives/Loading';

function PartnerSettingsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);

  const menuItems: MenuItem[] = [
    { label: 'ข้อมูลยิม', href: '/partner/dashboard/gym', icon: BuildingStorefrontIcon },
    { label: 'โปรโมชั่น', href: '/partner/dashboard/promotions', icon: MegaphoneIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'การจ่ายเงิน', href: '/partner/dashboard/payouts', icon: CurrencyDollarIcon },
    { label: 'สถิติ', href: '/partner/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่า', href: '/partner/dashboard/settings', icon: Cog6ToothIcon },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="ตั้งค่า"
        headerSubtitle="จัดการการตั้งค่าบัญชีและการแจ้งเตือน"
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <Loading centered size="xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle="ตั้งค่า"
      headerSubtitle="จัดการการตั้งค่าบัญชีและการแจ้งเตือน"
      roleLabel="พาร์ทเนอร์"
      roleColor="secondary"
      userEmail={user?.email}
    >
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
        {/* Notifications */}
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader className="flex items-center gap-3">
            <BellIcon className="w-6 h-6 text-secondary" />
            <h3 className="font-bold text-xl">การแจ้งเตือน</h3>
          </CardHeader>
          <CardBody className="gap-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="mb-1 font-semibold text-white">อีเมล</p>
                <p className="text-default-400 text-sm">รับการแจ้งเตือนทางอีเมล</p>
              </div>
              <Switch
                isSelected={emailNotifications}
                onValueChange={setEmailNotifications}
                color="secondary"
              />
            </div>
            <div className="flex justify-between items-center pt-4 border-white/5 border-t">
              <div>
                <p className="mb-1 font-semibold text-white">SMS</p>
                <p className="text-default-400 text-sm">รับการแจ้งเตือนทาง SMS</p>
              </div>
              <Switch
                isSelected={smsNotifications}
                onValueChange={setSmsNotifications}
                color="secondary"
              />
            </div>
          </CardBody>
        </Card>

        {/* Security */}
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader className="flex items-center gap-3">
            <ShieldCheckIcon className="w-6 h-6 text-secondary" />
            <h3 className="font-bold text-xl">ความปลอดภัย</h3>
          </CardHeader>
          <CardBody className="gap-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="mb-1 font-semibold text-white">รหัสผ่าน</p>
                <p className="text-default-400 text-sm">เปลี่ยนรหัสผ่านของคุณ</p>
              </div>
              <Button size="sm" color="secondary" variant="flat">
                เปลี่ยน
              </Button>
            </div>
            <div className="flex justify-between items-center pt-4 border-white/5 border-t">
              <div>
                <p className="mb-1 font-semibold text-white">2FA</p>
                <p className="text-default-400 text-sm">การยืนยันตัวตนแบบสองชั้น</p>
              </div>
              <Button size="sm" variant="flat">
                เปิดใช้งาน
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Bank Account */}
        <Card className="lg:col-span-2 bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader className="flex items-center gap-3">
            <BanknotesIcon className="w-6 h-6 text-secondary" />
            <h3 className="font-bold text-xl">บัญชีธนาคาร</h3>
          </CardHeader>
          <CardBody className="gap-4">
            <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
              <Input
                label="ชื่อธนาคาร"
                placeholder="เลือกธนาคาร"
                classNames={{
                  input: "text-white",
                  label: "text-default-400",
                }}
              />
              <Input
                label="เลขที่บัญชี"
                placeholder="กรอกเลขที่บัญชี"
                classNames={{
                  input: "text-white",
                  label: "text-default-400",
                }}
              />
              <Input
                label="ชื่อบัญชี"
                placeholder="กรอกชื่อบัญชี"
                classNames={{
                  input: "text-white",
                  label: "text-default-400",
                }}
              />
            </div>
            <div className="flex justify-end">
              <Button color="secondary">
                บันทึกข้อมูล
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function PartnerSettingsPage() {
  return (
    <RoleGuard allowedRole="partner">
      <PartnerSettingsContent />
    </RoleGuard>
  );
}
