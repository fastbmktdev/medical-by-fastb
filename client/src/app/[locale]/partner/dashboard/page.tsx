"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@shared/lib/database/supabase/client";
import { RoleGuard } from "@/components/features/auth";
import {
  DashboardLayout,
  ResponsiveTable,
  type MenuItem,
} from "@/components/shared";
import type { ResponsiveTableColumn } from "@/components/shared";
import { ConfirmationModal } from "@/components/compositions/modals/ConfirmationModal";
import { Link } from "@/navigation";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  CheckIcon,
  PencilIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  BanknotesIcon,
  DocumentTextIcon,
  HomeIcon,
  SparklesIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  MegaphoneIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { Toaster, toast } from "react-hot-toast";
import type {
  hospital,
  HospitalPackage,
  appointment,
} from "@shared/types/database.types";
import { CustomInput, CustomTextarea, CustomSelect } from "@/components/shared";
import {
  validatePackageType,
  validateDurationMonths,
  validatePrice,
} from "@shared/lib/utils/validation";
import { Loading } from "@/components/design-system/primitives/Loading";

interface PackageFormData {
  package_type: "one_time" | "package" | "";
  name: string;
  name_english: string;
  description: string;
  price: string;
  duration_months: number | null;
  features: string[];
}

interface TransactionSummary {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  status: appointment["status"];
}

/**
 * Partner Dashboard
 *
 * Dashboard for hospital partners (partner role)
 * Shows hospital statistics, appointments, revenue, and hospital management
 */
