"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RoleGuard from '@/components/auth/RoleGuard';
import DashboardLayout, { MenuItem } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardBody,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tabs,
  Tab,
  Spinner,
} from '@heroui/react';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';

interface GymApplication {
  id: string;
  user_id: string;
  gym_name: string;
  contact_name: string;
  phone: string;
  email: string;
  website?: string;
  location: string;
  gym_details?: string;
  services: string[];
  images: string[];
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
  };
}

type ApplicationStatus = 'pending' | 'approved' | 'denied';

function PartnerApprovalsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<GymApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<GymApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<GymApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<ApplicationStatus>('pending');

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // Fetch all applications
        const response = await fetch('/api/partner-applications');
        const result = await response.json();

        if (result.success) {
          setApplications(result.data);
        }
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Filter applications based on active tab
  useEffect(() => {
    const filtered = applications.filter(app => app.status === activeTab);
    setFilteredApplications(filtered);
  }, [applications, activeTab]);

  const menuItems: MenuItem[] = [
    { label: 'ภาพรวม', href: '/admin/dashboard', icon: HomeIcon },
    { label: 'จัดการผู้ใช้', href: '/admin/dashboard/users', icon: UsersIcon },
    { label: 'จัดการยิม', href: '/admin/dashboard/gyms', icon: BuildingStorefrontIcon },
    { label: 'อนุมัติยิม', href: '/admin/dashboard/approvals', icon: ClockIcon },
    { label: 'รายงาน', href: '/admin/dashboard/reports', icon: DocumentTextIcon },
    { label: 'สถิติ', href: '/admin/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่าระบบ', href: '/admin/dashboard/settings', icon: Cog6ToothIcon },
  ];

  const handleViewApplication = (application: GymApplication) => {
    setSelectedApplication(application);
    onOpen();
  };

  const handleUpdateStatus = async (status: 'approved' | 'denied') => {
    if (!selectedApplication) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/partner-applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setApplications(prev =>
          prev.map(app =>
            app.id === selectedApplication.id
              ? { ...app, status }
              : app
          )
        );
        onClose();

        // Show success message (you can add a toast notification here)
        alert(`${status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}ใบสมัครสำเร็จ`);
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('เกิดข้อผิดพลาดในการอัพเดทสถานะ');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'denied':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return 'รอการตรวจสอบ';
      case 'approved':
        return 'อนุมัติแล้ว';
      case 'denied':
        return 'ปฏิเสธแล้ว';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="อนุมัติใบสมัคร Partner"
        headerSubtitle="ตรวจสอบและอนุมัติใบสมัคร Partner Gym"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" color="danger" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle="อนุมัติใบสมัคร Partner"
      headerSubtitle="ตรวจสอบและอนุมัติใบสมัคร Partner Gym"
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
      userEmail={user?.email}
    >
      {/* Statistics Summary */}
      <div className="gap-6 grid grid-cols-1 md:grid-cols-3 mb-8">
        <Card className="bg-warning/10 backdrop-blur-sm border border-warning/30">
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex justify-center items-center bg-warning rounded-lg w-12 h-12">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-default-400 text-sm">รอการตรวจสอบ</p>
                <p className="font-bold text-white text-2xl">
                  {applications.filter(app => app.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-success/10 backdrop-blur-sm border border-success/30">
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex justify-center items-center bg-success rounded-lg w-12 h-12">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-default-400 text-sm">อนุมัติแล้ว</p>
                <p className="font-bold text-white text-2xl">
                  {applications.filter(app => app.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-danger/10 backdrop-blur-sm border border-danger/30">
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex justify-center items-center bg-danger rounded-lg w-12 h-12">
                <XCircleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-default-400 text-sm">ปฏิเสธแล้ว</p>
                <p className="font-bold text-white text-2xl">
                  {applications.filter(app => app.status === 'denied').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs for filtering */}
      <div className="mb-6">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as ApplicationStatus)}
          color="danger"
          variant="underlined"
          classNames={{
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-danger",
            tab: "max-w-fit px-0 h-12",
          }}
        >
          <Tab
            key="pending"
            title={
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                <span>รอการตรวจสอบ</span>
                <Chip size="sm" color="warning" variant="flat">
                  {applications.filter(app => app.status === 'pending').length}
                </Chip>
              </div>
            }
          />
          <Tab
            key="approved"
            title={
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4" />
                <span>อนุมัติแล้ว</span>
                <Chip size="sm" color="success" variant="flat">
                  {applications.filter(app => app.status === 'approved').length}
                </Chip>
              </div>
            }
          />
          <Tab
            key="denied"
            title={
              <div className="flex items-center gap-2">
                <XCircleIcon className="w-4 h-4" />
                <span>ปฏิเสธแล้ว</span>
                <Chip size="sm" color="danger" variant="flat">
                  {applications.filter(app => app.status === 'denied').length}
                </Chip>
              </div>
            }
          />
        </Tabs>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card className="bg-default-100/50 backdrop-blur-sm">
            <CardBody className="py-20 text-center">
              <p className="text-default-400">ไม่มีรายการในหมวดนี้</p>
            </CardBody>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <Card
              key={application.id}
              className="bg-default-100/50 hover:bg-default-100/70 backdrop-blur-sm border-none transition-colors"
            >
              <CardBody>
                <div className="flex sm:flex-row flex-col gap-4">
                  {/* Gym Image */}
                  <div className="flex-shrink-0">
                    {application.images && application.images.length > 0 ? (
                      <div className="relative rounded-lg w-32 h-32 overflow-hidden">
                        <Image
                          src={application.images[0]}
                          alt={application.gym_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center items-center bg-default-200 rounded-lg w-32 h-32">
                        <BuildingStorefrontIcon className="w-12 h-12 text-default-400" />
                      </div>
                    )}
                  </div>

                  {/* Application Details */}
                  <div className="flex-1">
                    <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-2 mb-3">
                      <div>
                        <h3 className="mb-1 font-bold text-white text-xl">
                          {application.gym_name}
                        </h3>
                        <p className="text-default-400 text-sm">
                          โดย {application.contact_name}
                        </p>
                      </div>
                      <Chip
                        color={getStatusColor(application.status)}
                        variant="flat"
                        size="sm"
                      >
                        {getStatusLabel(application.status)}
                      </Chip>
                    </div>

                    <div className="gap-x-6 gap-y-2 grid grid-cols-1 sm:grid-cols-2 mb-3 text-sm">
                      <div className="flex items-center gap-2 text-default-400">
                        <PhoneIcon className="w-4 h-4" />
                        <span>{application.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-default-400">
                        <EnvelopeIcon className="w-4 h-4" />
                        <span className="truncate">{application.email}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2 text-default-400">
                        <MapPinIcon className="w-4 h-4" />
                        <span className="line-clamp-1">{application.location}</span>
                      </div>
                    </div>

                    {application.services && application.services.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {application.services.slice(0, 3).map((service, index) => (
                          <Chip key={index} size="sm" variant="bordered">
                            {service}
                          </Chip>
                        ))}
                        {application.services.length > 3 && (
                          <Chip size="sm" variant="bordered">
                            +{application.services.length - 3}
                          </Chip>
                        )}
                      </div>
                    )}

                    <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3">
                      <p className="text-default-400 text-xs">
                        ส่งเมื่อ: {formatDate(application.created_at)}
                      </p>
                      <Button
                        color="primary"
                        size="sm"
                        variant="flat"
                        startContent={<EyeIcon className="w-4 h-4" />}
                        onPress={() => handleViewApplication(application)}
                      >
                        ดูรายละเอียด
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Application Detail Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="3xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-zinc-900 border border-zinc-800",
          header: "border-b border-zinc-800",
          body: "py-6",
          footer: "border-t border-zinc-800",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-white text-xl">รายละเอียดใบสมัคร</h3>
                {selectedApplication && (
                  <p className="text-default-400 text-sm">
                    {selectedApplication.gym_name}
                  </p>
                )}
              </ModalHeader>
              <ModalBody>
                {selectedApplication && (
                  <div className="space-y-6">
                    {/* Status */}
                    <div>
                      <p className="mb-2 text-default-400 text-sm">สถานะ</p>
                      <Chip
                        color={getStatusColor(selectedApplication.status)}
                        variant="flat"
                      >
                        {getStatusLabel(selectedApplication.status)}
                      </Chip>
                    </div>

                    {/* Images */}
                    {selectedApplication.images && selectedApplication.images.length > 0 && (
                      <div>
                        <p className="mb-3 text-default-400 text-sm">รูปภาพยิม</p>
                        <div className="gap-3 grid grid-cols-2 md:grid-cols-3">
                          {selectedApplication.images.map((image, index) => (
                            <div key={index} className="relative rounded-lg w-full h-40 overflow-hidden">
                              <Image
                                src={image}
                                alt={`${selectedApplication.gym_name} ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact Information */}
                    <div>
                      <h4 className="mb-3 font-semibold text-white">ข้อมูลติดต่อ</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex justify-center items-center bg-default-200 rounded-lg w-10 h-10">
                            <UsersIcon className="w-5 h-5 text-default-600" />
                          </div>
                          <div>
                            <p className="text-default-400 text-xs">ผู้ติดต่อ</p>
                            <p className="text-white">{selectedApplication.contact_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex justify-center items-center bg-default-200 rounded-lg w-10 h-10">
                            <PhoneIcon className="w-5 h-5 text-default-600" />
                          </div>
                          <div>
                            <p className="text-default-400 text-xs">เบอร์โทรศัพท์</p>
                            <p className="font-mono text-white">{selectedApplication.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex justify-center items-center bg-default-200 rounded-lg w-10 h-10">
                            <EnvelopeIcon className="w-5 h-5 text-default-600" />
                          </div>
                          <div>
                            <p className="text-default-400 text-xs">อีเมล</p>
                            <p className="font-mono text-white">{selectedApplication.email}</p>
                          </div>
                        </div>
                        {selectedApplication.website && (
                          <div className="flex items-center gap-3">
                            <div className="flex justify-center items-center bg-default-200 rounded-lg w-10 h-10">
                              <GlobeAltIcon className="w-5 h-5 text-default-600" />
                            </div>
                            <div>
                              <p className="text-default-400 text-xs">เว็บไซต์</p>
                              <p className="font-mono text-white">{selectedApplication.website}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="flex justify-center items-center bg-default-200 rounded-lg w-10 h-10">
                            <MapPinIcon className="w-5 h-5 text-default-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-default-400 text-xs">ที่อยู่</p>
                            <p className="text-white">{selectedApplication.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Services */}
                    {selectedApplication.services && selectedApplication.services.length > 0 && (
                      <div>
                        <h4 className="mb-3 font-semibold text-white">บริการที่มี</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedApplication.services.map((service, index) => (
                            <Chip key={index} color="primary" variant="flat">
                              {service}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    {selectedApplication.gym_details && (
                      <div>
                        <h4 className="mb-3 font-semibold text-white">รายละเอียดเพิ่มเติม</h4>
                        <p className="text-default-300 text-sm whitespace-pre-wrap">
                          {selectedApplication.gym_details}
                        </p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="pt-4 border-zinc-800 border-t">
                      <div className="gap-4 grid grid-cols-2 text-xs">
                        <div>
                          <p className="text-default-400">วันที่สมัคร</p>
                          <p className="text-white">{formatDate(selectedApplication.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-default-400">อัพเดทล่าสุด</p>
                          <p className="text-white">{formatDate(selectedApplication.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                {selectedApplication?.status === 'pending' && (
                  <>
                    <Button
                      color="danger"
                      variant="flat"
                      onPress={() => handleUpdateStatus('denied')}
                      isDisabled={isProcessing}
                      startContent={<XCircleIcon className="w-4 h-4" />}
                    >
                      ปฏิเสธ
                    </Button>
                    <Button
                      color="success"
                      onPress={() => handleUpdateStatus('approved')}
                      isLoading={isProcessing}
                      startContent={<CheckCircleIcon className="w-4 h-4" />}
                    >
                      อนุมัติ
                    </Button>
                  </>
                )}
                <Button color="default" variant="light" onPress={onClose}>
                  ปิด
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
}

export default function PartnerApprovalsPage() {
  return (
    <RoleGuard allowedRole="admin">
      <PartnerApprovalsContent />
    </RoleGuard>
  );
}
