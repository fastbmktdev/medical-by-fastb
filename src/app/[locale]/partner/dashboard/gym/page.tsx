"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import { Loading } from '@/components/design-system/primitives/Loading';
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
  CurrencyDollarIcon,
  Cog6ToothIcon,
  PencilIcon,
  PhotoIcon,
  // HomeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  XMarkIcon,
  TrashIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';
import type { Gym } from '@/types';
import { uploadImages, validateFile } from '@/app/[locale]/partner/apply/utils/fileUpload';
import { showSuccessToast, showErrorToast } from '@/lib/utils';

function GymPageContent() {
  const supabase = createClient();
  const [gym, setGym] = useState<Gym | null>(null);
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
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

  // Cleanup image preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imagePreviewUrls]);

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
      showSuccessToast('บันทึกข้อมูลสำเร็จ!');
    } catch {
      showErrorToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const errors: string[] = [];
    const validFiles: File[] = [];
    const previewUrls: string[] = [];

    files.forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
      } else {
        validFiles.push(file);
        // Create preview URL
        previewUrls.push(URL.createObjectURL(file));
      }
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setImagePreviewUrls((prev) => [...prev, ...previewUrls]);
    setFileErrors(errors);
    e.target.value = ''; // Reset input
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]); // Clean up object URL
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUploadImages = async () => {
    if (!gym || !user || !user.id || selectedFiles.length === 0) return;

    setIsUploadingImages(true);
    setFileErrors([]);

    try {
      // Upload images to storage
      const uploadedUrls = await uploadImages(supabase, selectedFiles, user.id);

      // Update gym with new images
      const currentImages = gym.images || [];
      const updatedImages = [...currentImages, ...uploadedUrls];

      const { error: updateError } = await supabase
        .from('gyms')
        .update({ images: updatedImages })
        .eq('id', gym.id);

      if (updateError) throw updateError;

      // Refresh gym data
      const { data: updatedGym } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', gym.id)
        .maybeSingle();

      setGym(updatedGym);
      
      // Clean up preview URLs
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setImagePreviewUrls([]);
      setShowImageUpload(false);
      showSuccessToast('อัพโหลดรูปภาพสำเร็จ!');
    } catch (error) {
      setFileErrors([
        error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ',
      ]);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageIndex: number) => {
    if (!gym || !confirm('คุณแน่ใจว่าต้องการลบรูปภาพนี้?')) return;

    try {
      const updatedImages = gym.images?.filter((_, idx) => idx !== imageIndex) || [];

      const { error } = await supabase
        .from('gyms')
        .update({ images: updatedImages })
        .eq('id', gym.id);

      if (error) throw error;

      // Refresh gym data
      const { data: updatedGym } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', gym.id)
        .maybeSingle();

      setGym(updatedGym);
      showSuccessToast('ลบรูปภาพสำเร็จ!');
    } catch (error) {
      showErrorToast('เกิดข้อผิดพลาดในการลบรูปภาพ');
    }
  };

  const menuItems: MenuItem[] = [
    { label: 'ข้อมูลยิม', href: '/partner/dashboard/gym', icon: BuildingStorefrontIcon },
    { label: 'โปรโมชั่น', href: '/partner/dashboard/promotions', icon: MegaphoneIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'การจ่ายเงิน', href: '/partner/dashboard/payouts', icon: CurrencyDollarIcon },
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
          <Loading centered size="xl" />
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
            <h2 className="mb-4 font-bold text-2xl">
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
            {/* <div className="text-right">
              <p className="mb-1 text-default-400 text-sm">ID ยิม</p>
              <p className="font-mono text-white">{gym.id}</p>
            </div> */}
          </div>
        </CardBody>
      </Card>

      {/* Gym Information */}
      <Card className="bg-default-100/50 backdrop-blur-sm border-none">
        <CardHeader className="flex justify-between items-center">
          <h3 className="font-bold text-xl">ข้อมูลยิม</h3>
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
                    <h4 className="mb-2 font-semibold text-sm">ชื่อยิม</h4>
                    <p className="text-default-400 text-lg">{gym.gym_name}</p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold text-sm">ผู้ติดต่อ</h4>
                    <p className="text-default-400">{gym.contact_name}</p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold text-sm">โทรศัพท์</h4>
                    <p className="font-mono text-default-400">{gym.phone}</p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold text-sm">อีเมล</h4>
                    <p className="font-mono text-default-400">{gym.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-semibold text-sm">ที่อยู่</h4>
                    <p className="text-default-400">{gym.location}</p>
                  </div>
                  {gym.services && gym.services.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold text-sm">บริการ</h4>
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
                    <h4 className="mb-2 font-semibold text-sm">รายละเอียด</h4>
                    <p className="text-default-400">{gym.gym_details || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-white/5 border-t">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-white">รูปภาพยิม</h4>
                  <Button
                    size="sm"
                    color="secondary"
                    variant="flat"
                    startContent={<PhotoIcon className="w-4 h-4" />}
                    onPress={() => setShowImageUpload(!showImageUpload)}
                  >
                    {showImageUpload ? 'ยกเลิก' : 'อัพโหลดรูปภาพ'}
                  </Button>
                </div>

                {/* Image Upload Section */}
                {showImageUpload && (
                  <Card className="bg-white/5 border border-white/10 mb-4">
                    <CardBody className="space-y-4">
                      <div>
                        <label className="flex flex-col items-center gap-3 bg-white/5 hover:bg-white/10 p-6 border border-white/10 border-dashed rounded-lg transition-colors cursor-pointer">
                          <PhotoIcon className="w-12 h-12 text-default-400" />
                          <span className="text-default-300 text-sm">
                            คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง
                          </span>
                          <span className="text-default-500 text-xs">
                            รองรับไฟล์: JPG, PNG (ขนาดไม่เกิน 5MB ต่อไฟล์)
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>

                        {/* File Errors */}
                        {fileErrors.length > 0 && (
                          <div className="space-y-1 mt-3">
                            {fileErrors.map((error, index) => (
                              <p key={index} className="flex items-center gap-1 text-red-400 text-sm">
                                <XMarkIcon className="w-4 h-4" />
                                {error}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Selected Files Preview */}
                        {selectedFiles.length > 0 && (
                          <div className="mt-4">
                            <p className="mb-3 text-default-400 text-sm">
                              ไฟล์ที่เลือก ({selectedFiles.length} ไฟล์)
                            </p>
                            <div className="gap-3 grid grid-cols-2 md:grid-cols-4">
                              {selectedFiles.map((file, idx) => (
                                <div key={idx} className="relative group rounded-lg w-full h-24 overflow-hidden">
                                  {imagePreviewUrls[idx] && (
                                    <Image
                                      src={imagePreviewUrls[idx]}
                                      alt={file.name}
                                      fill
                                      sizes='100%'
                                      className="object-cover"
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(idx)}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <XMarkIcon className="w-4 h-4 text-white" />
                                  </button>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                    <p className="text-white text-xs truncate">{file.name}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="flat"
                                onPress={() => {
                                  setSelectedFiles([]);
                                  setImagePreviewUrls([]);
                                  setFileErrors([]);
                                  setShowImageUpload(false);
                                }}
                              >
                                ยกเลิก
                              </Button>
                              <Button
                                size="sm"
                                color="secondary"
                                onPress={handleUploadImages}
                                isLoading={isUploadingImages}
                                isDisabled={isUploadingImages || selectedFiles.length === 0}
                              >
                                {isUploadingImages ? 'กำลังอัพโหลด...' : 'อัพโหลด'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Existing Images */}
                {gym.images && gym.images.length > 0 ? (
                  <div className="gap-4 grid grid-cols-2 md:grid-cols-4">
                    {gym.images.map((image, idx) => (
                      <div key={idx} className="relative group rounded-lg w-full h-32 overflow-hidden">
                        <Image
                          src={image}
                          alt={`Gym image ${idx + 1}`}
                          fill
                          sizes='100%'
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(idx)}
                          className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="ลบรูปภาพ"
                        >
                          <TrashIcon className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  !showImageUpload && (
                    <Card className="bg-white/5 border border-white/10 border-dashed">
                      <CardBody className="py-12 text-center">
                        <PhotoIcon className="mx-auto mb-4 w-12 h-12 text-default-300" />
                        <p className="mb-4 text-default-400">ยังไม่มีรูปภาพยิม</p>
                      </CardBody>
                    </Card>
                  )
                )}
              </div>
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
