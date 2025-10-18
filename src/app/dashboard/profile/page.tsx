"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RoleGuard from '@/components/auth/RoleGuard';
import DashboardLayout, { MenuItem } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Avatar,
} from '@heroui/react';
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  HeartIcon,
  BanknotesIcon,
  PencilIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';

function ProfileContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Load user profile data from user_metadata or database
        setFormData({
          displayName: user.user_metadata?.display_name || '',
          phone: user.user_metadata?.phone || '',
          address: user.user_metadata?.address || '',
        });
      }

      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);

  const menuItems: MenuItem[] = [
    { label: 'ภาพรวม', href: '/dashboard', icon: HomeIcon },
    { label: 'การจองของฉัน', href: '/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการโปรด', href: '/dashboard/favorites', icon: HeartIcon },
    { label: 'ประวัติการเงิน', href: '/dashboard/transactions', icon: BanknotesIcon },
    { label: 'โปรไฟล์', href: '/dashboard/profile', icon: UserIcon },
  ];

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: formData.displayName,
          phone: formData.phone,
          address: formData.address,
        }
      });

      if (error) throw error;

      setIsEditing(false);
      alert('บันทึกข้อมูลสำเร็จ!');
    } catch {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="โปรไฟล์"
        headerSubtitle="จัดการข้อมูลส่วนตัวของคุณ"
        roleLabel="ผู้ใช้ทั่วไป"
        roleColor="primary"
        userEmail={user?.email}
        showPartnerButton={true}
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
      headerTitle="โปรไฟล์"
      headerSubtitle="จัดการข้อมูลส่วนตัวของคุณ"
      roleLabel="ผู้ใช้ทั่วไป"
      roleColor="primary"
      userEmail={user?.email}
      showPartnerButton={true}
    >
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">
        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="items-center gap-4 py-8 text-center">
              <Avatar
                size="lg"
                classNames={{
                  base: "bg-gradient-to-br from-blue-600 to-blue-700 w-24 h-24",
                }}
              />
              <div>
                <h3 className="mb-1 font-bold text-white text-xl">
                  {formData.displayName || user?.email?.split('@')[0] || 'ผู้ใช้'}
                </h3>
                <p className="mb-3 text-default-400 text-sm">{user?.email}</p>
              </div>
              <div className="space-y-2 w-full">
                <div className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-lg">
                  <span className="text-default-400 text-sm">สถานะบัญชี</span>
                  <span className="font-semibold text-success text-sm">ใช้งานอยู่</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-lg">
                  <span className="text-default-400 text-sm">สมาชิกตั้งแต่</span>
                  <span className="font-mono text-white text-sm">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : '-'}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardHeader className="flex justify-between items-center">
              <h3 className="font-bold text-white text-xl">ข้อมูลส่วนตัว</h3>
              {!isEditing ? (
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<PencilIcon className="w-4 h-4" />}
                  onPress={() => setIsEditing(true)}
                >
                  แก้ไข
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setIsEditing(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    onPress={handleSaveProfile}
                  >
                    บันทึก
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardBody className="gap-4">
              {isEditing ? (
                <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                  <Input
                    label="ชื่อแสดง"
                    placeholder="กรอกชื่อแสดง"
                    value={formData.displayName}
                    onValueChange={(value) => setFormData({ ...formData, displayName: value })}
                    classNames={{
                      input: "text-white",
                      label: "text-default-400",
                    }}
                  />
                  <Input
                    label="อีเมล"
                    type="email"
                    value={user?.email || ''}
                    isReadOnly
                    classNames={{
                      input: "text-white",
                      label: "text-default-400",
                    }}
                  />
                  <Input
                    label="เบอร์โทรศัพท์"
                    placeholder="กรอกเบอร์โทรศัพท์"
                    value={formData.phone}
                    onValueChange={(value) => setFormData({ ...formData, phone: value })}
                    classNames={{
                      input: "text-white",
                      label: "text-default-400",
                    }}
                  />
                  <Input
                    label="ที่อยู่"
                    placeholder="กรอกที่อยู่"
                    value={formData.address}
                    onValueChange={(value) => setFormData({ ...formData, address: value })}
                    className="md:col-span-2"
                    classNames={{
                      input: "text-white",
                      label: "text-default-400",
                    }}
                  />
                </div>
              ) : (
                <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-default-400 text-sm">ชื่อแสดง</p>
                    <p className="text-white">{formData.displayName || '-'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-default-400 text-sm">อีเมล</p>
                    <p className="font-mono text-white">{user?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-default-400 text-sm">เบอร์โทรศัพท์</p>
                    <p className="font-mono text-white">{formData.phone || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="mb-1 text-default-400 text-sm">ที่อยู่</p>
                    <p className="text-white">{formData.address || '-'}</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Security Settings */}
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardHeader className="flex items-center gap-3">
              <ShieldCheckIcon className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-white text-xl">ความปลอดภัย</h3>
            </CardHeader>
            <CardBody className="gap-4">
              <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="mb-1 font-semibold text-white">รหัสผ่าน</p>
                  <p className="text-default-400 text-sm">
                    แก้ไขล่าสุด: {user?.updated_at ? new Date(user.updated_at).toLocaleDateString('th-TH') : '-'}
                  </p>
                </div>
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                >
                  เปลี่ยนรหัสผ่าน
                </Button>
              </div>
              <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 pt-4 border-white/5 border-t">
                <div>
                  <p className="mb-1 font-semibold text-white">การยืนยันตัวตนแบบสองชั้น</p>
                  <p className="text-default-400 text-sm">
                    เพิ่มความปลอดภัยให้กับบัญชีของคุณ
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="flat"
                >
                  เปิดใช้งาน
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Danger Zone */}
          <Card className="border-danger/30 bg-danger/5 backdrop-blur-sm border">
            <CardHeader>
              <h3 className="font-bold text-danger text-xl">โซนอันตราย</h3>
            </CardHeader>
            <CardBody className="gap-4">
              <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="mb-1 font-semibold text-white">ลบบัญชี</p>
                  <p className="text-default-400 text-sm">
                    การดำเนินการนี้ไม่สามารถย้อนกลับได้
                  </p>
                </div>
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                >
                  ลบบัญชี
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ProfilePage() {
  return (
    <RoleGuard allowedRole="authenticated">
      <ProfileContent />
    </RoleGuard>
  );
}
