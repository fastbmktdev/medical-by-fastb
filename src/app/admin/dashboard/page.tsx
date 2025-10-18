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
