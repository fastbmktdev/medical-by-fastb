"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import { Card, CardBody, CardHeader, Button, Input, Chip } from '@heroui/react';
import {
  UserIcon,
  CalendarIcon,
  HeartIcon,
  BanknotesIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import { Toaster, toast } from 'react-hot-toast';
import {
  ProfilePictureUpload,
  BioEditor,
  SocialLinksEditor,
  TrainingGoalsManager,
  TrainingHistoryView,
  AchievementsShowcase,
  PrivacySettingsPanel,
  NotificationPreferencesPanel,
  AccountDeletionDialog,
} from '@/components/features/profile';

function ProfileContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
        // Load user profile data from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();

        setFormData({
          displayName: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.display_name || '',
          phone: profile?.phone || user.user_metadata?.phone || '',
          address: user.user_metadata?.address || '',
        });
        
        setAvatarUrl(profile?.avatar_url || user.user_metadata?.avatar_url || null);
      }

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

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.displayName,
          display_name: formData.displayName, // Keep both for compatibility
          phone: formData.phone,
          address: formData.address,
        }
      });

      if (authError) throw authError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.displayName,
          phone: formData.phone,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      setIsEditing(false);
      toast.success('บันทึกข้อมูลสำเร็จ!', {
        duration: 3000,
        position: 'top-center',
      });
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล', {
        duration: 3000,
        position: 'top-center',
      });
    } finally {
      setIsSaving(false);
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
          <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
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
      <Toaster />

      <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">
        {/* Profile Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-gradient-to-br from-zinc-800 to-zinc-950 backdrop-blur-sm border border-zinc-700">
            <CardBody className="items-center gap-4 py-8 text-center">
              <ProfilePictureUpload
                currentAvatarUrl={avatarUrl}
                onUploadSuccess={(newUrl) => setAvatarUrl(newUrl || null)}
              />
              
              <div>
                <h3 className="mb-1 font-bold text-2xl">
                  {formData.displayName || user?.email?.split('@')[0] || 'ผู้ใช้'}
                </h3>
                <p className="mb-3 text-zinc-400 text-sm">{user?.email}</p>
                <Chip
                  color="success"
                  variant="flat"
                  size="sm"
                  startContent={<CheckCircleIcon className="w-3 h-3" />}
                >
                  ใช้งานอยู่
                </Chip>
              </div>

              <div className="space-y-3 pt-4 border-zinc-700 border-t w-full">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-400 text-sm">สมาชิกตั้งแต่</span>
                  </div>
                  <span className="font-semibold text-sm">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                    }) : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-400 text-sm">ประเภทสมาชิก</span>
                  </div>
                  <Chip color="primary" variant="flat" size="sm">
                    ผู้ใช้ทั่วไป
                  </Chip>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Bio Section */}
          <Card className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-700">
            <CardBody>
              <BioEditor />
            </CardBody>
          </Card>

          {/* Social Links */}
          <Card className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-700">
            <CardBody>
              <SocialLinksEditor />
            </CardBody>
          </Card>
        </div>

        {/* Profile Information */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Information */}
          <Card className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-700">
            <CardHeader className="flex justify-between items-center border-zinc-700 border-b">
              <div>
                <h3 className="font-bold text-xl">ข้อมูลส่วนตัว</h3>
                <p className="text-zinc-400 text-sm">จัดการข้อมูลบัญชีของคุณ</p>
              </div>
              {!isEditing ? (
                <Button
                  size="sm"
                  color="primary"
                  variant="shadow"
                  startContent={<PencilIcon className="w-4 h-4" />}
                  onPress={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700"
                >
                  แก้ไข
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setIsEditing(false)}
                    isDisabled={isSaving}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    onPress={handleSaveProfile}
                    isLoading={isSaving}
                    className="bg-gradient-to-r from-green-600 to-green-700"
                  >
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardBody className="gap-6">
              {isEditing ? (
                <div className="space-y-6">
                  <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block font-medium text-sm">
                        ชื่อแสดง <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="กรอกชื่อแสดง"
                        value={formData.displayName}
                        onValueChange={(value) => setFormData({ ...formData, displayName: value })}
                        variant="bordered"
                        size="lg"
                        classNames={{
                          input: "text-white",
                          inputWrapper: "bg-zinc-950/50 border-zinc-700 hover:border-zinc-600 focus-within:border-blue-500",
                        }}
                        startContent={
                          <UserIcon className="flex-shrink-0 w-4 h-4 text-zinc-400" />
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block font-medium text-sm">
                        อีเมล
                      </label>
                      <Input
                        type="email"
                        value={user?.email || ''}
                        isReadOnly
                        variant="bordered"
                        size="lg"
                        classNames={{
                          input: "text-white",
                          inputWrapper: "bg-zinc-950/30 border-zinc-700 cursor-not-allowed",
                        }}
                        startContent={
                          <span className="text-zinc-400">📧</span>
                        }
                      />
                      <p className="text-zinc-500 text-xs">อีเมลไม่สามารถเปลี่ยนแปลงได้</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-medium text-sm">
                      เบอร์โทรศัพท์
                    </label>
                    <Input
                      placeholder="เช่น 081-234-5678"
                      value={formData.phone}
                      onValueChange={(value) => setFormData({ ...formData, phone: value })}
                      variant="bordered"
                      size="lg"
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-zinc-950/50 border-zinc-700 hover:border-zinc-600 focus-within:border-blue-500",
                      }}
                      startContent={
                        <span className="text-zinc-400">📱</span>
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-medium text-sm">
                      ที่อยู่
                    </label>
                    <Input
                      placeholder="กรอกที่อยู่ของคุณ"
                      value={formData.address}
                      onValueChange={(value) => setFormData({ ...formData, address: value })}
                      variant="bordered"
                      size="lg"
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-zinc-950/50 border-zinc-700 hover:border-zinc-600 focus-within:border-blue-500",
                      }}
                      startContent={
                        <span className="text-zinc-400">📍</span>
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                  <div className="bg-zinc-950/50 p-4 rounded-lg">
                    <p className="mb-2 text-zinc-400 text-xs uppercase tracking-wide">ชื่อแสดง</p>
                    <p className="font-semibold text-white">{formData.displayName || '-'}</p>
                  </div>
                  <div className="bg-zinc-950/50 p-4 rounded-lg">
                    <p className="mb-2 text-zinc-400 text-xs uppercase tracking-wide">อีเมล</p>
                    <p className="font-mono text-white">{user?.email || '-'}</p>
                  </div>
                  <div className="bg-zinc-950/50 p-4 rounded-lg">
                    <p className="mb-2 text-zinc-400 text-xs uppercase tracking-wide">เบอร์โทรศัพท์</p>
                    <p className="font-mono text-white">{formData.phone || '-'}</p>
                  </div>
                  <div className="md:col-span-2 bg-zinc-950/50 p-4 rounded-lg">
                    <p className="mb-2 text-zinc-400 text-xs uppercase tracking-wide">ที่อยู่</p>
                    <p className="text-white">{formData.address || '-'}</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Fitness Goals */}
          <Card className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-700">
            <CardBody>
              <TrainingGoalsManager />
            </CardBody>
          </Card>

          {/* Training History */}
          <Card className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-700">
            <CardBody>
              <TrainingHistoryView />
            </CardBody>
          </Card>

          {/* Achievements */}
          <Card className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-700">
            <CardBody>
              <AchievementsShowcase />
            </CardBody>
          </Card>

          {/* Privacy Settings */}
          <PrivacySettingsPanel />

          {/* Notification Preferences */}
          <NotificationPreferencesPanel />

          {/* Danger Zone */}
          <Card className="bg-gradient-to-br from-red-950/50 to-red-900/30 backdrop-blur-sm border border-red-800/50">
            <CardHeader className="border-red-800/50 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-red-600/20 p-2 rounded-lg">
                  <span className="text-red-400 text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="font-bold text-red-400 text-xl">โซนอันตราย</h3>
                  <p className="text-zinc-400 text-sm">ดำเนินการด้วยความระมัดระวัง</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="gap-4">
              <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 bg-red-950/30 hover:bg-red-950/50 p-4 border border-red-800/30 rounded-lg transition-colors">
                <div className="flex-1">
                  <p className="mb-1 font-semibold text-white">ลบบัญชีถาวร</p>
                  <p className="text-zinc-400 text-sm">
                    การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดจะถูกลบอย่างถาวร
                  </p>
                </div>
                <Button
                  size="sm"
                  color="danger"
                  variant="solid"
                  className="min-w-[140px]"
                  onPress={() => setShowDeleteDialog(true)}
                >
                  ลบบัญชี
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Account Deletion Dialog */}
      <AccountDeletionDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
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