function PartnerDashboardContent() {
  const supabase = createClient();
  const [hospital, setHospital] = useState<hospital | null>(null);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    hospital_name: "",
    contact_name: "",
    phone: "",
    email: "",
    location: "",
    hospital_details: "",
  });

  // Package management states
  const [packages, setPackages] = useState<HospitalPackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<HospitalPackage | null>(
    null
  );
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Delete confirmation modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] =
    useState<HospitalPackage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Real data states
  const [recentBookings, setRecentBookings] = useState<appointment[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<
    TransactionSummary[]
  >([]);
  const [formData, setFormData] = useState<PackageFormData>({
    package_type: "",
    name: "",
    name_english: "",
    description: "",
    price: "",
    duration_months: null,
    features: [],
  });
  const [featureInput, setFeatureInput] = useState("");
  const [packageErrors, setPackageErrors] = useState<Record<string, string>>(
    {}
  );

  const loadPackages = useCallback(async () => {
    try {
      const response = await fetch("/api/partner/packages");
      const result = await response.json();

      if (result.success) {
        setPackages(result.data.packages);
      }
    } catch (error) {
      // Error loading packages
    }
  }, []);

  // Load appointments for partner's hospital
  const loadBookings = useCallback(
    async (hospitalId: string) => {
      try {
        const { data: bookingsData } = await supabase
          .from("appointments")
          .select("*")
          .eq("hospital_id", hospitalId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (bookingsData) {
          setRecentBookings(bookingsData);

          // Use appointments with payment_status=paid as transactions
          const paidBookings: TransactionSummary[] = bookingsData
            .filter((b: appointment) => b.payment_status === "paid")
            .map((b: appointment) => ({
              id: b.booking_number,
              date: b.created_at,
              type: "รายได้",
              description: `การจอง ${b.package_name} - ${b.customer_name}`,
              amount: Number(b.price_paid || 0),
              status: b.status, // b.status is already typed as 'pending' | 'confirmed' | 'cancelled' | 'completed'
            }));

          setRecentTransactions(paidBookings.slice(0, 5));
        }
      } catch (error) {
        console.error("Error loading appointments:", error);
      }
    },
    [supabase]
  );

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

          // Load packages
          await loadPackages();

          // Load appointments and transactions for this hospital
          await loadBookings(hospitalData.id);
        }
      }

      setIsLoading(false);
    }
    loadData();
  }, [supabase, loadPackages, loadBookings]);

  const resetForm = () => {
    setFormData({
      package_type: "",
      name: "",
      name_english: "",
      description: "",
      price: "",
      duration_months: null,
      features: [],
    });
    setFeatureInput("");
    setEditingPackage(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    onOpen();
  };

  const handleOpenEdit = (pkg: HospitalPackage) => {
    setEditingPackage(pkg);
    setFormData({
      package_type: pkg.package_type,
      name: pkg.name,
      name_english: pkg.name_english || "",
      description: pkg.description || "",
      price: pkg.price.toString(),
      duration_months: pkg.duration_months ?? null,
      features: pkg.features || [],
    });
    onOpen();
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitPackage = async () => {
    // Validate form
    const newErrors: Record<string, string> = {};

    // Validate package type
    const typeError = validatePackageType(formData.package_type);
    if (typeError) newErrors.package_type = typeError;

    // Validate name
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = "ชื่อแพ็คเกจต้องมีอย่างน้อย 3 ตัวอักษร";
    }

    // Validate price
    const priceError = validatePrice(formData.price);
    if (priceError) newErrors.price = priceError;

    // Validate duration months for package type
    if (formData.package_type === "package") {
      const durationError = validateDurationMonths(
        formData.duration_months,
        true
      );
      if (durationError) newErrors.duration_months = durationError;
    }

    setPackageErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("กรุณากรอกข้อมูลให้ถูกต้อง");
      return;
    }

    try {
      const url = editingPackage
        ? `/api/partner/packages/${editingPackage.id}`
        : "/api/partner/packages";

      const method = editingPackage ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_type: formData.package_type,
          name: formData.name,
          name_english: formData.name_english || null,
          description: formData.description || null,
          price: parseFloat(formData.price),
          duration_months:
            formData.package_type === "package"
              ? formData.duration_months
              : null,
          features: formData.features,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        loadPackages();
        onClose();
        resetForm();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      // Error saving package
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleToggleActive = async (pkg: HospitalPackage) => {
    try {
      const response = await fetch(`/api/partner/packages/${pkg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !pkg.is_active }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          pkg.is_active ? "ปิดการใช้งานแพ็คเกจแล้ว" : "เปิดใช้งานแพ็คเกจแล้ว"
        );
        loadPackages();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      // Error toggling package
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleDeletePackage = (pkg: HospitalPackage) => {
    setPackageToDelete(pkg);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePackage = async () => {
    if (!packageToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/partner/packages/${packageToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("ลบแพ็คเกจสำเร็จ");
        loadPackages();
        setIsDeleteModalOpen(false);
        setPackageToDelete(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      // Error deleting package
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeletePackage = () => {
    setIsDeleteModalOpen(false);
    setPackageToDelete(null);
  };

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
      toast.success("บันทึกข้อมูลสำเร็จ!");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  // Menu items for sidebar
  const menuItems: MenuItem[] = [
    { label: "Dashboard", href: "/partner/dashboard", icon: HomeIcon },
    {
      label: "ข้อมูลโรงพยาบาล",
      href: "/partner/dashboard/hospital",
      icon: BuildingStorefrontIcon,
    },
    {
      label: "โปรโมชั่น",
      href: "/partner/dashboard/promotions",
      icon: MegaphoneIcon,
    },
    {
      label: "รายการจอง",
      href: "/partner/dashboard/appointments",
      icon: CalendarIcon,
    },
    {
      label: "ข้อความ",
      href: "/partner/dashboard/messages",
      icon: ChatBubbleLeftIcon,
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
  ];

  const oneTimePackages = packages.filter((p) => p.package_type === "one_time");
  const subscriptionPackages = packages.filter(
    (p) => p.package_type === "package"
  );

  const getStatusChip = (status?: string) => {
    const statusConfig = {
      pending: { label: "รอการตรวจสอบ", color: "warning" as const },
      approved: { label: "อนุมัติแล้ว", color: "success" as const },
      rejected: { label: "ไม่อนุมัติ", color: "danger" as const },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Chip color={config.color} variant="flat" size="lg">
        {config.label}
      </Chip>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle={hospital?.hospital_name || "แดชบอร์ดพาร์ทเนอร์"}
        headerSubtitle="จัดการโรงพยาบาลและดูสถิติของคุณ"
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
        headerTitle="แดชบอร์ดพาร์ทเนอร์"
        headerSubtitle="จัดการโรงพยาบาลและดูสถิติของคุณ"
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody className="py-16 text-center">
            <BuildingStorefrontIcon className="mx-auto mb-6 w-20 h-20 text-default-300" />
            <h2 className="mb-4 font-bold text-2xl">ยังไม่มีข้อมูลโรงพยาบาล</h2>
            <p className="mx-auto mb-8 max-w-md text-default-400 text-xl">
              เริ่มต้นสมัครเป็นพาร์ทเนอร์กับเราเพื่อเข้าถึงฐานลูกค้าที่กว้างขึ้น
            </p>
            <Button
              as={Link}
              href="/partner/apply"
              color="secondary"
              size="lg"
              startContent={<BuildingStorefrontIcon className="w-6 h-6" />}
              className="font-bold"
            >
              สมัครเป็นพาร์ทเนอร์
            </Button>
          </CardBody>
        </Card>
      </DashboardLayout>
    );
  }

  // Show pending status UI (no sidebar, centered content)
  if (hospital.status === "pending") {
    return (
      <DashboardLayout
        menuItems={[]}
        headerTitle="สถานะการสมัคร"
        headerSubtitle="รอการตรวจสอบจากทีมงาน"
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
        hideSidebar={true}
      >
        <div className="mx-auto max-w-4xl">
          <div className="space-y-6">
            {/* Status Header */}
            <div className="bg-linear-to-br from-yellow-900/20 to-zinc-800 p-8 border border-yellow-600  text-center">
              <div className="flex justify-center mb-4">
                <ClockIcon className="w-20 h-20 text-yellow-500 animate-pulse" />
              </div>
              <h1 className="mb-2 font-bold text-3xl">รอการตรวจสอบ</h1>
              <p className="mt-2 text-zinc-300 text-lg">
                ทีมงานกำลังตรวจสอบข้อมูลของคุณ กรุณารอการติดต่อกลับภายใน 3-5
                วันทำการ
              </p>
            </div>

            {/* hospital Information */}
            <div className="space-y-4 bg-zinc-100 p-6 ">
              <h2 className="mb-4 font-semibold text-xl">ข้อมูลที่ส่งมา</h2>

              <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                <div>
                  <p className="text-zinc-400 text-sm">ชื่อโรงพยาบาล</p>
                  <p className="font-medium text-white">
                    {hospital.hospital_name}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">ผู้ติดต่อ</p>
                  <p className="font-medium text-white">
                    {hospital.contact_name}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">เบอร์โทรศัพท์</p>
                  <p className="font-mono font-medium text-white">
                    {hospital.phone}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">อีเมล</p>
                  <p className="font-mono font-medium text-white">
                    {hospital.email}
                  </p>
                </div>
                {hospital.location && (
                  <div className="md:col-span-2">
                    <p className="text-zinc-400 text-sm">ที่อยู่</p>
                    <p className="font-medium text-white">
                      {hospital.location}
                    </p>
                  </div>
                )}
              </div>

              {hospital.services && hospital.services.length > 0 && (
                <div>
                  <p className="mb-2 text-zinc-400 text-sm">บริการ</p>
                  <div className="flex flex-wrap gap-2">
                    {hospital.services.map((service, index) => (
                      <span
                        key={index}
                        className="bg-purple-600/20 px-3 py-1 border border-purple-500  text-purple-400 text-sm"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hospital.images && hospital.images.length > 0 && (
                <div>
                  <p className="mb-2 text-zinc-400 text-sm">รูปภาพ</p>
                  <div className="gap-3 grid grid-cols-2 md:grid-cols-4">
                    {hospital.images.map((image, index) => (
                      <div key={index} className="relative w-full h-24">
                        <Image
                          src={image}
                          alt={`hospital image ${index + 1}`}
                          fill
                          sizes="100%"
                          className=" object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button as={Link} href="/" variant="bordered" size="lg">
                กลับหน้าหลัก
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle={hospital.hospital_name}
      headerSubtitle="จัดการโรงพยาบาลและดูสถิติของคุณ"
      roleLabel="พาร์ทเนอร์"
      roleColor="secondary"
      userEmail={user?.email}
    >
      <Toaster />
      {/* Status & Quick Actions */}
      <section className="mb-8">
        <div className="flex sm:flex-row flex-col justify-between items-start gap-4 mb-6">
          <div>
            <h2 className="mb-2 font-bold text-2xl">สถานะโรงพยาบาล</h2>
            {getStatusChip(hospital.status)}
          </div>
          <div className="flex gap-3">
            <Button
              as={Link}
              href={`/hospitals/${hospital.id}`}
              variant="bordered"
              startContent={<EyeIcon className="w-5 h-5" />}
            >
              ดูหน้าโรงพยาบาล
            </Button>
          </div>
        </div>
      </section>

      {/* hospital Information */}
      <section className="mb-8">
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardHeader className="flex justify-between items-center">
            <h3 className="font-bold text-xl">ข้อมูลโรงพยาบาล</h3>
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
                  onPress={() => setIsEditing(false)}
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
                <CustomInput
                  id="hospital_name"
                  name="hospital_name"
                  label="ชื่อโรงพยาบาล"
                  value={editFormData.hospital_name}
                  onChange={(value) =>
                    setEditFormData({
                      ...editFormData,
                      hospital_name: String(value),
                    })
                  }
                />
                <CustomInput
                  id="contact_name"
                  name="contact_name"
                  label="ผู้ติดต่อ"
                  value={editFormData.contact_name}
                  onChange={(value) =>
                    setEditFormData({
                      ...editFormData,
                      contact_name: String(value),
                    })
                  }
                />
                <CustomInput
                  id="phone"
                  name="phone"
                  label="โทรศัพท์"
                  value={editFormData.phone}
                  onChange={(value) =>
                    setEditFormData({ ...editFormData, phone: String(value) })
                  }
                />
                <CustomInput
                  id="email"
                  name="email"
                  label="อีเมล"
                  type="email"
                  value={editFormData.email}
                  onChange={(value) =>
                    setEditFormData({ ...editFormData, email: String(value) })
                  }
                />
                <CustomTextarea
                  id="location"
                  name="location"
                  label="ที่อยู่"
                  value={editFormData.location}
                  onChange={(value) =>
                    setEditFormData({
                      ...editFormData,
                      location: String(value),
                    })
                  }
                  className="md:col-span-2"
                />
                <CustomTextarea
                  id="hospital_details"
                  name="hospital_details"
                  label="รายละเอียดโรงพยาบาล"
                  value={editFormData.hospital_details || ""}
                  onChange={(value) =>
                    setEditFormData({
                      ...editFormData,
                      hospital_details: String(value),
                    })
                  }
                  className="md:col-span-2"
                />
              </div>
            ) : (
              <>
                <div className="gap-8 grid grid-cols-1 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <h4 className="mb-1 font-semibold text-sm">
                        ชื่อโรงพยาบาล
                      </h4>
                      <p className="text-default-400">
                        {hospital.hospital_name}
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-sm">ผู้ติดต่อ</h4>
                      <p className="text-default-400">
                        {hospital.contact_name}
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-sm">โทรศัพท์</h4>
                      <p className="font-mono text-default-400">
                        {hospital.phone}
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-sm">อีเมล</h4>
                      <p className="font-mono text-default-400">
                        {hospital.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="mb-1 font-semibold text-sm">ที่อยู่</h4>
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
                  </div>
                </div>

                {hospital.images && hospital.images.length > 0 && (
                  <div className="mt-6">
                    <h4 className="mb-4 font-semibold text-white">รูปภาพ</h4>
                    <div className="gap-4 grid grid-cols-2 md:grid-cols-4">
                      {hospital.images.map((image, idx) => (
                        <div
                          key={idx}
                          className="relative  w-full h-32 overflow-hidden"
                        >
                          <Image
                            src={image}
                            alt={`hospital image ${idx + 1}`}
                            fill
                            sizes="100%"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </section>

      {/* Package Management */}
      <section className="mb-8">
        <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="font-bold text-2xl">จัดการแพ็คเกจและราคา</h2>
            <p className="text-zinc-400 text-sm">
              ตั้งค่าแพ็คเกจสำหรับลูกค้าจอง
            </p>
          </div>
          <Button
            color="secondary"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={handleOpenCreate}
          >
            สร้างแพ็คเกจใหม่
          </Button>
        </div>

        {/* One-time Packages */}
        {oneTimePackages.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-4 font-semibold text-zinc-300 text-lg">
              รายครั้ง
            </h3>
            <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
              {oneTimePackages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className="bg-zinc-100/50 border border-zinc-700"
                >
                  <CardHeader className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{pkg.name}</h4>
                      {pkg.name_english && (
                        <p className="text-zinc-400 text-sm">
                          {pkg.name_english}
                        </p>
                      )}
                    </div>
                    <Chip
                      color={pkg.is_active ? "success" : "default"}
                      variant="flat"
                      size="sm"
                    >
                      {pkg.is_active ? "เปิด" : "ปิด"}
                    </Chip>
                  </CardHeader>
                  <CardBody className="gap-4">
                    <div>
                      <div className="font-bold text-red-500 text-2xl">
                        ฿{pkg.price.toLocaleString()}
                      </div>
                      <div className="text-zinc-400 text-xs">ต่อครั้ง</div>
                    </div>

                    {pkg.description && (
                      <p className="text-zinc-300 text-sm">{pkg.description}</p>
                    )}

                    {pkg.features && pkg.features.length > 0 && (
                      <ul className="space-y-1">
                        {pkg.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-zinc-300 text-xs"
                          >
                            <CheckIcon className="shrink-0 w-3 h-3 text-green-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex gap-2 pt-4 border-zinc-700 border-t">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => handleToggleActive(pkg)}
                        className="flex-1"
                      >
                        {pkg.is_active ? "ปิด" : "เปิด"}
                      </Button>
                      <Button
                        size="sm"
                        color="secondary"
                        variant="flat"
                        isIconOnly
                        onPress={() => handleOpenEdit(pkg)}
                        aria-label="แก้ไขแพ็คเกจ"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        isIconOnly
                        onPress={() => handleDeletePackage(pkg)}
                        aria-label="ลบแพ็คเกจ"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Subscription Packages */}
        {subscriptionPackages.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-4 font-semibold text-zinc-300 text-lg">
              แพ็คเกจรายเดือน
            </h3>
            <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
              {subscriptionPackages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className="bg-linear-to-br from-zinc-800 to-zinc-950 border border-zinc-700"
                >
                  <CardHeader className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="inline-flex justify-center items-center bg-purple-600 mb-2 px-3 py-1  font-semibold text-xs">
                        {pkg.duration_months} เดือน
                      </div>
                      <h4 className="font-bold text-white">{pkg.name}</h4>
                      {pkg.name_english && (
                        <p className="text-zinc-400 text-xs">
                          {pkg.name_english}
                        </p>
                      )}
                    </div>
                    <Chip
                      color={pkg.is_active ? "success" : "default"}
                      variant="flat"
                      size="sm"
                    >
                      {pkg.is_active ? "เปิด" : "ปิด"}
                    </Chip>
                  </CardHeader>
                  <CardBody className="gap-4">
                    <div className="text-center">
                      <div className="font-bold text-purple-500 text-3xl">
                        ฿{pkg.price.toLocaleString()}
                      </div>
                      <div className="text-zinc-400 text-xs">
                        (฿
                        {Math.round(
                          pkg.price / (pkg.duration_months || 1)
                        ).toLocaleString()}
                        /เดือน)
                      </div>
                    </div>

                    {pkg.description && (
                      <p className="text-zinc-300 text-sm text-center">
                        {pkg.description}
                      </p>
                    )}

                    {pkg.features && pkg.features.length > 0 && (
                      <ul className="space-y-1">
                        {pkg.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-zinc-300 text-xs"
                          >
                            <CheckIcon className="shrink-0 w-3 h-3 text-green-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex gap-2 pt-4 border-zinc-700 border-t">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => handleToggleActive(pkg)}
                        className="flex-1"
                      >
                        {pkg.is_active ? "ปิด" : "เปิด"}
                      </Button>
                      <Button
                        size="sm"
                        color="secondary"
                        variant="flat"
                        isIconOnly
                        onPress={() => handleOpenEdit(pkg)}
                        aria-label="แก้ไขแพ็คเกจ"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        isIconOnly
                        onPress={() => handleDeletePackage(pkg)}
                        aria-label="ลบแพ็คเกจ"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {packages.length === 0 && (
          <Card className="bg-zinc-100/50 border border-zinc-700">
            <CardBody className="py-12 text-center">
              <SparklesIcon className="mx-auto mb-4 w-12 h-12 text-zinc-600" />
              <h3 className="mb-2 font-bold text-lg">ยังไม่มีแพ็คเกจ</h3>
              <p className="mb-4 text-zinc-400 text-sm">
                สร้างแพ็คเกจแรกของคุณเพื่อให้ลูกค้าสามารถจองได้
              </p>
              <Button
                color="secondary"
                startContent={<PlusIcon className="w-5 h-5" />}
                onPress={handleOpenCreate}
              >
                สร้างแพ็คเกจแรก
              </Button>
            </CardBody>
          </Card>
        )}
      </section>

      {/* Recent appointments */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-2xl">การจองล่าสุด</h2>
          <Button
            as={Link}
            href="/partner/dashboard/appointments"
            size="sm"
            variant="flat"
            color="secondary"
            endContent={<ArrowTrendingUpIcon className="w-4 h-4" />}
          >
            ดูทั้งหมด
          </Button>
        </div>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <ResponsiveTable
              columns={
                [
                  {
                    key: "customer_name",
                    label: "ลูกค้า",
                    render: (appointment) => (
                      <span className="text-white">
                        {appointment.customer_name || "N/A"}
                      </span>
                    ),
                    showOnMobile: true,
                  },
                  {
                    key: "package_name",
                    label: "บริการ",
                    render: (appointment) => (
                      <span className="text-default-400">
                        {appointment.package_name || "N/A"}
                      </span>
                    ),
                    showOnMobile: true,
                  },
                  {
                    key: "start_date",
                    label: "วันที่",
                    render: (appointment) => (
                      <span className="text-default-400">
                        {new Date(appointment.start_date).toLocaleDateString(
                          "th-TH"
                        )}
                      </span>
                    ),
                    showOnMobile: false,
                  },
                  {
                    key: "time",
                    label: "เวลา",
                    render: () => <span className="text-default-400">-</span>,
                    showOnMobile: false,
                  },
                  {
                    key: "status",
                    label: "สถานะ",
                    render: (appointment) => (
                      <Chip
                        size="sm"
                        color={
                          appointment.status === "confirmed"
                            ? "success"
                            : "warning"
                        }
                        variant="flat"
                      >
                        {appointment.status === "confirmed"
                          ? "ยืนยันแล้ว"
                          : "รอยืนยัน"}
                      </Chip>
                    ),
                    showOnMobile: true,
                  },
                  {
                    key: "price_paid",
                    label: "ยอดเงิน",
                    render: (appointment) => (
                      <span className="font-mono text-white">
                        ฿{Number(appointment.price_paid || 0).toLocaleString()}
                      </span>
                    ),
                    showOnMobile: true,
                  },
                ] as ResponsiveTableColumn<appointment>[]
              }
              data={recentBookings}
              keyExtractor={(appointment) => appointment.id}
              emptyContent="ยังไม่มีการจอง"
              ariaLabel="Recent appointments table"
            />
          </CardBody>
        </Card>
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-2xl">ธุรกรรมล่าสุด</h2>
          <Button
            as={Link}
            href="/partner/dashboard/transactions"
            size="sm"
            variant="flat"
            color="secondary"
            endContent={<DocumentTextIcon className="w-4 h-4" />}
          >
            ดาวน์โหลดรายงาน
          </Button>
        </div>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <ResponsiveTable
              columns={
                [
                  {
                    key: "id",
                    label: "รหัส",
                    render: (txn) => (
                      <span className="font-mono text-white">{txn.id}</span>
                    ),
                    showOnMobile: true,
                  },
                  {
                    key: "date",
                    label: "วันที่",
                    render: (txn) => (
                      <span className="text-default-400">
                        {new Date(txn.date).toLocaleDateString("th-TH")}
                      </span>
                    ),
                    showOnMobile: false,
                  },
                  {
                    key: "type",
                    label: "ประเภท",
                    render: (txn) => (
                      <Chip
                        size="sm"
                        color={txn.type === "รายได้" ? "success" : "warning"}
                        variant="flat"
                      >
                        {txn.type}
                      </Chip>
                    ),
                    showOnMobile: true,
                  },
                  {
                    key: "description",
                    label: "รายละเอียด",
                    render: (txn) => (
                      <span className="text-default-400">
                        {txn.description}
                      </span>
                    ),
                    showOnMobile: false,
                  },
                  {
                    key: "amount",
                    label: "จำนวนเงิน",
                    render: (txn) => (
                      <span className="font-mono font-bold text-success">
                        +฿{Number(txn.amount || 0).toLocaleString()}
                      </span>
                    ),
                    showOnMobile: true,
                  },
                  {
                    key: "status",
                    label: "สถานะ",
                    render: (txn) => (
                      <Chip
                        size="sm"
                        color={
                          txn.status === "confirmed" ||
                          txn.status === "completed"
                            ? "success"
                            : "warning"
                        }
                        variant="flat"
                        startContent={
                          txn.status === "confirmed" ||
                          txn.status === "completed" ? (
                            <CheckCircleIcon className="w-3 h-3" />
                          ) : (
                            <ClockIcon className="w-3 h-3" />
                          )
                        }
                      >
                        {txn.status === "confirmed" ||
                        txn.status === "completed"
                          ? "สำเร็จ"
                          : "รอดำเนินการ"}
                      </Chip>
                    ),
                    showOnMobile: true,
                  },
                ] as ResponsiveTableColumn<TransactionSummary>[]
              }
              data={recentTransactions}
              keyExtractor={(txn) => txn.id}
              emptyContent="ยังไม่มีธุรกรรม"
              ariaLabel="Recent transactions table"
            />
          </CardBody>
        </Card>
      </section>

      {/* Package Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          resetForm();
        }}
        size="2xl"
        scrollBehavior="inside"
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          wrapper: "z-[100]",
        }}
      >
        <ModalContent className="bg-zinc-100 border border-zinc-700">
          <ModalHeader className="text-white">
            {editingPackage ? "แก้ไขแพ็คเกจ" : "สร้างแพ็คเกจใหม่"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Package Type */}
              <CustomSelect
                id="package_type"
                name="package_type"
                label="ประเภทแพ็คเกจ"
                value={formData.package_type}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    package_type: String(value) as "one_time" | "package",
                    duration_months: null,
                  }))
                }
                required
                disabled={!!editingPackage}
                error={packageErrors.package_type}
              >
                <option value="" disabled>
                  เลือกประเภท
                </option>
                <option value="one_time">รายครั้ง</option>
                <option value="package">แพ็คเกจรายเดือน</option>
              </CustomSelect>

              {/* Duration (for packages only) */}
              {formData.package_type === "package" && (
                <CustomSelect
                  id="duration_months"
                  name="duration_months"
                  label="ระยะเวลา"
                  value={formData.duration_months?.toString() || ""}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration_months: parseInt(String(value)),
                    }))
                  }
                  required
                  error={packageErrors.duration_months}
                >
                  <option value="" disabled>
                    เลือกระยะเวลา
                  </option>
                  <option value="1">1 เดือน</option>
                  <option value="3">3 เดือน</option>
                  <option value="6">6 เดือน</option>
                </CustomSelect>
              )}

              {/* Name */}
              <CustomInput
                id="name"
                name="name"
                label="ชื่อแพ็คเกจ (ภาษาไทย)"
                placeholder="เช่น: ฝึกรายครั้ง, แพ็คเกจ 3 เดือน"
                value={formData.name}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, name: String(value) }))
                }
                required
                error={packageErrors.name}
              />

              {/* Name English */}
              <CustomInput
                id="name_english"
                name="name_english"
                label="ชื่อแพ็คเกจ (ภาษาอังกฤษ)"
                placeholder="เช่น: Single Session, 3 Months Package"
                value={formData.name_english}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    name_english: String(value),
                  }))
                }
              />

              {/* Price */}
              <CustomInput
                id="price"
                name="price"
                type="number"
                label="ราคา (บาท)"
                placeholder="0"
                value={formData.price}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, price: String(value) }))
                }
                required
                error={packageErrors.price}
              />

              {/* Description */}
              <CustomTextarea
                id="description"
                name="description"
                label="รายละเอียด"
                placeholder="อธิบายรายละเอียดแพ็คเกจ..."
                value={formData.description}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: String(value),
                  }))
                }
                rows={3}
              />

              {/* Features */}
              <div>
                <label className="block mb-2 font-medium text-zinc-200 text-sm">
                  คุณสมบัติ/สิทธิประโยชน์
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="เช่น: ฝึกได้ไม่จำกัด, ใช้อุปกรณ์ฟรี"
                    value={featureInput}
                    onValueChange={setFeatureInput}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                  />
                  <Button color="secondary" onPress={handleAddFeature}>
                    เพิ่ม
                  </Button>
                </div>
                {formData.features.length > 0 && (
                  <div className="space-y-2">
                    {formData.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-zinc-700/50 px-3 py-2 "
                      >
                        <span className=" text-sm">{feature}</span>
                        <Button
                          size="sm"
                          color="danger"
                          variant="light"
                          isIconOnly
                          onPress={() => handleRemoveFeature(idx)}
                          aria-label="ลบฟีเจอร์"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => {
                onClose();
                resetForm();
              }}
            >
              ยกเลิก
            </Button>
            <Button color="secondary" onPress={handleSubmitPackage}>
              {editingPackage ? "บันทึก" : "สร้างแพ็คเกจ"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDeletePackage}
        title="ยืนยันการลบแพ็คเกจ"
        message={`คุณต้องการลบแพ็คเกจ "${packageToDelete?.name}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบแพ็คเกจ"
        cancelText="ยกเลิก"
        confirmVariant="danger"
        onConfirm={confirmDeletePackage}
        loading={isDeleting}
        testId="delete-package-modal"
      />
    </DashboardLayout>
  );
}

export default function PartnerDashboardPage() {
  return (
    <RoleGuard allowedRole="partner">
      <PartnerDashboardContent />
    </RoleGuard>
  );
}