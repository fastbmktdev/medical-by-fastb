"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RoleGuard from '@/components/auth/RoleGuard';
import DashboardLayout, { MenuItem } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardBody,
  CardHeader,
} from '@heroui/react';
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  CalendarIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  HomeIcon,
  UsersIcon,
  StarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

function PartnerAnalyticsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
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
    { label: 'ภาพรวม', href: '/partner/dashboard', icon: HomeIcon },
    { label: 'ข้อมูลยิม', href: '/partner/dashboard/gym', icon: BuildingStorefrontIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'สถิติ', href: '/partner/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่า', href: '/partner/dashboard/settings', icon: Cog6ToothIcon },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="สถิติและการวิเคราะห์"
        headerSubtitle="ดูสถิติและประสิทธิภาพของยิม"
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <div className="border-4 border-t-transparent border-red-600 rounded-full w-12 h-12 animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle="สถิติและการวิเคราะห์"
      headerSubtitle="ดูสถิติและประสิทธิภาพของยิม"
      roleLabel="พาร์ทเนอร์"
      roleColor="secondary"
      userEmail={user?.email}
    >
      <section className="mb-8">
        <div className="gap-6 grid grid-cols-1 md:grid-cols-4">
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-3">
              <div className="flex justify-between items-center">
                <div className="bg-primary p-3 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white text-2xl">0</h3>
                <p className="text-default-400 text-sm">ลูกค้าทั้งหมด</p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-3">
              <div className="flex justify-between items-center">
                <div className="bg-success p-3 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white text-2xl">0</h3>
                <p className="text-default-400 text-sm">การจองเดือนนี้</p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-3">
              <div className="flex justify-between items-center">
                <div className="bg-warning p-3 rounded-lg">
                  <StarIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white text-2xl">0.0</h3>
                <p className="text-default-400 text-sm">คะแนนเฉลี่ย</p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-3">
              <div className="flex justify-between items-center">
                <div className="bg-secondary p-3 rounded-lg">
                  <TrophyIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white text-2xl">0</h3>
                <p className="text-default-400 text-sm">อันดับในพื้นที่</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader>
            <h3 className="font-bold text-white text-xl">กราฟรายได้</h3>
          </CardHeader>
          <CardBody className="justify-center items-center min-h-[300px]">
            <ChartBarIcon className="mb-4 w-16 h-16 text-default-300" />
            <p className="text-center text-default-400">กราฟจะแสดงเมื่อมีข้อมูล</p>
          </CardBody>
        </Card>

        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader>
            <h3 className="font-bold text-white text-xl">บริการยอดนิยม</h3>
          </CardHeader>
          <CardBody className="justify-center items-center min-h-[300px]">
            <TrophyIcon className="mb-4 w-16 h-16 text-default-300" />
            <p className="text-center text-default-400">ข้อมูลจะแสดงเมื่อมีการจอง</p>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function PartnerAnalyticsPage() {
  return (
    <RoleGuard allowedRole="partner">
      <PartnerAnalyticsContent />
    </RoleGuard>
  );
}
