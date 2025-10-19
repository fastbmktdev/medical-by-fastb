"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import Image from 'next/image';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Chip,
  Tabs,
  Tab,
} from '@heroui/react';
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  CalendarIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  PencilIcon,
  PhotoIcon,
  HomeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import type { Gym } from '@/types';

function GymPageContent() {
  const supabase = createClient();
  const [gym, setGym] = useState<Gym | null>(null);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    gym_name: '',
    contact_name: '',
    phone: '',
    email: '',
    location: '',
    gym_details: '',
  });

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: gymData } = await supabase
          .from('gyms')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        setGym(gymData);
        if (gymData) {
          setEditFormData({
            gym_name: gymData.gym_name || '',
            contact_name: gymData.contact_name || '',
            phone: gymData.phone || '',
            email: gymData.email || '',
            location: gymData.location || '',
            gym_details: gymData.gym_details || '',
          });
        }
      }

      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const handleSaveProfile = async () => {
    if (!gym) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('gyms')
        .update(editFormData)
        .eq('id', gym.id);

      if (error) throw error;

      const { data: updatedGym } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', gym.id)
        .maybeSingle();

      setGym(updatedGym);
      setIsEditing(false);
      alert('บันทึกข้อมูลสำเร็จ!');
    } catch {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems: MenuItem[] = [
    { label: 'ข้อมูลยิม', href: '/partner/dashboard/gym', icon: BuildingStorefrontIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'สถิติ', href: '/partner/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่า', href: '/partner/dashboard/settings', icon: Cog6ToothIcon },
  ];

  const getStatusChip = (status?: string) => {
    const statusConfig = {
      pending: { label: 'รอการตรวจสอบ', color: 'warning' as const },
      approved: { label: 'อนุมัติแล้ว', color: 'success' as const },
      rejected: { label: 'ไม่อนุมัติ', color: 'danger' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Chip color={config.color} variant="flat">
        {config.label}
      </Chip>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="ข้อมูลยิม"
        headerSubtitle="จัดการข้อมูลยิมของคุณ"
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

  if (!gym) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="ข้อมูลยิม"
        headerSubtitle="จัดการข้อมูลยิมของคุณ"
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody className="py-16 text-center">
            <BuildingStorefrontIcon className="mx-auto mb-6 w-20 h-20 text-default-300" />
            <h2 className="mb-4 font-bold text-white text-2xl">
              ยังไม่มีข้อมูลยิม
            </h2>
            <p className="mx-auto mb-8 max-w-md text-default-400 text-xl">
              กรุณาสมัครเป็นพาร์ทเนอร์เพื่อเริ่มจัดการยิมของคุณ
            </p>
          </CardBody>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle="ข้อมูลยิม"
      headerSubtitle="จัดการข้อมูลยิมของคุณ"
      roleLabel="พาร์ทเนอร์"
      roleColor="secondary"
      userEmail={user?.email}
    >
      <Tabs color="secondary" className="mb-6">
        <Tab key="info" title="ข้อมูลทั่วไป" />
        <Tab key="images" title="รูปภาพ" />
        <Tab key="services" title="บริการ" />
      </Tabs>

      {/* Gym Status */}
      <Card className="bg-default-100/50 backdrop-blur-sm mb-6 border-none">
        <CardBody>
          <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4">
            <div>
              <p className="mb-2 text-default-400 text-sm">สถานะยิม</p>
              {getStatusChip(gym.status)}
            </div>
            <div className="text-right">
              <p className="mb-1 text-default-400 text-sm">ID ยิม</p>
              <p className="font-mono text-white">{gym.id}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Gym Information */}
      <Card className="bg-default-100/50 backdrop-blur-sm border-none">
        <CardHeader className="flex justify-between items-center">
          <h3 className="font-bold text-white text-xl">ข้อมูลยิม</h3>
          {!isEditing ? (
            <Button
              size="sm"
              color="secondary"
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
                onPress={() => {
                  setIsEditing(false);
                  if (gym) {
                    setEditFormData({
                      gym_name: gym.gym_name || '',
                      contact_name: gym.contact_name || '',
                      phone: gym.phone || '',
                      email: gym.email || '',
                      location: gym.location || '',
                      gym_details: gym.gym_details || '',
                    });
                  }
                }}
              >
                ยกเลิก
              </Button>
              <Button
                size="sm"
                color="secondary"
                onPress={handleSaveProfile}
                isLoading={isSaving}
                isDisabled={isSaving}
              >
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardBody className="gap-6">
          {isEditing ? (
            <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
              <Input
                label="ชื่อยิม"
                placeholder="กรอกชื่อยิม"
                value={editFormData.gym_name}
                onValueChange={(value) => setEditFormData({ ...editFormData, gym_name: value })}
                startContent={<BuildingStorefrontIcon className="w-4 h-4 text-default-400" />}
                classNames={{
                  input: "text-white",
                  label: "text-default-400",
                }}
              />
              <Input
                label="ผู้ติดต่อ"
                placeholder="กรอกชื่อผู้ติดต่อ"
                value={editFormData.contact_name}
                onValueChange={(value) => setEditFormData({ ...editFormData, contact_name: value })}
                classNames={{
                  input: "text-white",
                  label: "text-default-400",
                }}
              />
              <Input
                label="โทรศัพท์"
                placeholder="กรอกเบอร์โทรศัพท์"
                value={editFormData.phone}
                onValueChange={(value) => setEditFormData({ ...editFormData, phone: value })}
                startContent={<PhoneIcon className="w-4 h-4 text-default-400" />}
                classNames={{
                  input: "text-white",
                  label: "text-default-400",
                }}
              />
              <Input
                label="อีเมล"
                type="email"
                placeholder="กรอกอีเมล"
                value={editFormData.email}
                onValueChange={(value) => setEditFormData({ ...editFormData, email: value })}
                startContent={<EnvelopeIcon className="w-4 h-4 text-default-400" />}
                classNames={{
                  input: "text-white",
                  label: "text-default-400",
                }}
              />
              <Input
                label="ที่อยู่"
                placeholder="กรอกที่อยู่ยิม"
                value={editFormData.location}
                onValueChange={(value) => setEditFormData({ ...editFormData, location: value })}
                startContent={<MapPinIcon className="w-4 h-4 text-default-400" />}
                className="md:col-span-2"
                classNames={{
                  input: "text-white",
                  label: "text-default-400",
                }}
              />
              <Textarea
                label="รายละเอียดยิม"
                placeholder="กรอกรายละเอียดเกี่ยวกับยิม"
                value={editFormData.gym_details || ''}
                onValueChange={(value) => setEditFormData({ ...editFormData, gym_details: value })}
                className="md:col-span-2"
                classNames={{
                  input: "text-white",
                  label: "text-default-400",
                }}
              />
            </div>
          ) : (
            <>
              <div className="gap-8 grid grid-cols-1 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-semibold text-white text-sm">ชื่อยิม</h4>
                    <p className="text-default-400 text-lg">{gym.gym_name}</p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold text-white text-sm">ผู้ติดต่อ</h4>
                    <p className="text-default-400">{gym.contact_name}</p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold text-white text-sm">โทรศัพท์</h4>
                    <p className="font-mono text-default-400">{gym.phone}</p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold text-white text-sm">อีเมล</h4>
                    <p className="font-mono text-default-400">{gym.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-semibold text-white text-sm">ที่อยู่</h4>
                    <p className="text-default-400">{gym.location}</p>
                  </div>
                  {gym.services && gym.services.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold text-white text-sm">บริการ</h4>
                      <div className="flex flex-wrap gap-2">
                        {gym.services.map((service, idx) => (
                          <Chip
                            key={idx}
                            color="secondary"
                            variant="flat"
                            size="sm"
                          >
                            {service}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="mb-2 font-semibold text-white text-sm">รายละเอียด</h4>
                    <p className="text-default-400">{gym.gym_details || '-'}</p>
                  </div>
                </div>
              </div>

              {gym.images && gym.images.length > 0 && (
                <div className="pt-6 border-white/5 border-t">
                  <h4 className="mb-4 font-semibold text-white">รูปภาพยิม</h4>
                  <div className="gap-4 grid grid-cols-2 md:grid-cols-4">
                    {gym.images.map((image, idx) => (
                      <div key={idx} className="relative rounded-lg w-full h-32 overflow-hidden">
                        <Image
                          src={image}
                          alt={`Gym image ${idx + 1}`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!gym.images || gym.images.length === 0) && (
                <div className="pt-6 border-white/5 border-t">
                  <Card className="bg-white/5 border border-white/10 border-dashed">
                    <CardBody className="py-12 text-center">
                      <PhotoIcon className="mx-auto mb-4 w-12 h-12 text-default-300" />
                      <p className="mb-4 text-default-400">ยังไม่มีรูปภาพยิม</p>
                      <Button
                        size="sm"
                        color="secondary"
                        variant="flat"
                        startContent={<PhotoIcon className="w-4 h-4" />}
                      >
                        อัพโหลดรูปภาพ
                      </Button>
                    </CardBody>
                  </Card>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}

export default function GymPage() {
  return (
    <RoleGuard allowedRole="partner">
      <GymPageContent />
    </RoleGuard>
  );
}
