"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Switch,
  Textarea,
} from '@heroui/react';
import {
  GlobeAltIcon,
  BellIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';

function AdminSettingsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApproval, setAutoApproval] = useState(false);

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
        menuItems={adminMenuItems}
        headerTitle="ตั้งค่าระบบ"
        headerSubtitle="จัดการการตั้งค่าทั่วไปของระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={adminMenuItems}
      headerTitle="ตั้งค่าระบบ"
      headerSubtitle="จัดการการตั้งค่าทั่วไปของระบบ"
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
      userEmail={user?.email}
    >
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
        {/* General Settings */}
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader className="flex items-center gap-3">
            <GlobeAltIcon className="w-6 h-6 text-danger" />
            <h3 className="font-bold text-white text-xl">ตั้งค่าทั่วไป</h3>
          </CardHeader>
          <CardBody className="gap-4">
            <Input
              label="ชื่อเว็บไซต์"
              placeholder="MUAYTHAI"
              classNames={{
                input: "text-white",
                label: "text-default-400",
              }}
            />
            <Textarea
              label="คำอธิบายเว็บไซต์"
              placeholder="แพลตฟอร์มจองยิมมวยไทยออนไลน์"
              classNames={{
                input: "text-white",
                label: "text-default-400",
              }}
            />
            <Input
              label="อีเมลผู้ดูแล"
              type="email"
              placeholder="admin@muaythai.com"
              classNames={{
                input: "text-white",
                label: "text-default-400",
              }}
            />
          </CardBody>
        </Card>

        {/* System Settings */}
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader className="flex items-center gap-3">
            <Cog6ToothIcon className="w-6 h-6 text-danger" />
            <h3 className="font-bold text-white text-xl">ตั้งค่าระบบ</h3>
          </CardHeader>
          <CardBody className="gap-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="mb-1 font-semibold text-white">โหมดปิดปรับปรุง</p>
                <p className="text-default-400 text-sm">ปิดเว็บไซต์ชั่วคราว</p>
              </div>
              <Switch
                isSelected={maintenanceMode}
                onValueChange={setMaintenanceMode}
                color="danger"
              />
            </div>
            <div className="flex justify-between items-center pt-4 border-white/5 border-t">
              <div>
                <p className="mb-1 font-semibold text-white">อนุมัติยิมอัตโนมัติ</p>
                <p className="text-default-400 text-sm">อนุมัติยิมใหม่โดยอัตโนมัติ</p>
              </div>
              <Switch
                isSelected={autoApproval}
                onValueChange={setAutoApproval}
                color="danger"
              />
            </div>
          </CardBody>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader className="flex items-center gap-3">
            <BellIcon className="w-6 h-6 text-danger" />
            <h3 className="font-bold text-white text-xl">การแจ้งเตือน</h3>
          </CardHeader>
          <CardBody className="gap-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="mb-1 font-semibold text-white">แจ้งเตือนผู้ใช้ใหม่</p>
                <p className="text-default-400 text-sm">แจ้งเตือนเมื่อมีผู้ใช้ใหม่</p>
              </div>
              <Switch color="danger" defaultSelected />
            </div>
            <div className="flex justify-between items-center pt-4 border-white/5 border-t">
              <div>
                <p className="mb-1 font-semibold text-white">แจ้งเตือนยิมใหม่</p>
                <p className="text-default-400 text-sm">แจ้งเตือนเมื่อมียิมใหม่</p>
              </div>
              <Switch color="danger" defaultSelected />
            </div>
            <div className="flex justify-between items-center pt-4 border-white/5 border-t">
              <div>
                <p className="mb-1 font-semibold text-white">แจ้งเตือนการจอง</p>
                <p className="text-default-400 text-sm">แจ้งเตือนเมื่อมีการจอง</p>
              </div>
              <Switch color="danger" defaultSelected />
            </div>
          </CardBody>
        </Card>

        {/* Payment Settings */}
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader className="flex items-center gap-3">
            <CurrencyDollarIcon className="w-6 h-6 text-danger" />
            <h3 className="font-bold text-white text-xl">การชำระเงิน</h3>
          </CardHeader>
          <CardBody className="gap-4">
            <Input
              label="ค่าธรรมเนียมระบบ (%)"
              type="number"
              placeholder="10"
              classNames={{
                input: "text-white",
                label: "text-default-400",
              }}
            />
            <Input
              label="ยอดถอนขั้นต่ำ (บาท)"
              type="number"
              placeholder="1000"
              classNames={{
                input: "text-white",
                label: "text-default-400",
              }}
            />
          </CardBody>
        </Card>

        {/* Security */}
        <Card className="lg:col-span-2 bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader className="flex items-center gap-3">
            <ShieldCheckIcon className="w-6 h-6 text-danger" />
            <h3 className="font-bold text-white text-xl">ความปลอดภัย</h3>
          </CardHeader>
          <CardBody className="gap-4">
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4">
              <div>
                <p className="mb-1 font-semibold text-white">เปลี่ยนรหัสผ่าน</p>
                <p className="text-default-400 text-sm">เปลี่ยนรหัสผ่านผู้ดูแลระบบ</p>
              </div>
              <Button size="sm" color="danger" variant="flat">
                เปลี่ยนรหัสผ่าน
              </Button>
            </div>
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 pt-4 border-white/5 border-t">
              <div>
                <p className="mb-1 font-semibold text-white">ดูบันทึกกิจกรรม</p>
                <p className="text-default-400 text-sm">ดูประวัติการใช้งานของผู้ดูแล</p>
              </div>
              <Button size="sm" variant="flat">
                ดูบันทึก
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end lg:col-span-2">
          <Button color="danger" size="lg">
            บันทึกการตั้งค่า
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AdminSettingsPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminSettingsContent />
    </RoleGuard>
  );
}
