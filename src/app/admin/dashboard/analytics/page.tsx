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
  UsersIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  HomeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';

function AdminAnalyticsContent() {
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
    { label: 'ภาพรวม', href: '/admin/dashboard', icon: HomeIcon },
    { label: 'จัดการผู้ใช้', href: '/admin/dashboard/users', icon: UsersIcon },
    { label: 'จัดการยิม', href: '/admin/dashboard/gyms', icon: BuildingStorefrontIcon },
    { label: 'อนุมัติยิม', href: '/admin/dashboard/approvals', icon: ClockIcon },
    { label: 'รายงาน', href: '/admin/dashboard/reports', icon: DocumentTextIcon },
    { label: 'สถิติ', href: '/admin/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่าระบบ', href: '/admin/dashboard/settings', icon: Cog6ToothIcon },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="สถิติและการวิเคราะห์"
        headerSubtitle="ดูสถิติและการวิเคราะห์ของระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
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
      headerSubtitle="ดูสถิติและการวิเคราะห์ของระบบ"
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
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
                <ArrowTrendingUpIcon className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-bold text-white text-2xl">0</h3>
                <p className="text-default-400 text-sm">ผู้ใช้ใหม่เดือนนี้</p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-3">
              <div className="flex justify-between items-center">
                <div className="bg-success p-3 rounded-lg">
                  <BuildingStorefrontIcon className="w-6 h-6 text-white" />
                </div>
                <ArrowTrendingUpIcon className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-bold text-white text-2xl">0</h3>
                <p className="text-default-400 text-sm">ยิมใหม่เดือนนี้</p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-3">
              <div className="flex justify-between items-center">
                <div className="bg-warning p-3 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <ArrowTrendingUpIcon className="w-5 h-5 text-success" />
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
                <div className="bg-secondary p-3 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <ArrowTrendingUpIcon className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-bold text-white text-2xl">฿0</h3>
                <p className="text-default-400 text-sm">รายได้เดือนนี้</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader>
            <h3 className="font-bold text-white text-xl">กราฟผู้ใช้</h3>
          </CardHeader>
          <CardBody className="justify-center items-center min-h-[300px]">
            <ChartBarIcon className="mb-4 w-16 h-16 text-default-300" />
            <p className="text-center text-default-400">กราฟจะแสดงเมื่อมีข้อมูล</p>
          </CardBody>
        </Card>

        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader>
            <h3 className="font-bold text-white text-xl">กราฟรายได้</h3>
          </CardHeader>
          <CardBody className="justify-center items-center min-h-[300px]">
            <ChartBarIcon className="mb-4 w-16 h-16 text-default-300" />
            <p className="text-center text-default-400">กราฟจะแสดงเมื่อมีข้อมูล</p>
          </CardBody>
        </Card>

        <Card className="bg-default-100/50 backdrop-blur-sm lg:col-span-2 border-none">
          <CardHeader>
            <h3 className="font-bold text-white text-xl">กิจกรรมล่าสุด</h3>
          </CardHeader>
          <CardBody className="justify-center items-center min-h-[200px]">
            <ClockIcon className="mb-4 w-16 h-16 text-default-300" />
            <p className="text-center text-default-400">ไม่มีกิจกรรมล่าสุด</p>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminAnalyticsContent />
    </RoleGuard>
  );
}
