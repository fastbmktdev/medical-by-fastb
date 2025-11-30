"use client";

import { useEffect, useState } from "react";
import { createClient } from "@shared/lib/database/supabase/client";
import { RoleGuard } from "@/components/features/auth";
import { DashboardLayout, type MenuItem } from "@/components/shared";
import { Loading } from "@/components/design-system/primitives/Loading";
import Image from "next/image";
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
} from "@heroui/react";
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
} from "@heroicons/react/24/outline";
import type { hospital } from "@shared/types";
import {
  uploadImages,
  validateFile,
} from "@/app/[locale]/partner/apply/utils/fileUpload";
import { showSuccessToast, showErrorToast } from "@shared/lib/utils";
import { ConfirmationModal } from "@/components/compositions/modals/ConfirmationModal";

function HospitalPageContent() {
  const supabase = createClient();
  const [hospital, setHospital] = useState<hospital | null>(null);
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imageIndexToDelete, setImageIndexToDelete] = useState<number | null>(
    null
  );
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [editFormData, setEditFormData] = useState({
    hospital_name: "",
    contact_name: "",
    phone: "",
    email: "",
    location: "",
    hospital_details: "",
  });

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: hospitalData } = await supabase
          .from("hospitals")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        setHospital(hospitalData);
        if (hospitalData) {
          setEditFormData({
            hospital_name: hospitalData.hospital_name || "",
            contact_name: hospitalData.contact_name || "",
            phone: hospitalData.phone || "",
            email: hospitalData.email || "",
            location: hospitalData.location || "",
            hospital_details: hospitalData.hospital_details || "",
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
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imagePreviewUrls]);

  const handleSaveProfile = async () => {
    if (!hospital) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("hospitals")
        .update(editFormData)
        .eq("id", hospital.id);

      if (error) throw error;

      const { data: updatedHospital } = await supabase
        .from("hospitals")
        .select("*")
        .eq("id", hospital.id)
        .maybeSingle();

      setHospital(updatedHospital);
      setIsEditing(false);
      showSuccessToast("บันทึกข้อมูลสำเร็จ!");
    } catch {
      showErrorToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
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
    e.target.value = ""; // Reset input
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]); // Clean up object URL
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUploadImages = async () => {
    if (!hospital || !user || !user.id || selectedFiles.length === 0) return;

    setIsUploadingImages(true);
    setFileErrors([]);

    try {
      // Upload images to storage
      const uploadedUrls = await uploadImages(supabase, selectedFiles, user.id);

      // Update hospital with new images
      const currentImages = hospital.images || [];
      const updatedImages = [...currentImages, ...uploadedUrls];

      const { error: updateError } = await supabase
        .from("hospitals")
        .update({ images: updatedImages })
        .eq("id", hospital.id);

      if (updateError) throw updateError;

      // Refresh hospital data
      const { data: updatedHospital } = await supabase
        .from("hospitals")
        .select("*")
        .eq("id", hospital.id)
        .maybeSingle();

      setHospital(updatedHospital);

      // Clean up preview URLs
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setImagePreviewUrls([]);
      setShowImageUpload(false);
      showSuccessToast("อัพโหลดรูปภาพสำเร็จ!");
    } catch (error) {
      setFileErrors([
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ",
      ]);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDeleteImageClick = (imageIndex: number) => {
    setImageIndexToDelete(imageIndex);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteImage = async () => {
    if (!hospital || imageIndexToDelete === null) return;

    setIsDeletingImage(true);
    try {
      const updatedImages =
        hospital.images?.filter((_, idx) => idx !== imageIndexToDelete) || [];

      const { error } = await supabase
        .from("hospitals")
        .update({ images: updatedImages })
        .eq("id", hospital.id);

      if (error) throw error;

      // Refresh hospital data
      const { data: updatedHospital } = await supabase
        .from("hospitals")
        .select("*")
        .eq("id", hospital.id)
        .maybeSingle();

      setHospital(updatedHospital);
      showSuccessToast("ลบรูปภาพสำเร็จ!");
      setIsDeleteModalOpen(false);
      setImageIndexToDelete(null);
    } catch (error) {
      showErrorToast("เกิดข้อผิดพลาดในการลบรูปภาพ");
    } finally {
      setIsDeletingImage(false);
    }
  };

  const cancelDeleteImage = () => {
    setIsDeleteModalOpen(false);
    setImageIndexToDelete(null);
  };

  const menuItems: MenuItem[] = [
    {
      label: "ข้อมูลโรงพยาบาล",
      href: "/partner/dashboard/hospital",
      icon: BuildingStorefrontIcon,
    },
    { label: "แกลเลอรี่", href: "/partner/dashboard/gallery", icon: PhotoIcon },
    {
      label: "โปรโมชั่น",
      href: "/partner/dashboard/promotions",
      icon: MegaphoneIcon,
    },
    {
      label: "ประวัติการจอง",
      href: "/partner/dashboard/appointments",
      icon: CalendarIcon,
    },
    {
      label: "รายการธุรกรรม",
      href: "/partner/dashboard/transactions",
      icon: BanknotesIcon,
    },
    {
      label: "การจ่ายเงิน",
      href: "/partner/dashboard/payouts",
      icon: CurrencyDollarIcon,
    },
    {
      label: "สถิติ",
      href: "/partner/dashboard/analytics",
      icon: ChartBarIcon,
    },
    {
      label: "ตั้งค่า",
      href: "/partner/dashboard/settings",
      icon: Cog6ToothIcon,
    },
  ];

  const getStatusChip = (status?: string) => {
    const statusConfig = {
      pending: { label: "รอการตรวจสอบ", color: "warning" as const },
      approved: { label: "อนุมัติแล้ว", color: "success" as const },
      rejected: { label: "ไม่อนุมัติ", color: "danger" as const },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

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
        headerTitle="ข้อมูลโรงพยาบาล"
        headerSubtitle="จัดการข้อมูลโรงพยาบาลของคุณ"
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

  if (!hospital) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="ข้อมูลโรงพยาบาล"
        headerSubtitle="จัดการข้อมูลโรงพยาบาลของคุณ"
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody className="py-16 text-center">
            <BuildingStorefrontIcon className="mx-auto mb-6 w-20 h-20 text-default-300" />
            <h2 className="mb-4 font-semibold text-2xl">ยังไม่มีข้อมูลโรงพยาบาล</h2>
            <p className="mx-auto mb-8 max-w-md text-default-400 text-xl">
              กรุณาสมัครเป็นพาร์ทเนอร์เพื่อเริ่มจัดการโรงพยาบาลของคุณ
            </p>
          </CardBody>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle="ข้อมูลโรงพยาบาล"
      headerSubtitle="จัดการข้อมูลโรงพยาบาลของคุณ"
      roleLabel="พาร์ทเนอร์"
      roleColor="secondary"
      userEmail={user?.email}
    >
      <Tabs color="secondary" className="mb-6">
        <Tab key="info" title="ข้อมูลทั่วไป" />
        <Tab key="images" title="รูปภาพ" />
        <Tab key="services" title="บริการ" />
      </Tabs>

      {/* Hospital Status */}
      <Card className="bg-default-100/50 backdrop-blur-sm mb-6 border-none">
        <CardBody>
          <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4">
            <div>
              <p className="mb-2 text-default-400 text-sm">สถานะโรงพยาบาล</p>
              {getStatusChip(hospital.status)}
            </div>
            {/* <div className="text-right">
              <p className="mb-1 text-default-400 text-sm">ID โรงพยาบาล</p>
              <p className="font-mono text-zinc-950">{hospital.id}</p>
            </div> */}
          </div>
        </CardBody>
      </Card>

      {/* Hospital Information */}
      <Card className="bg-default-100/50 backdrop-blur-sm border-none">
        <CardHeader className="flex justify-between items-center">
          <h3 className="font-semibold text-xl">ข้อมูลโรงพยาบาล</h3>
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
                  if (hospital) {
                    setEditFormData({
                      hospital_name: hospital.hospital_name || "",
                      contact_name: hospital.contact_name || "",
                      phone: hospital.phone || "",
                      email: hospital.email || "",
                      location: hospital.location || "",
                      hospital_details: hospital.hospital_details || "",
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
                {isSaving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardBody className="gap-6">
          {isEditing ? (
            <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
              <Input
                label="ชื่อโรงพยาบาล"
                placeholder="กรอกชื่อโรงพยาบาล"
                value={editFormData.hospital_name}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, hospital_name: value })
                }
                startContent={
                  <BuildingStorefrontIcon className="w-4 h-4 text-default-400" />
                }
                classNames={{
                  input: "text-zinc-950",
                  label: "text-default-400",
                }}
              />
              <Input
                label="ผู้ติดต่อ"
                placeholder="กรอกชื่อผู้ติดต่อ"
                value={editFormData.contact_name}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, contact_name: value })
                }
                classNames={{
                  input: "text-zinc-950",
                  label: "text-default-400",
                }}
              />
              <Input
                label="โทรศัพท์"
                placeholder="กรอกเบอร์โทรศัพท์"
                value={editFormData.phone}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, phone: value })
                }
                startContent={
                  <PhoneIcon className="w-4 h-4 text-default-400" />
                }
                classNames={{
                  input: "text-zinc-950",
                  label: "text-default-400",
                }}
              />
              <Input
                label="อีเมล"
                type="email"
                placeholder="กรอกอีเมล"
                value={editFormData.email}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, email: value })
                }
                startContent={
                  <EnvelopeIcon className="w-4 h-4 text-default-400" />
                }
                classNames={{
                  input: "text-zinc-950",
                  label: "text-default-400",
                }}
              />
              <Input
                label="ที่อยู่"
                placeholder="กรอกที่อยู่โรงพยาบาล"
                value={editFormData.location}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, location: value })
                }
                startContent={
                  <MapPinIcon className="w-4 h-4 text-default-400" />
                }
                className="md:col-span-2"
                classNames={{
                  input: "text-zinc-950",
                  label: "text-default-400",
                }}
              />
              <Textarea
                label="รายละเอียดโรงพยาบาล"
                placeholder="กรอกรายละเอียดเกี่ยวกับโรงพยาบาล"
                value={editFormData.hospital_details || ""}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, hospital_details: value })
                }
                className="md:col-span-2"
                classNames={{
                  input: "text-zinc-950",
                  label: "text-default-400",
                }}
              />
            </div>
          ) : (
            <>
              <div className="gap-8 grid grid-cols-1 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-semibold text-sm">
                      ชื่อโรงพยาบาล
                    </h4>
                    <p className="text-default-400 text-lg">
                      {hospital.hospital_name}
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold text-sm">ผู้ติดต่อ</h4>
                    <p className="text-default-400">{hospital.contact_name}</p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold text-sm">โทรศัพท์</h4>
                    <p className="font-mono text-default-400">
                      {hospital.phone}
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold text-sm">อีเมล</h4>
                    <p className="font-mono text-default-400">
                      {hospital.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-semibold text-sm">ที่อยู่</h4>
                    <p className="text-default-400">{hospital.location}</p>
                  </div>
                  {hospital.services && hospital.services.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold text-sm">บริการ</h4>
                      <div className="flex flex-wrap gap-2">
                        {hospital.services.map((service, idx) => (
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
                    <p className="text-default-400">
                      {hospital.hospital_details || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-white/5 border-t">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-zinc-950">รูปภาพโรงพยาบาล</h4>
                  <Button
                    size="sm"
                    color="secondary"
                    variant="flat"
                    startContent={<PhotoIcon className="w-4 h-4" />}
                    onPress={() => setShowImageUpload(!showImageUpload)}
                  >
                    {showImageUpload ? "ยกเลิก" : "อัพโหลดรูปภาพ"}
                  </Button>
                </div>

                {/* Image Upload Section */}
                {showImageUpload && (
                  <Card className="bg-white/5 border border-white/10 mb-4">
                    <CardBody className="space-y-4">
                      <div>
                        <label className="flex flex-col items-center gap-3 bg-white/5 hover:bg-white/10 p-6 border border-white/10 border-dashed  transition-colors cursor-pointer">
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
                              <p
                                key={index}
                                className="flex items-center gap-1 text-red-400 text-sm"
                              >
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
                                <div
                                  key={idx}
                                  className="relative group  w-full h-24 overflow-hidden"
                                >
                                  {imagePreviewUrls[idx] && (
                                    <Image
                                      src={imagePreviewUrls[idx]}
                                      alt={file.name}
                                      fill
                                      sizes="100%"
                                      className="object-cover"
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(idx)}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600  p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <XMarkIcon className="w-4 h-4 text-zinc-950" />
                                  </button>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                    <p className="text-zinc-950 text-xs truncate">
                                      {file.name}
                                    </p>
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
                                isDisabled={
                                  isUploadingImages ||
                                  selectedFiles.length === 0
                                }
                              >
                                {isUploadingImages
                                  ? "กำลังอัพโหลด..."
                                  : "อัพโหลด"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Existing Images */}
                {hospital.images && hospital.images.length > 0 ? (
                  <div className="gap-4 grid grid-cols-2 md:grid-cols-4">
                    {hospital.images.map((image, idx) => (
                      <div
                        key={idx}
                        className="relative group  w-full h-32 overflow-hidden"
                      >
                        <Image
                          src={image}
                          alt={`hospital image ${idx + 1}`}
                          fill
                          sizes="100%"
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteImageClick(idx)}
                          className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600  p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="ลบรูปภาพ"
                        >
                          <TrashIcon className="w-4 h-4 text-zinc-950" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  !showImageUpload && (
                    <Card className="bg-white/5 border border-white/10 border-dashed">
                      <CardBody className="py-12 text-center">
                        <PhotoIcon className="mx-auto mb-4 w-12 h-12 text-default-300" />
                        <p className="mb-4 text-default-400">
                          ยังไม่มีรูปภาพโรงพยาบาล
                        </p>
                      </CardBody>
                    </Card>
                  )
                )}
              </div>
            </>
          )}
        </CardBody>
      </Card>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDeleteImage}
        title="ยืนยันการลบรูปภาพ"
        message="คุณต้องการลบรูปภาพนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบรูปภาพ"
        cancelText="ยกเลิก"
        confirmVariant="danger"
        onConfirm={confirmDeleteImage}
        loading={isDeletingImage}
        testId="delete-hospital-image-modal"
      />
    </DashboardLayout>
  );
}

export default function HospitalPage() {
  return (
    <RoleGuard allowedRole="partner">
      <HospitalPageContent />
    </RoleGuard>
  );
}
