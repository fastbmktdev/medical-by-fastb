"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RoleGuard from '@/components/auth/RoleGuard';
import DashboardLayout, { MenuItem } from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
} from '@heroui/react';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeIcon,
  ChevronRightIcon,
  XCircleIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';

interface Stats {
  totalUsers: number;
  totalGyms: number;
  pendingApprovals: number;
  approvedGyms: number;
}

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
}

/**
 * Admin Dashboard
 * 
 * Dashboard for administrators (admin role)
 * Shows system statistics, pending approvals, and admin tools
 */
function AdminDashboardContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalGyms: 0,
    pendingApprovals: 0,
    approvedGyms: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [pendingApplications, setPendingApplications] = useState<GymApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<GymApplication | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Fetch statistics
      const [usersCount, gymsCount, pendingCount, approvedCount] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }),
        supabase.from('gyms').select('*', { count: 'exact', head: true }),
        supabase.from('gyms').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('gyms').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalGyms: gymsCount.count || 0,
        pendingApprovals: pendingCount.count || 0,
        approvedGyms: approvedCount.count || 0,
      });

      // Fetch pending applications
      const { data: applications } = await supabase
        .from('gyms')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      setPendingApplications(applications || []);
    } catch {
      // Silently handle errors
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // Reload data to update counts
        await loadData();
        onClose();
        
        // Show success message
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

  // Menu items for sidebar
  const menuItems: MenuItem[] = [
    { label: 'ภาพรวม', href: '/admin/dashboard', icon: HomeIcon },
    { label: 'จัดการผู้ใช้', href: '/admin/dashboard/users', icon: UsersIcon },
    { label: 'จัดการยิม', href: '/admin/dashboard/gyms', icon: BuildingStorefrontIcon },
    { label: 'อนุมัติยิม', href: '/admin/dashboard/approvals', icon: ClockIcon },
    { label: 'รายงาน', href: '/admin/dashboard/reports', icon: DocumentTextIcon },
    { label: 'สถิติ', href: '/admin/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่าระบบ', href: '/admin/dashboard/settings', icon: Cog6ToothIcon },
  ];

  const statisticsCards = [
    {
      title: 'ผู้ใช้ทั้งหมด',
      value: stats.totalUsers.toString(),
      change: '+0%',
      icon: UsersIcon,
      color: 'primary',
      href: '/admin/dashboard/users',
    },
    {
      title: 'ยิมทั้งหมด',
      value: stats.totalGyms.toString(),
      change: '+0%',
      icon: BuildingStorefrontIcon,
      color: 'success',
      href: '/admin/dashboard/gyms',
    },
    {
      title: 'รออนุมัติ',
      value: stats.pendingApprovals.toString(),
      change: '-',
      icon: ClockIcon,
      color: 'warning',
      href: '/admin/dashboard/approvals',
      highlight: stats.pendingApprovals > 0,
    },
    {
      title: 'อนุมัติแล้ว',
      value: stats.approvedGyms.toString(),
      change: '+0%',
      icon: CheckCircleIcon,
      color: 'secondary',
      href: '/admin/dashboard/gyms',
    },
  ];

  const adminTools = [
    {
      title: 'จัดการผู้ใช้',
      description: 'ดูและจัดการบัญชีผู้ใช้ทั้งหมด',
      icon: UsersIcon,
      href: '/admin/dashboard/users',
      color: 'primary',
    },
    {
      title: 'จัดการยิม',
      description: 'อนุมัติและจัดการยิมพาร์ทเนอร์',
      icon: BuildingStorefrontIcon,
      href: '/admin/dashboard/gyms',
      color: 'success',
    },
    {
      title: 'รายงาน',
      description: 'ดูรายงานและสถิติของระบบ',
      icon: ChartBarIcon,
      href: '/admin/dashboard/reports',
      color: 'secondary',
    },
    {
      title: 'ตั้งค่าระบบ',
      description: 'ตั้งค่าและปรับแต่งระบบ',
      icon: Cog6ToothIcon,
      href: '/admin/dashboard/settings',
      color: 'danger',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="แดชบอร์ดผู้ดูแลระบบ"
        headerSubtitle="จัดการและควบคุมระบบทั้งหมด"
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
      headerTitle="แดชบอร์ดผู้ดูแลระบบ"
      headerSubtitle="จัดการและควบคุมระบบทั้งหมด"
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
      userEmail={user?.email}
    >
      {/* Alert for Pending Approvals */}
      {stats.pendingApprovals > 0 && (
        <Card className="bg-warning/10 backdrop-blur-sm mb-8 border border-warning/30">
          <CardBody className="flex-row items-center gap-4">
            <div className="flex justify-center items-center bg-warning rounded-lg w-12 h-12">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-white">มีรายการรออนุมัติ</h3>
              <p className="text-default-400 text-sm">
                มี {stats.pendingApprovals} ยิมที่รอการอนุมัติจากคุณ
              </p>
            </div>
            <Button
              as={Link}
              href="/admin/dashboard/approvals"
              color="warning"
              variant="flat"
            >
              ดูรายการ
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Statistics Cards */}
      <section className="mb-8">
        <h2 className="mb-6 font-bold text-white text-2xl">สถิติภาพรวม</h2>
        <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {statisticsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                as={Link}
                href={stat.href}
                isPressable
                isHoverable
                className={`bg-default-100/50 backdrop-blur-sm border-none ${
                  stat.highlight ? 'ring-2 ring-warning' : ''
                }`}
              >
                <CardBody className="gap-4">
                  <div className="flex justify-between items-start">
                    <div className={`bg-${stat.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {stat.change !== '-' && (
                      <Chip
                        size="sm"
                        color="success"
                        variant="flat"
                        startContent={<ArrowTrendingUpIcon className="w-3 h-3" />}
                      >
                        {stat.change}
                      </Chip>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-3xl">
                      {stat.value}
                    </h3>
                    <p className="text-default-400 text-sm">
                      {stat.title}
                    </p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pending Applications */}
      {pendingApplications.length > 0 && (
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-white text-2xl">ใบสมัคร Partner ที่รอการอนุมัติ</h2>
            <Button
              as={Link}
              href="/admin/dashboard/approvals"
              color="warning"
              variant="flat"
              size="sm"
              endContent={<ChevronRightIcon className="w-4 h-4" />}
            >
              ดูทั้งหมด ({stats.pendingApprovals})
            </Button>
          </div>
          
          <div className="space-y-4">
            {pendingApplications.map((application) => (
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
                        <Chip color="warning" variant="flat" size="sm">
                          รอการตรวจสอบ
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
                        <div className="flex flex-wrap gap-2 mb-4">
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
                        <div className="flex gap-2">
                          <Button
                            color="primary"
                            size="sm"
                            variant="flat"
                            startContent={<EyeIcon className="w-4 h-4" />}
                            onPress={() => handleViewApplication(application)}
                          >
                            ดูรายละเอียด
                          </Button>
                          <Button
                            color="success"
                            size="sm"
                            onPress={() => {
                              setSelectedApplication(application);
                              handleUpdateStatus('approved');
                            }}
                            startContent={<CheckCircleIcon className="w-4 h-4" />}
                          >
                            อนุมัติ
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            variant="flat"
                            onPress={() => {
                              setSelectedApplication(application);
                              handleUpdateStatus('denied');
                            }}
                            startContent={<XCircleIcon className="w-4 h-4" />}
                          >
                            ปฏิเสธ
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Admin Tools */}
      <section className="mb-8">
        <h2 className="mb-6 font-bold text-white text-2xl">เครื่องมือผู้ดูแล</h2>
        <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
          {adminTools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Card
                key={index}
                as={Link}
                href={tool.href}
                isPressable
                isHoverable
                className="bg-default-100/50 backdrop-blur-sm border-none"
              >
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className={`bg-${tool.color} p-4 rounded-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold text-white text-xl">
                        {tool.title}
                      </h3>
                      <p className="text-default-400 text-sm">
                        {tool.description}
                      </p>
                    </div>
                    <ChevronRightIcon className="w-6 h-6 text-default-400" />
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>

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
                      <Chip color="warning" variant="flat">
                        รอการตรวจสอบ
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
                {selectedApplication && (
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
                      startContent={!isProcessing && <CheckCircleIcon className="w-4 h-4" />}
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

      {/* System Info */}
      <section>
        <h2 className="mb-6 font-bold text-white text-2xl">ข้อมูลระบบ</h2>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <div className="gap-8 grid grid-cols-1 md:grid-cols-3">
              <div className="text-center">
                <p className="mb-2 text-default-400 text-sm">เวอร์ชัน</p>
                <p className="font-mono font-bold text-white text-2xl">v1.0.0</p>
              </div>
              <div className="text-center">
                <p className="mb-2 text-default-400 text-sm">สถานะระบบ</p>
                <Chip color="success" variant="flat">
                  ออนไลน์
                </Chip>
              </div>
              <div className="text-center">
                <p className="mb-2 text-default-400 text-sm">ฐานข้อมูล</p>
                <Chip
                  color="success"
                  variant="flat"
                  startContent={<CheckCircleIcon className="w-4 h-4" />}
                >
                  เชื่อมต่อแล้ว
                </Chip>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>
    </DashboardLayout>
  );
}

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminDashboardContent />
    </RoleGuard>
  );
}
