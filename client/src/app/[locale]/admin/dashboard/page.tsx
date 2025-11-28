"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@shared/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import { Link } from '@/navigation';
import { Card, CardBody, Button, Chip, useDisclosure } from '@heroui/react';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CubeIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';

interface Stats {
  totalUsers: number;
  totalHospitals: number;
  pendingApprovals: number;
  approvedHospitals: number;
  totalProducts: number;
  activeProducts: number;
  totalPromotions: number;
  activePromotions: number;
}

interface HospitalApplication {
  id: string;
  user_id: string;
  hospital_name: string;
  contact_name: string;
  phone: string;
  email: string;
  website?: string;
  location: string;
  hospital_details?: string;
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
    totalHospitals: 0,
    pendingApprovals: 0,
    approvedHospitals: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalPromotions: 0,
    activePromotions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [_pendingApplications, _setPendingApplications] = useState<HospitalApplication[]>([]);
  const [_selectedApplication, _setSelectedApplication] = useState<HospitalApplication | null>(null);
  const { isOpen: _isOpen, onOpen: _onOpen, onClose: _onClose } = useDisclosure();

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Fetch statistics
      const [usersCount, hospitalsCount, pendingCount, approvedCount, productsCount, activeProductsCount, promotionsCount, activePromotionsCount] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }),
        supabase.from('hospitals').select('*', { count: 'exact', head: true }),
        supabase.from('hospitals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('hospitals').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('promotions').select('*', { count: 'exact', head: true }),
        supabase.from('promotions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalHospitals: hospitalsCount.count || 0,
        pendingApprovals: pendingCount.count || 0,
        approvedHospitals: approvedCount.count || 0,
        totalProducts: productsCount.count || 0,
        activeProducts: activeProductsCount.count || 0,
        totalPromotions: promotionsCount.count || 0,
        activePromotions: activePromotionsCount.count || 0,
      });

      // Fetch pending applications
      const { data: applications } = await supabase
        .from('hospitals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      _setPendingApplications(applications || []);
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



  const adminTools = [
    {
      title: 'จัดการผู้ใช้',
      description: 'ดูและจัดการบัญชีผู้ใช้ทั้งหมด',
      icon: UsersIcon,
      href: '/admin/dashboard/users',
      color: 'primary',
    },
    {
      title: 'จัดการโรงพยาบาล',
      description: 'อนุมัติและจัดการโรงพยาบาลพาร์ทเนอร์',
      icon: BuildingStorefrontIcon,
      href: '/admin/dashboard/hospitals',
      color: 'success',
    },
    {
      title: 'จัดการสินค้า',
      description: `จัดการสินค้าทั้งหมด ${stats.totalProducts} รายการ`,
      icon: CubeIcon,
      href: '/admin/dashboard/products',
      color: 'warning',
    },
    {
      title: 'จัดการโปรโมชั่น',
      description: `จัดการโปรโมชั่น ${stats.totalPromotions} รายการ`,
      icon: MegaphoneIcon,
      href: '/admin/dashboard/promotions',
      color: 'secondary',
    },
    {
      title: 'รายงาน',
      description: 'ดูรายงานและสถิติของระบบ',
      icon: ChartBarIcon,
      href: '/admin/dashboard/reports',
      color: 'danger',
    },
    // {
    //   title: 'ตั้งค่าระบบ',
    //   description: 'ตั้งค่าและปรับแต่งระบบ',
    //   icon: Cog6ToothIcon,
    //   href: '/admin/dashboard/settings',
    //   color: 'danger',
    // },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="แดชบอร์ดผู้ดูแลระบบ"
        headerSubtitle="จัดการและควบคุมระบบทั้งหมด"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <div className="border-4 border-red-600 border-t-transparent  w-12 h-12 animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={adminMenuItems}
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
            <div className="flex justify-center items-center bg-warning  w-12 h-12">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-white">มีรายการรออนุมัติ</h3>
              <p className="text-default-400 text-sm">
                มี {stats.pendingApprovals} โรงพยาบาลที่รอการอนุมัติจากคุณ
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

      {/* Quick Stats */}
      <section className="mb-8">
        <h2 className="mb-6 font-semibold text-2xl">สถิติโดยรวม</h2>
        <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-default-400 text-sm">สินค้าทั้งหมด</p>
                  <p className="font-semibold text-2xl">{stats.totalProducts}</p>
                  <p className="text-success text-xs mt-1">เปิดใช้งาน {stats.activeProducts}</p>
                </div>
                <CubeIcon className="w-8 h-8 text-warning" />
              </div>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-default-400 text-sm">โปรโมชั่นทั้งหมด</p>
                  <p className="font-semibold text-2xl">{stats.totalPromotions}</p>
                  <p className="text-success text-xs mt-1">เปิดใช้งาน {stats.activePromotions}</p>
                </div>
                <MegaphoneIcon className="w-8 h-8 text-secondary" />
              </div>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-default-400 text-sm">ผู้ใช้ทั้งหมด</p>
                  <p className="font-semibold text-2xl">{stats.totalUsers}</p>
                </div>
                <UsersIcon className="w-8 h-8 text-primary" />
              </div>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-default-400 text-sm">โรงพยาบาลทั้งหมด</p>
                  <p className="font-semibold text-2xl">{stats.totalHospitals}</p>
                  <p className="text-success text-xs mt-1">อนุมัติแล้ว {stats.approvedHospitals}</p>
                </div>
                <BuildingStorefrontIcon className="w-8 h-8 text-success" />
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Admin Tools */}
      <section className="mb-8">
        <h2 className="mb-6 font-semibold text-2xl">เครื่องมือผู้ดูแล</h2>
        <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
                    <div className={`bg-${tool.color} p-4 `}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold text-xl">
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
        <h2 className="mb-6 font-semibold text-2xl">ข้อมูลระบบ</h2>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <div className="gap-8 grid grid-cols-1 md:grid-cols-3">
              <div className="text-center">
                <p className="mb-2 text-default-400 text-sm">เวอร์ชัน</p>
                <p className="font-mono font-semibold text-2xl">v1.0.0</p>
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
