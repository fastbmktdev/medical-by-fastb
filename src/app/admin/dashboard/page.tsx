"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RoleGuard from '@/components/auth/RoleGuard';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Avatar,
  Chip,
  Divider,
} from '@heroui/react';
import {
  ShieldCheckIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';

interface Stats {
  totalUsers: number;
  totalGyms: number;
  pendingApprovals: number;
  approvedGyms: number;
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

  useEffect(() => {
    async function loadData() {
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
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="border-4 border-t-transparent border-red-600 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  const statisticsCards = [
    {
      title: 'ผู้ใช้ทั้งหมด',
      value: stats.totalUsers.toString(),
      change: '+0%',
      icon: UsersIcon,
      color: 'primary',
      href: '/admin/users',
    },
    {
      title: 'ยิมทั้งหมด',
      value: stats.totalGyms.toString(),
      change: '+0%',
      icon: BuildingStorefrontIcon,
      color: 'success',
      href: '/admin/gyms',
    },
    {
      title: 'รออนุมัติ',
      value: stats.pendingApprovals.toString(),
      change: '-',
      icon: ClockIcon,
      color: 'warning',
      href: '/admin/approvals',
      highlight: stats.pendingApprovals > 0,
    },
    {
      title: 'อนุมัติแล้ว',
      value: stats.approvedGyms.toString(),
      change: '+0%',
      icon: CheckCircleIcon,
      color: 'secondary',
      href: '/admin/gyms',
    },
  ];

  const adminTools = [
    {
      title: 'จัดการผู้ใช้',
      description: 'ดูและจัดการบัญชีผู้ใช้ทั้งหมด',
      icon: UsersIcon,
      href: '/admin/users',
      color: 'primary',
    },
    {
      title: 'จัดการยิม',
      description: 'อนุมัติและจัดการยิมพาร์ทเนอร์',
      icon: BuildingStorefrontIcon,
      href: '/admin/gyms',
      color: 'success',
    },
    {
      title: 'รายงาน',
      description: 'ดูรายงานและสถิติของระบบ',
      icon: ChartBarIcon,
      href: '/admin/reports',
      color: 'secondary',
    },
    {
      title: 'ตั้งค่าระบบ',
      description: 'ตั้งค่าและปรับแต่งระบบ',
      icon: Cog6ToothIcon,
      href: '/admin/settings',
      color: 'danger',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-950/30 to-transparent border-white/5 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
          <div className="flex sm:flex-row flex-col items-start gap-6">
            {/* Admin Icon */}
            <Avatar
              size="lg"
              icon={<ShieldCheckIcon className="w-10 h-10" />}
              classNames={{
                base: "bg-gradient-to-br from-red-600 to-red-700",
                icon: "text-white",
              }}
            />

            {/* Admin Info */}
            <div className="flex-1">
              <h1 className="mb-2 font-bold text-white text-3xl md:text-4xl">
                แดชบอร์ดผู้ดูแลระบบ
              </h1>
              <p className="mb-4 text-default-400 text-xl">
                จัดการและควบคุมระบบทั้งหมด
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Chip
                  startContent={<ShieldCheckIcon className="w-4 h-4" />}
                  color="danger"
                  variant="flat"
                >
                  ผู้ดูแลระบบ
                </Chip>
                {stats.pendingApprovals > 0 && (
                  <Chip
                    startContent={<ClockIcon className="w-4 h-4" />}
                    color="warning"
                    variant="solid"
                    className="animate-pulse"
                  >
                    มี {stats.pendingApprovals} รายการรออนุมัติ
                  </Chip>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        {/* Statistics Cards */}
        <section className="mb-12">
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
        <section className="mb-12">
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

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="mb-6 font-bold text-white text-2xl">การดำเนินการด่วน</h2>
          <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
            <Card
              as={Link}
              href="/admin/users"
              isPressable
              isHoverable
              className="bg-default-100/50 backdrop-blur-sm border-none"
            >
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="bg-primary p-3 rounded-lg">
                    <UsersIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">ดูผู้ใช้ทั้งหมด</h3>
                    <p className="text-default-400 text-sm">{stats.totalUsers} ผู้ใช้</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card
              as={Link}
              href="/admin/approvals"
              isPressable
              isHoverable
              className="bg-default-100/50 backdrop-blur-sm border-none"
            >
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="bg-warning p-3 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">อนุมัติยิม</h3>
                    <p className="text-default-400 text-sm">{stats.pendingApprovals} รออนุมัติ</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card
              as={Link}
              href="/admin/reports"
              isPressable
              isHoverable
              className="bg-default-100/50 backdrop-blur-sm border-none"
            >
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="bg-secondary p-3 rounded-lg">
                    <DocumentTextIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">ดูรายงาน</h3>
                    <p className="text-default-400 text-sm">สถิติและรายงาน</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* System Info */}
        <section>
          <h2 className="mb-6 font-bold text-white text-2xl">ข้อมูลระบบ</h2>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-6">
              <div className="gap-8 grid grid-cols-1 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-default-400">เวอร์ชัน</span>
                    <span className="font-mono text-white">v1.0.0</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between items-center">
                    <span className="text-default-400">สถานะระบบ</span>
                    <Chip color="success" variant="flat" size="sm">
                      ออนไลน์
                    </Chip>
                  </div>
                  <Divider />
                  <div className="flex justify-between items-center">
                    <span className="text-default-400">ฐานข้อมูล</span>
                    <Chip
                      color="success"
                      variant="flat"
                      size="sm"
                      startContent={<CheckCircleIcon className="w-4 h-4" />}
                    >
                      เชื่อมต่อแล้ว
                    </Chip>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-default-400">ผู้ดูแล</span>
                    <span className="font-mono text-white">{user?.email?.split('@')[0]}</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between items-center">
                    <span className="text-default-400">สิทธิ์</span>
                    <Chip
                      color="danger"
                      variant="flat"
                      size="sm"
                      startContent={<ShieldCheckIcon className="w-4 h-4" />}
                    >
                      Admin
                    </Chip>
                  </div>
                  <Divider />
                  <div className="flex justify-between items-center">
                    <span className="text-default-400">เข้าสู่ระบบล่าสุด</span>
                    <span className="text-white">{new Date().toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminDashboardContent />
    </RoleGuard>
  );
}
