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
} from '@heroui/react';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  HomeIcon,
  ArrowDownTrayIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';

function AdminReportsContent() {
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
    { label: 'จัดการผู้ใช้', href: '/admin/dashboard/users', icon: UsersIcon },
    { label: 'จัดการยิม', href: '/admin/dashboard/gyms', icon: BuildingStorefrontIcon },
    { label: 'อนุมัติยิม', href: '/admin/dashboard/approvals', icon: ClockIcon },
    { label: 'รายงาน', href: '/admin/dashboard/reports', icon: DocumentTextIcon },
    { label: 'สถิติ', href: '/admin/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่าระบบ', href: '/admin/dashboard/settings', icon: Cog6ToothIcon },
  ];

  const reports: Array<{
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'primary' | 'success' | 'warning' | 'secondary';
  }> = [
    {
      title: 'รายงานผู้ใช้ทั้งหมด',
      description: 'ข้อมูลผู้ใช้ทั้งหมดในระบบ',
      icon: UsersIcon,
      color: 'primary',
    },
    {
      title: 'รายงานยิมทั้งหมด',
      description: 'ข้อมูลยิมทั้งหมดในระบบ',
      icon: BuildingStorefrontIcon,
      color: 'success',
    },
    {
      title: 'รายงานการจอง',
      description: 'ข้อมูลการจองทั้งหมด',
      icon: DocumentChartBarIcon,
      color: 'warning',
    },
    {
      title: 'รายงานรายได้',
      description: 'ข้อมูลรายได้และธุรกรรม',
      icon: ChartBarIcon,
      color: 'secondary',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="รายงาน"
        headerSubtitle="ดาวน์โหลดรายงานต่างๆ ของระบบ"
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
      headerTitle="รายงาน"
      headerSubtitle="ดาวน์โหลดรายงานต่างๆ ของระบบ"
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
      userEmail={user?.email}
    >
      <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
        {reports.map((report, index) => {
          const Icon = report.icon;
          return (
            <Card key={index} className="bg-default-100/50 backdrop-blur-sm border-none">
              <CardHeader className="flex items-center gap-4">
                <div className={`bg-${report.color} p-4 rounded-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-bold text-white text-lg">{report.title}</h3>
                  <p className="text-default-400 text-sm">{report.description}</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex gap-2">
                  <Button
                    color={report.color}
                    variant="flat"
                    startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                    className="flex-1"
                  >
                    ดาวน์โหลด PDF
                  </Button>
                  <Button
                    color={report.color}
                    variant="bordered"
                    startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                    className="flex-1"
                  >
                    ดาวน์โหลด CSV
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card className="bg-default-100/50 backdrop-blur-sm mt-8 border-none">
        <CardHeader>
          <h3 className="font-bold text-white text-xl">รายงานกำหนดเอง</h3>
        </CardHeader>
        <CardBody className="justify-center items-center py-12 text-center">
          <DocumentTextIcon className="mb-4 w-16 h-16 text-default-300" />
          <p className="mb-6 text-default-400">สร้างรายงานตามช่วงเวลาและตัวกรองที่ต้องการ</p>
          <Button color="danger">
            สร้างรายงานกำหนดเอง
          </Button>
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}

export default function AdminReportsPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminReportsContent />
    </RoleGuard>
  );
}
