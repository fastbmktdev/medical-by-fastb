"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  UsersIcon,
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
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import type { Gym, GymPackage } from '@/types/database.types';
import { CustomInput } from '@/components/shared/CustomInput';
import { CustomTextarea } from '@/components/shared/CustomTextarea';
import { CustomSelect } from '@/components/shared/CustomSelect';

interface PackageFormData {
  package_type: 'one_time' | 'package' | '';
  name: string;
  name_english: string;
  description: string;
  price: string;
  duration_months: number | null;
  features: string[];
}

/**
 * Partner Dashboard
 * 
 * Dashboard for gym partners (partner role)
 * Shows gym statistics, bookings, revenue, and gym management
 */
function PartnerDashboardContent() {
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

  // Package management states
  const [packages, setPackages] = useState<GymPackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<GymPackage | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState<PackageFormData>({
    package_type: '',
    name: '',
    name_english: '',
    description: '',
    price: '',
    duration_months: null,
    features: [],
  });
  const [featureInput, setFeatureInput] = useState('');

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
          
          // Load packages
          loadPackages();
        }
      }

      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const loadPackages = async () => {
    try {
      const response = await fetch('/api/partner/packages');
      const result = await response.json();

      if (result.success) {
        setPackages(result.data.packages);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      package_type: '',
      name: '',
      name_english: '',
      description: '',
      price: '',
      duration_months: null,
      features: [],
    });
    setFeatureInput('');
    setEditingPackage(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    onOpen();
  };

  const handleOpenEdit = (pkg: GymPackage) => {
    setEditingPackage(pkg);
    setFormData({
      package_type: pkg.package_type,
      name: pkg.name,
      name_english: pkg.name_english || '',
      description: pkg.description || '',
      price: pkg.price.toString(),
      duration_months: pkg.duration_months ?? null,
      features: pkg.features || [],
    });
    onOpen();
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitPackage = async () => {
    try {
      if (!formData.package_type || !formData.name || !formData.price) {
        toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }

      if (formData.package_type === 'package' && !formData.duration_months) {
        toast.error('กรุณาเลือกระยะเวลาแพ็คเกจ');
        return;
      }

      const url = editingPackage
        ? `/api/partner/packages/${editingPackage.id}`
        : '/api/partner/packages';

      const method = editingPackage ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_type: formData.package_type,
          name: formData.name,
          name_english: formData.name_english || null,
          description: formData.description || null,
          price: parseFloat(formData.price),
          duration_months: formData.package_type === 'package' ? formData.duration_months : null,
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
        toast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleToggleActive = async (pkg: GymPackage) => {
    try {
      const response = await fetch(`/api/partner/packages/${pkg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !pkg.is_active }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(pkg.is_active ? 'ปิดการใช้งานแพ็คเกจแล้ว' : 'เปิดใช้งานแพ็คเกจแล้ว');
        loadPackages();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error toggling package:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleDeletePackage = async (pkg: GymPackage) => {
    if (!confirm(`คุณต้องการลบแพ็คเกจ "${pkg.name}" หรือไม่?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/partner/packages/${pkg.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('ลบแพ็คเกจสำเร็จ');
        loadPackages();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

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
      toast.success('บันทึกข้อมูลสำเร็จ!');
    } catch {
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  // Menu items for sidebar
  const menuItems: MenuItem[] = [
    { label: 'Dashboard', href: '/partner/dashboard', icon: HomeIcon },
    { label: 'รายการจอง', href: '/partner/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'สถิติ', href: '/partner/dashboard/analytics', icon: ChartBarIcon },
  ];

  const oneTimePackages = packages.filter(p => p.package_type === 'one_time');
  const subscriptionPackages = packages.filter(p => p.package_type === 'package');

  const getStatusChip = (status?: string) => {
    const statusConfig = {
      pending: { label: 'รอการตรวจสอบ', color: 'warning' as const },
      approved: { label: 'อนุมัติแล้ว', color: 'success' as const },
      rejected: { label: 'ไม่อนุมัติ', color: 'danger' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Chip color={config.color} variant="flat" size="lg">
        {config.label}
      </Chip>
    );
  };

  // Mock booking data
  const mockBookings = [
    {
      id: '1',
      customer: 'สมชาย ใจดี',
      service: 'มวยไทย - Private Class',
      date: '2024-10-20',
      time: '10:00-11:00',
      status: 'confirmed',
      amount: '฿500',
    },
    {
      id: '2',
      customer: 'สมหญิง รักสุข',
      service: 'คลาสกลุ่ม',
      date: '2024-10-21',
      time: '14:00-15:00',
      status: 'pending',
      amount: '฿300',
    },
  ];

  // Mock transaction data
  const mockTransactions = [
    {
      id: 'TXN001',
      date: '2024-10-20',
      type: 'รายได้',
      description: 'การจอง Private Class - สมชาย ใจดี',
      amount: '+฿500',
      status: 'completed',
    },
    {
      id: 'TXN002',
      date: '2024-10-19',
      type: 'ถอนเงิน',
      description: 'ถอนเงินเข้าบัญชี xxx-xxx-1234',
      amount: '-฿5,000',
      status: 'completed',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle={gym?.gym_name || 'แดชบอร์ดพาร์ทเนอร์'}
        headerSubtitle="จัดการยิมและดูสถิติของคุณ"
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!gym) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="แดชบอร์ดพาร์ทเนอร์"
        headerSubtitle="จัดการยิมและดูสถิติของคุณ"
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
  if (gym.status === 'pending') {
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
            <div className="bg-gradient-to-br from-yellow-900/20 to-zinc-800 p-8 border-2 border-yellow-600 rounded-2xl text-center">
              <div className="flex justify-center mb-4">
                <ClockIcon className="w-20 h-20 text-yellow-500 animate-pulse" />
              </div>
              <h1 className="mb-2 font-bold text-white text-3xl">
                รอการตรวจสอบ
              </h1>
              <p className="mt-2 text-zinc-300 text-lg">
                ทีมงานกำลังตรวจสอบข้อมูลของคุณ กรุณารอการติดต่อกลับภายใน 3-5 วันทำการ
              </p>
            </div>

            {/* Gym Information */}
            <div className="space-y-4 bg-zinc-950 p-6 rounded-lg">
              <h2 className="mb-4 font-semibold text-white text-xl">ข้อมูลที่ส่งมา</h2>

              <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                <div>
                  <p className="text-zinc-400 text-sm">ชื่อยิม</p>
                  <p className="font-medium text-white">{gym.gym_name}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">ผู้ติดต่อ</p>
                  <p className="font-medium text-white">{gym.contact_name}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">เบอร์โทรศัพท์</p>
                  <p className="font-mono font-medium text-white">{gym.phone}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">อีเมล</p>
                  <p className="font-mono font-medium text-white">{gym.email}</p>
                </div>
                {gym.location && (
                  <div className="md:col-span-2">
                    <p className="text-zinc-400 text-sm">ที่อยู่</p>
                    <p className="font-medium text-white">{gym.location}</p>
                  </div>
                )}
              </div>

              {gym.services && gym.services.length > 0 && (
                <div>
                  <p className="mb-2 text-zinc-400 text-sm">บริการ</p>
                  <div className="flex flex-wrap gap-2">
                    {gym.services.map((service, index) => (
                      <span key={index} className="bg-purple-600/20 px-3 py-1 border border-purple-500 rounded-full text-purple-400 text-sm">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {gym.images && gym.images.length > 0 && (
                <div>
                  <p className="mb-2 text-zinc-400 text-sm">รูปภาพ</p>
                  <div className="gap-3 grid grid-cols-2 md:grid-cols-4">
                    {gym.images.map((image, index) => (
                      <div key={index} className="relative w-full h-24">
                        <Image
                          src={image}
                          alt={`Gym image ${index + 1}`}
                          fill
                          className="rounded-lg object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                as={Link}
                href="/"
                variant="bordered"
                size="lg"
              >
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
      headerTitle={gym.gym_name}
      headerSubtitle="จัดการยิมและดูสถิติของคุณ"
      roleLabel="พาร์ทเนอร์"
      roleColor="secondary"
      userEmail={user?.email}
    >
      <Toaster />
      {/* Status & Quick Actions */}
      <section className="mb-8">
        <div className="flex sm:flex-row flex-col justify-between items-start gap-4 mb-6">
          <div>
            <h2 className="mb-2 font-bold text-white text-2xl">สถานะยิม</h2>
            {getStatusChip(gym.status)}
          </div>
          <div className="flex gap-3">
            <Button
              as={Link}
              href={`/gyms/${gym.id}`}
              variant="bordered"
              startContent={<EyeIcon className="w-5 h-5" />}
            >
              ดูหน้ายิม
            </Button>
          </div>
        </div>
      </section>

      {/* Gym Information */}
      <section className="mb-8">
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
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardBody className="gap-6">
            {isEditing ? (
              <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                <CustomInput
                  id="gym_name"
                  label="ชื่อยิม"
                  value={editFormData.gym_name}
                  onChange={(e) => setEditFormData({ ...editFormData, gym_name: e.target.value })}
                />
                <CustomInput
                  id="contact_name"
                  label="ผู้ติดต่อ"
                  value={editFormData.contact_name}
                  onChange={(e) => setEditFormData({ ...editFormData, contact_name: e.target.value })}
                />
                <CustomInput
                  id="phone"
                  label="โทรศัพท์"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
                <CustomInput
                  id="email"
                  label="อีเมล"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
                <CustomTextarea
                  id="location"
                  label="ที่อยู่"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="md:col-span-2"
                />
                <CustomTextarea
                  id="gym_details"
                  label="รายละเอียดยิม"
                  value={editFormData.gym_details || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, gym_details: e.target.value })}
                  className="md:col-span-2"
                />
              </div>
            ) : (
              <>
                <div className="gap-8 grid grid-cols-1 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <h4 className="mb-1 font-semibold text-white text-sm">ชื่อยิม</h4>
                      <p className="text-default-400">{gym.gym_name}</p>
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-white text-sm">ผู้ติดต่อ</h4>
                      <p className="text-default-400">{gym.contact_name}</p>
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-white text-sm">โทรศัพท์</h4>
                      <p className="font-mono text-default-400">{gym.phone}</p>
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-white text-sm">อีเมล</h4>
                      <p className="font-mono text-default-400">{gym.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="mb-1 font-semibold text-white text-sm">ที่อยู่</h4>
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
                  </div>
                </div>

                {gym.images && gym.images.length > 0 && (
                  <div className="mt-6">
                    <h4 className="mb-4 font-semibold text-white">รูปภาพ</h4>
                    <div className="gap-4 grid grid-cols-2 md:grid-cols-4">
                      {gym.images.map((image, idx) => (
                        <div key={idx} className="relative rounded-lg w-full h-32 overflow-hidden">
                          <Image
                            src={image}
                            alt={`Gym image ${idx + 1}`}
                            fill
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
            <h2 className="font-bold text-white text-2xl">จัดการแพ็คเกจและราคา</h2>
            <p className="text-zinc-400 text-sm">ตั้งค่าแพ็คเกจสำหรับลูกค้าจอง</p>
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
            <h3 className="mb-4 font-semibold text-zinc-300 text-lg">รายครั้ง</h3>
            <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
              {oneTimePackages.map((pkg) => (
                <Card key={pkg.id} className="bg-zinc-950/50 border border-zinc-700">
                  <CardHeader className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{pkg.name}</h4>
                      {pkg.name_english && (
                        <p className="text-zinc-400 text-sm">{pkg.name_english}</p>
                      )}
                    </div>
                    <Chip
                      color={pkg.is_active ? 'success' : 'default'}
                      variant="flat"
                      size="sm"
                    >
                      {pkg.is_active ? 'เปิด' : 'ปิด'}
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
                          <li key={idx} className="flex items-center gap-2 text-zinc-300 text-xs">
                            <CheckIcon className="flex-shrink-0 w-3 h-3 text-green-500" />
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
                        {pkg.is_active ? 'ปิด' : 'เปิด'}
                      </Button>
                      <Button
                        size="sm"
                        color="secondary"
                        variant="flat"
                        isIconOnly
                        onPress={() => handleOpenEdit(pkg)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        isIconOnly
                        onPress={() => handleDeletePackage(pkg)}
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
            <h3 className="mb-4 font-semibold text-zinc-300 text-lg">แพ็คเกจรายเดือน</h3>
            <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
              {subscriptionPackages.map((pkg) => (
                <Card key={pkg.id} className="bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700">
                  <CardHeader className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="inline-flex justify-center items-center bg-purple-600 mb-2 px-3 py-1 rounded-full font-semibold text-white text-xs">
                        {pkg.duration_months} เดือน
                      </div>
                      <h4 className="font-bold text-white">{pkg.name}</h4>
                      {pkg.name_english && (
                        <p className="text-zinc-400 text-xs">{pkg.name_english}</p>
                      )}
                    </div>
                    <Chip
                      color={pkg.is_active ? 'success' : 'default'}
                      variant="flat"
                      size="sm"
                    >
                      {pkg.is_active ? 'เปิด' : 'ปิด'}
                    </Chip>
                  </CardHeader>
                  <CardBody className="gap-4">
                    <div className="text-center">
                      <div className="font-bold text-purple-500 text-3xl">
                        ฿{pkg.price.toLocaleString()}
                      </div>
                      <div className="text-zinc-400 text-xs">
                        (฿{Math.round(pkg.price / (pkg.duration_months || 1)).toLocaleString()}/เดือน)
                      </div>
                    </div>

                    {pkg.description && (
                      <p className="text-zinc-300 text-sm text-center">{pkg.description}</p>
                    )}

                    {pkg.features && pkg.features.length > 0 && (
                      <ul className="space-y-1">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-zinc-300 text-xs">
                            <CheckIcon className="flex-shrink-0 w-3 h-3 text-green-500" />
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
                        {pkg.is_active ? 'ปิด' : 'เปิด'}
                      </Button>
                      <Button
                        size="sm"
                        color="secondary"
                        variant="flat"
                        isIconOnly
                        onPress={() => handleOpenEdit(pkg)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        isIconOnly
                        onPress={() => handleDeletePackage(pkg)}
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
          <Card className="bg-zinc-950/50 border border-zinc-700">
            <CardBody className="py-12 text-center">
              <SparklesIcon className="mx-auto mb-4 w-12 h-12 text-zinc-600" />
              <h3 className="mb-2 font-bold text-white text-lg">ยังไม่มีแพ็คเกจ</h3>
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

      {/* Recent Bookings */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-white text-2xl">การจองล่าสุด</h2>
          <Button
            as={Link}
            href="/partner/dashboard/bookings"
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
            <Table
              aria-label="Recent bookings table"
              classNames={{
                wrapper: "bg-transparent",
              }}
            >
              <TableHeader>
                <TableColumn>ลูกค้า</TableColumn>
                <TableColumn>บริการ</TableColumn>
                <TableColumn>วันที่</TableColumn>
                <TableColumn>เวลา</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>ยอดเงิน</TableColumn>
              </TableHeader>
              <TableBody>
                {mockBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="text-white">{booking.customer}</TableCell>
                    <TableCell className="text-default-400">{booking.service}</TableCell>
                    <TableCell className="text-default-400">{new Date(booking.date).toLocaleDateString('th-TH')}</TableCell>
                    <TableCell className="text-default-400">{booking.time}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={booking.status === 'confirmed' ? 'success' : 'warning'}
                        variant="flat"
                      >
                        {booking.status === 'confirmed' ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
                      </Chip>
                    </TableCell>
                    <TableCell className="font-mono text-white">{booking.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-white text-2xl">ธุรกรรมล่าสุด</h2>
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
            <Table
              aria-label="Recent transactions table"
              classNames={{
                wrapper: "bg-transparent",
              }}
            >
              <TableHeader>
                <TableColumn>รหัส</TableColumn>
                <TableColumn>วันที่</TableColumn>
                <TableColumn>ประเภท</TableColumn>
                <TableColumn>รายละเอียด</TableColumn>
                <TableColumn>จำนวนเงิน</TableColumn>
                <TableColumn>สถานะ</TableColumn>
              </TableHeader>
              <TableBody>
                {mockTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-white">{txn.id}</TableCell>
                    <TableCell className="text-default-400">{new Date(txn.date).toLocaleDateString('th-TH')}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={txn.type === 'รายได้' ? 'success' : 'warning'}
                        variant="flat"
                      >
                        {txn.type}
                      </Chip>
                    </TableCell>
                    <TableCell className="text-default-400">{txn.description}</TableCell>
                    <TableCell className={`font-mono font-bold ${txn.amount.startsWith('+') ? 'text-success' : 'text-warning'}`}>
                      {txn.amount}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={txn.status === 'completed' ? 'success' : 'warning'}
                        variant="flat"
                        startContent={txn.status === 'completed' ? <CheckCircleIcon className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                      >
                        {txn.status === 'completed' ? 'สำเร็จ' : 'รอดำเนินการ'}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
        <ModalContent className="bg-zinc-950 border border-zinc-700">
          <ModalHeader className="text-white">
            {editingPackage ? 'แก้ไขแพ็คเกจ' : 'สร้างแพ็คเกจใหม่'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Package Type */}
              <CustomSelect
                id="package_type"
                label="ประเภทแพ็คเกจ"
                value={formData.package_type}
                onChange={(e) => setFormData(prev => ({ ...prev, package_type: e.target.value as 'one_time' | 'package', duration_months: null }))}
                required
                disabled={!!editingPackage}
              >
                <option value="" disabled>เลือกประเภท</option>
                <option value="one_time">รายครั้ง</option>
                <option value="package">แพ็คเกจรายเดือน</option>
              </CustomSelect>

              {/* Duration (for packages only) */}
              {formData.package_type === 'package' && (
                <CustomSelect
                  id="duration_months"
                  label="ระยะเวลา"
                  value={formData.duration_months?.toString() || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_months: parseInt(e.target.value) }))}
                  required
                >
                  <option value="" disabled>เลือกระยะเวลา</option>
                  <option value="1">1 เดือน</option>
                  <option value="3">3 เดือน</option>
                  <option value="6">6 เดือน</option>
                </CustomSelect>
              )}

              {/* Name */}
              <CustomInput
                id="name"
                label="ชื่อแพ็คเกจ (ภาษาไทย)"
                placeholder="เช่น: ฝึกรายครั้ง, แพ็คเกจ 3 เดือน"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />

              {/* Name English */}
              <CustomInput
                id="name_english"
                label="ชื่อแพ็คเกจ (ภาษาอังกฤษ)"
                placeholder="เช่น: Single Session, 3 Months Package"
                value={formData.name_english}
                onChange={(e) => setFormData(prev => ({ ...prev, name_english: e.target.value }))}
              />

              {/* Price */}
              <CustomInput
                id="price"
                type="number"
                label="ราคา (บาท)"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
              />

              {/* Description */}
              <CustomTextarea
                id="description"
                label="รายละเอียด"
                placeholder="อธิบายรายละเอียดแพ็คเกจ..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                      if (e.key === 'Enter') {
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
                      <div key={idx} className="flex justify-between items-center bg-zinc-700/50 px-3 py-2 rounded">
                        <span className="text-white text-sm">{feature}</span>
                        <Button
                          size="sm"
                          color="danger"
                          variant="light"
                          isIconOnly
                          onPress={() => handleRemoveFeature(idx)}
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
            <Button variant="flat" onPress={() => { onClose(); resetForm(); }}>
              ยกเลิก
            </Button>
            <Button color="secondary" onPress={handleSubmitPackage}>
              {editingPackage ? 'บันทึก' : 'สร้างแพ็คเกจ'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
